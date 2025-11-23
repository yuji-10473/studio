
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
  
  const { firestore } = initializeFirebase();
  const debugCollectionRef = collection(firestore, 'debug_writes');
  const requestPayload = {
      model: 'gemini-1.5-flash-latest',
      prompt: 'Hello',
      config: {
        temperature: 0,
        maxOutputTokens: 50,
      },
  };

  try {
    const ai = genkit({
      plugins: [googleAI({ apiKey, apiVersion: 'v1' })],
    });

    const model = googleAI.model(requestPayload.model);

    const response = await ai.generate({
      model,
      prompt: requestPayload.prompt,
      config: requestPayload.config,
    });

    const aiResponseText = response.text;

    await addDoc(debugCollectionRef, {
      testName: 'checkApiKey_Success',
      request: requestPayload,
      response: {
          text: aiResponseText,
          fullResponse: JSON.parse(JSON.stringify(response))
      },
      timestamp: serverTimestamp(),
    });

    if (!aiResponseText) {
      const fullResponse = JSON.stringify(response, null, 2);
       return {
        success: false,
        message: `AIからテキスト応答がありませんでした。詳細はFirestoreの'debug_writes'を確認してください。`,
      };
    }

    return {
      success: true,
      message: 'APIキーは有効です。リクエストとレスポンスがFirestoreの `debug_writes` に書き込まれました。',
    };
  } catch (error) {
    console.error('API Key Check Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log the error to Firestore
    await addDoc(debugCollectionRef, {
      testName: 'checkApiKey_Error',
      request: requestPayload,
      error: errorMessage,
      timestamp: serverTimestamp(),
    }).catch(dbError => {
        // If logging to firestore fails, log it to console.
        console.error('Failed to log API check error to Firestore:', dbError);
    });

    return {
      success: false,
      message: `テスト中にエラーが発生しました。詳細はFirestoreの'debug_writes'を確認してください。:\n${errorMessage}`,
    };
  }
}
