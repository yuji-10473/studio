'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { initializeFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

/**
 * A server action to check if the Gemini API key is valid and write the response to Firestore.
 * It makes a basic request to the Gemini model and logs the output.
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
    const ai = genkit({
      plugins: [googleAI({ apiKey, apiVersion: 'v1' })],
    });
    // Per AI_Rules.md, we must use gemini-2.5-flash.
    const model = googleAI.model('gemini-2.5-flash');

    const response = await ai.generate({
      model,
      prompt: 'Hello',
      config: {
        temperature: 0,
        maxOutputTokens: 50,
      },
    });

    const aiResponseText = response.text;

    if (!aiResponseText) {
      const fullResponse = JSON.stringify(response, null, 2);
      return {
        success: false,
        message: `AIからテキスト応答がありませんでした。完全な応答:\n${fullResponse}`,
      };
    }

    // Write the successful response to Firestore for debugging
    const { firestore } = initializeFirebase();
    const debugCollectionRef = collection(firestore, 'debug_writes');
    await addDoc(debugCollectionRef, {
      testName: 'checkApiKey',
      response: aiResponseText,
      timestamp: serverTimestamp(),
    });

    return {
      success: true,
      message: 'APIキーは有効です。応答がFirestoreの `debug_writes` に書き込まれました。',
    };
  } catch (error) {
    console.error('API Key Check Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Try to log the error to Firestore as well
    try {
      const { firestore } = initializeFirebase();
      const debugCollectionRef = collection(firestore, 'debug_writes');
      await addDoc(debugCollectionRef, {
        testName: 'checkApiKey_Error',
        error: errorMessage,
        timestamp: serverTimestamp(),
      });
    } catch (dbError) {
      console.error('Failed to log API check error to Firestore:', dbError);
    }

    return {
      success: false,
      message: `テスト中にエラーが発生しました:\n${errorMessage}`,
    };
  }
}
