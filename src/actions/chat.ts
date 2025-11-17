'use server';

import type { Character, Message } from '@/lib/types';
import { isGenkitError } from '@/lib/genkit';
import { initializeFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { dynamicCharacterIntroduction } from '@/ai/flows/dynamic-character-introduction';

export async function getAiResponse(
  character: Character,
  userMessage: string,
  conversationHistory: Message[]
): Promise<{ success: boolean; message: string; sentimentScore?: number }> {
  const { firestore } = initializeFirebase();
  const conversationsCollection = collection(firestore, 'conversations_errors');

  const flowInput = {
    characterName: character.name,
    characterIntroduction: character.introduction,
    userMessage: userMessage,
    conversationHistory: conversationHistory,
  };

  const logData: any = {
    flow: 'dynamicCharacterIntroduction',
    request: {}, // To be populated later
    timestamp: serverTimestamp(),
  };

  try {
    const response = await dynamicCharacterIntroduction(flowInput);
    
    // Populate the full request payload for logging
    logData.request = {
        ...flowInput,
        renderedPrompt: response.prompt,
    };
    
    const aiMessage = response.aiResponse;
    const sentimentScore = response.sentimentScore;
    const rawResponse = response.rawResponse;

    // Log success with full response - REMOVED FOR COST SAVING
    // logData.response = {
    //     text: aiMessage,
    //     sentimentScore,
    //     fullResponse: JSON.parse(JSON.stringify(rawResponse))
    // };
    
    // addDoc(conversationsCollection, logData).catch(async (dbError) => {
    //     const permissionError = new FirestorePermissionError({
    //         path: conversationsCollection.path,
    //         operation: 'create',
    //         requestResourceData: logData,
    //     }, dbError);
    //     errorEmitter.emit('permission-error', permissionError);
    // });

    if (!aiMessage && aiMessage !== "") { // Handle cases where the AI returns an empty string
        const finishReason = rawResponse?.candidates?.[0]?.finishReason;
        if (finishReason === 'MAX_TOKENS' || finishReason === 'LENGTH') {
            throw new Error('AIの応答が長すぎるため、途中で中断されました。入力する文字数を減らして、もう一度試してください。');
        }
        throw new Error('AIから空の応答が返されました。');
    }

    return { success: true, message: aiMessage, sentimentScore };

  } catch (error) {
    console.error('Error getting AI response:', error);
    let errorMessage = error instanceof Error ? error.message : String(error);

     if (isGenkitError(error)) {
        errorMessage = `API Error (${error.code}): ${error.message}`;
        if (error.cause) {
            errorMessage += `\nCause: ${JSON.stringify(error.cause, null, 2)}`;
        }
    }
    
    // Populate request data even on error, if possible
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

    return {
      success: false,
      message: `AIの応答生成中にエラーが発生しました:\n${errorMessage}`,
    };
  }
}
