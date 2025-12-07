
'use server';

import type { Character, Message, UserProfile } from '@/lib/types';
import { isGenkitError } from '@/lib/genkit';
import { initializeFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { dynamicCharacterIntroduction } from '@/ai/flows/dynamic-character-introduction';
import { guideConversation } from '@/ai/flows/guide-conversation';
import { headers } from 'next/headers';


/**
 * 構造化ログをコンソールに出力します。
 * @param severity ログの重要度
 * @param message ログメッセージ
 * @param context 追加情報
 */
function log(severity: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG' | 'CRITICAL', message: string, context: Record<string, any> = {}) {
  let actionId = null;
  try {
    // This function might be called in contexts where headers() is not available (e.g. during build).
    // Safely try to get the actionId.
    const headerList = headers();
    actionId = headerList.get('next-action');
  } catch (error) {
    // Expected error when not in a request context, can be ignored.
  }
  
  const logEntry = { severity, message, ...context, actionId };
  if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
  } else {
      if (severity === 'ERROR' || severity === 'CRITICAL') {
        console.error(logEntry);
      } else {
        console.log(logEntry);
      }
  }
}


export async function getAiResponse(
  characterOrFormData: Character | FormData,
  userMessage?: string,
  conversationHistory?: Message[],
  userProfile?: UserProfile,
): Promise<{ success: boolean; message: string; loveScore?: number }> {
  const { firestore } = initializeFirebase();
  const conversationsCollection = collection(firestore, 'conversations_errors');
  
  let character: Character;
  let flowInput: any;

  // This check determines if the action was called from an external fetch (like our E2E test)
  // or from within the application. `instanceof FormData` can be unreliable across environments.
  // A more robust check is to see if it has a method that FormData has, like `get`.
  const isExternalCall = typeof (characterOrFormData as any).get === 'function';

  if (isExternalCall) {
    const formData = characterOrFormData as FormData;
    try {
        const parsedCharacter = JSON.parse(formData.get('character') as string);
        const parsedUserMessage = JSON.parse(formData.get('userMessage') as string);
        const parsedConversationHistory = JSON.parse(formData.get('conversationHistory') as string);
        const parsedUserProfile = JSON.parse(formData.get('userProfile') as string);
        
        character = parsedCharacter;

        flowInput = {
            characterName: character.name,
            characterIntroduction: character.introduction,
            userMessage: parsedUserMessage,
            conversationHistory: parsedConversationHistory,
            userProfile: parsedUserProfile,
        };
         log('INFO', 'getAiResponse called externally (E2E Test).', { receivedArgs: { character: true, userMessage: true, conversationHistory: true, userProfile: true } });
    } catch(e) {
        const error = e instanceof Error ? e : new Error(String(e));
        log('ERROR', 'Failed to parse FormData in getAiResponse.', { error: error.message });
        return { success: false, message: `Failed to parse arguments from FormData: ${error.message}` };
    }
  } else {
    // Called internally
    character = characterOrFormData as Character;
    flowInput = {
      characterName: character.name,
      characterIntroduction: character.introduction,
      userMessage: userMessage,
      conversationHistory: conversationHistory,
      userProfile: userProfile,
    };
    log('INFO', 'getAiResponse called internally.');
  }
  
  log('DEBUG', 'getAiResponse action called.', { requestPayload: flowInput });


  const logData: any = {
    flow: 'dynamicCharacterIntroduction',
    request: {}, // To be populated later
    timestamp: serverTimestamp(),
  };

  try {
    const response = await dynamicCharacterIntroduction(flowInput);
    
    logData.request = {
        ...flowInput,
        renderedPrompt: response.prompt,
    };
    
    const aiMessage = response.aiResponse;
    const loveScore = response.loveScore;
    const rawResponse = response.rawResponse;

    if (!aiMessage && aiMessage !== "") { 
        const finishReason = rawResponse?.candidates?.[0]?.finishReason;
        if (finishReason === 'MAX_TOKENS' || finishReason === 'LENGTH') {
            throw new Error('AIの応答が長すぎるため、途中で中断されました。入力する文字数を減らして、もう一度試してください。');
        }
        throw new Error('AIから空の応答が返されました。');
    }
    
    log('INFO', 'getAiResponse action successful.', { response: { success: true, message: aiMessage, loveScore }});
    return { success: true, message: aiMessage, loveScore };

  } catch (error) {
    console.error('Error getting AI response:', error);
    let errorMessage = error instanceof Error ? error.message : String(error);

    const is503Error = errorMessage.includes('503') || errorMessage.includes('Service Unavailable');
    
    if (is503Error) {
        errorMessage = 'AIが現在混み合っています。少し時間をおいてから、もう一度試してみてください。';
    } else if (isGenkitError(error)) {
        errorMessage = `API Error (${error.code}): ${error.message}`;
        if (error.cause) {
            errorMessage += `\nCause: ${JSON.stringify(error.cause, null, 2)}`;
        }
    }
    
    logData.request = flowInput;
    logData.error = errorMessage;
    
    try {
        await addDoc(conversationsCollection, logData);
    } catch (dbError) {
        console.error("Error logging failed AI response to Firestore:", dbError);
        const permissionError = new FirestorePermissionError({
            path: conversationsCollection.path,
            operation: 'create',
            requestResourceData: logData,
        }, dbError);
        errorEmitter.emit('permission-error', permissionError);
    }


    log('ERROR', 'getAiResponse action failed.', { error: errorMessage });
    return {
      success: false,
      message: `AIの応答生成中にエラーが発生しました:\n${errorMessage}`,
    };
  }
}

export async function getGuideResponse(
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; content: string }[]
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await guideConversation({ userMessage, conversationHistory });
    const aiMessage = response.aiResponse;

    if (!aiMessage && aiMessage !== '') {
      throw new Error('AIから空の応答が返されました。');
    }
    return { success: true, message: aiMessage };
  } catch (error)
 {
    console.error('Error getting guide AI response:', error);
    let errorMessage =
      error instanceof Error ? error.message : String(error);
    if (isGenkitError(error)) {
      errorMessage = `API Error (${error.code}): ${error.message}`;
    }
    return {
      success: false,
      message: `AIの応答生成中にエラーが発生しました:\n${errorMessage}`,
    };
  }
}
