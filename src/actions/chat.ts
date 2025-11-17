'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import type { Character } from '@/lib/types';

async function generateText(prompt: string, apiKey: string) {
  // We cannot use the global `ai` object from `@/ai/genkit` because
  // we need to provide the API key dynamically at runtime.
  // Instead, we initialize the Google AI plugin with the provided key.
  const ai = genkit({
    plugins: [googleAI({ apiKey })],
  });
  const model = googleAI.model('gemini-2.5-flash');
  
  const response = await ai.generate({
    model,
    prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 200,
    },
  });

  return response.text;
}

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

  // This prompt is adapted from `src/ai/flows/dynamic-character-introduction.ts`
  // It instructs the AI on how to behave as the character.
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
    const aiMessage = await generateText(prompt, apiKey);
    return { success: true, message: aiMessage };
  } catch (error) {
    console.error('Error getting AI response:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      message: `AIの応答生成中にエラーが発生しました:\n${errorMessage}`,
    };
  }
}
