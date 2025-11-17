'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import type { Character } from '@/lib/types';
import { initializeFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function getAiResponse(
  character: Character,
  userMessage: string
): Promise<{ success: boolean; message: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
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

  try {
    // Re-initialize genkit with the API key, similar to the working debug action.
    const ai = genkit({
      plugins: [googleAI({ apiKey, apiVersion: 'v1' })],
    });
    // Per AI_Rules.md, we must use gemini-2.5-flash.
    const model = googleAI.model('gemini-2.5-flash');

    const response = await ai.generate({
      model,
      prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 200,
      },
    });

    const aiMessage = response.text;

    if (!aiMessage) {
        throw new Error('AIから空の応答が返されました。');
    }

    // Log conversation to Firestore for debugging
    const { firestore } = initializeFirebase();
    await addDoc(collection(firestore, 'conversations'), {
        characterName: character.name,
        userMessage: userMessage,
        aiResponse: aiMessage,
        timestamp: serverTimestamp(),
    });

    return { success: true, message: aiMessage };
  } catch (error) {
    console.error('Error getting AI response:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Also log errors to Firestore
     try {
        const { firestore } = initializeFirebase();
        await addDoc(collection(firestore, 'conversations_errors'), {
            characterName: character.name,
            userMessage: userMessage,
            error: errorMessage,
            timestamp: serverTimestamp(),
        });
    } catch (dbError) {
        console.error("Failed to log error to Firestore:", dbError);
    }


    return {
      success: false,
      message: `AIの応答生成中にエラーが発生しました:\n${errorMessage}`,
    };
  }
}
