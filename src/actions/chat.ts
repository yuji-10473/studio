'use server';

import type { Character } from '@/lib/types';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { isGenkitError } from '@/lib/genkit';
import { initializeFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Initialize Genkit and AI model directly in the server action
const apiKey = process.env.GEMINI_API_KEY;
const plugins = [];
if (apiKey) {
  plugins.push(googleAI({ apiKey, apiVersion: 'v1' }));
}
const ai = genkit({ plugins });
// Per AI_Rules.md, we must use gemini-2.5-flash.
const model = googleAI.model('gemini-2.5-flash');


export async function getAiResponse(
  character: Character,
  userMessage: string
): Promise<{ success: boolean; message: string }> {
    const { firestore } = initializeFirebase();
    const conversationsCollection = collection(firestore, 'conversations');

  if (!apiKey) {
    return {
      success: false,
      message: 'GEMINI_API_KEYが設定されていません。.envファイルを確認してください。',
    };
  }

  const prompt = `あなたはこれからロールプレイングゲームのキャラクターとして振る舞います。

# キャラクター設定
名前: ${character.name}
紹介: ${character.introduction}
ペルソナ: ${character.description}

# ルール
- あなたは「${character.name}」です。一人称や口調もキャラクターになりきってください。
- キャラクター設定に忠実に、自然な会話をしてください。
- 会話の中で、自己紹介文（「紹介」の内容）を不自然にならないように織り交ぜてみましょう。毎回言う必要はありません。
- 回答は日本語で、簡潔かつ会話的にしてください。

# ユーザーとの会話
ユーザー: 「${userMessage}」

${character.name}: `;

  const logData: any = {
        characterName: character.name,
        userMessage: userMessage,
        prompt: prompt,
        timestamp: serverTimestamp(),
  };

  try {

    const response = await ai.generate({
      model,
      prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 200,
      },
    });

    const aiMessage = response.text;
    logData.response = aiMessage;
    logData.fullResponse = JSON.stringify(response, null, 2);


    if (!aiMessage) {
        throw new Error('AIから空の応答が返されました。');
    }

    addDoc(conversationsCollection, logData).catch(async (dbError) => {
        const permissionError = new FirestorePermissionError({
            path: conversationsCollection.path,
            operation: 'create',
            requestResourceData: logData,
        }, dbError);
        errorEmitter.emit('permission-error', permissionError);
    });

    return { success: true, message: aiMessage };
  } catch (error) {
    console.error('Error getting AI response:', error);
    let errorMessage = error instanceof Error ? error.message : String(error);

     if (isGenkitError(error)) {
        errorMessage = `API Error (${error.code}): ${error.message}`;
        if (error.cause) {
            errorMessage += `\nCause: ${JSON.stringify(error.cause, null, 2)}`;
        }
    }

    logData.error = errorMessage;
    addDoc(conversationsCollection, logData).catch(async (dbError) => {
        const permissionError = new FirestorePermissionError({
            path: conversationsCollection.path,
            operation: 'create',
            requestResourceData: logData,
        }, dbError);
        errorEmitter.emit('permission-error', permissionError);
    });

    return {
      success: false,
      message: `AIの応答生成中にエラーが発生しました:\n${errorMessage}`,
    };
  }
}
