'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * A simple server action to check if the Gemini API key is valid.
 * It makes a basic request to the Gemini model.
 */
export async function checkApiKey(): Promise<{ success: boolean; message: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      message: 'GEMINI_API_KEYが.envファイルに設定されていません。',
    };
  }

  try {
    // We cannot use the global `ai` object from `@/ai/genkit` because
    // it might be configured differently. We create a temporary instance.
    const ai = genkit({
        plugins: [googleAI({ apiKey })],
    });
    const model = googleAI.model('gemini-1.5-flash');

    // Make a simple, non-empty request to validate the key and API access.
    const response = await ai.generate({
        model,
        prompt: 'Hello',
        config: {
            temperature: 0,
            maxOutputTokens: 10,
        },
    });

    // Check if we got any text back.
    if (response.text) {
        return { success: true, message: 'APIキーは有効です。' };
    } else {
        return { success: false, message: 'AIから予期しない応答がありました。' };
    }
  } catch (error) {
    console.error('API Key Check Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      message: `テスト中にエラーが発生しました:\n${errorMessage}`,
    };
  }
}
