
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
function log(severity: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG', message: string, context: Record<string, any> = {}) {
  try {
    headers(); 
  } catch (error) {
    // This function might be called in contexts where headers() is not available.
  }
  
  const logEntry = { severity, message, ...context };
  if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
  } else {
      if (severity === 'ERROR') {
        console.error(logEntry);
      } else {
        console.log(logEntry);
      }
  }
}


export async function getAiResponse(
  character: Character,
  userMessage: string,
  conversationHistory: Message[],
  userProfile: UserProfile,
): Promise<{ success: boolean; message: string; loveScore?: number }> {
  const { firestore } = initializeFirebase();
  const conversationsCollection = collection(firestore, 'conversations_errors');
  const headerList = headers();
  const actionId = headerList.get('x-action-id') || headerList.get('Next-Action');

  const flowInput = {
    characterName: character.name,
    characterIntroduction: character.introduction,
    userMessage: userMessage,
    conversationHistory: conversationHistory,
    userProfile: userProfile,
  };
  
  log('INFO', 'getAiResponse action called.', { actionId, requestPayload: flowInput });


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
    
    log('INFO', 'getAiResponse action successful.', { actionId, response: { success: true, message: aiMessage, loveScore }});
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
    addDoc(conversationsCollection, logData).catch(async (dbError) => {
        const permissionError = new FirestorePermissionError({
            path: conversationsCollection.path,
            operation: 'create',
            requestResourceData: logData,
        }, dbError);
        errorEmitter.emit('permission-error', permissionError);
    });

    log('ERROR', 'getAiResponse action failed.', { actionId, error: errorMessage });
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
  } catch (error) {
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
