'use server';

import type { Character } from '@/lib/types';
import { isGenkitError } from '@/lib/genkit';
import { initializeFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { dynamicCharacterIntroduction } from '@/ai/flows/dynamic-character-introduction';

export async function getAiResponse(
  character: Character,
  userMessage: string
): Promise<{ success: boolean; message: string }> {
    const { firestore } = initializeFirebase();
    const conversationsCollection = collection(firestore, 'conversations');

  const logData: any = {
        characterName: character.name,
        characterIntroduction: character.introduction,
        characterDescription: character.description,
        userMessage: userMessage,
        timestamp: serverTimestamp(),
  };

  try {
    const response = await dynamicCharacterIntroduction({
      characterName: character.name,
      characterIntroduction: character.introduction,
      characterDescription: character.description,
      userMessage: userMessage,
    });

    const aiMessage = response.aiResponse;

    if (!aiMessage) {
        throw new Error('AIから空の応答が返されました。');
    }
    
    logData.response = aiMessage;
    
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
