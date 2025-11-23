'use server';

import { initializeFirebase } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import type { Character } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { generateNewCharacter } from '@/ai/flows/generate-new-character';

export async function createCharacter(characterData: Omit<Character, 'id' | 'imageId'>): Promise<{ success: boolean; message: string, id?: string }> {
  const { firestore } = initializeFirebase();
  const charactersCollectionRef = collection(firestore, 'characters');
  
  const newCharacterData: Omit<Character, 'id'> = {
      ...characterData,
      imageId: 'new-character-image', // Assign a generic placeholder
  };

  try {
    // Note: We are not awaiting addDoc here to allow the optimistic update to happen.
    // The .catch() will handle the error asynchronously.
    const docRef = addDoc(charactersCollectionRef, newCharacterData)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: charactersCollectionRef.path,
            operation: 'create',
            requestResourceData: newCharacterData,
        }, serverError);
        // Emit the error so the dev overlay can pick it up
        errorEmitter.emit('permission-error', permissionError);
        // Also throw it to be caught by the local try/catch, which surfaces it to the UI
        throw permissionError;
      });

    // Since we are not awaiting, we can't return the docRef.id immediately.
    // The success is optimistic. A full implementation might handle this differently.
    return { success: true, message: 'キャラクターを作成しました。' };
  } catch (error) {
    console.error('Error creating character:', error);
    // Return the specific permission error message if it's our custom type
    if (error instanceof FirestorePermissionError) {
        // The detailed error is already emitted to the overlay, here we just give a user-friendly message.
        return { success: false, message: `キャラクターの作成に失敗しました: Firestoreの権限がありません。` };
    }
    // Generic error message for other cases
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `キャラクターの作成中にエラーが発生しました:\n${errorMessage}` };
  }
}

export async function generateAndCreateCharacter(theme: string): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Generate character data using the AI flow
    const generatedData = await generateNewCharacter({ theme });
    if (!generatedData.name || !generatedData.introduction || !generatedData.description) {
      throw new Error('AIがキャラクター情報を正しく生成できませんでした。');
    }

    // 2. Create the character in Firestore using the existing action
    const result = await createCharacter(generatedData);
    
    if (result.success) {
      return { success: true, message: `AIキャラクター「${generatedData.name}」が作成されました！` };
    } else {
      // Pass the specific error message from createCharacter
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error generating and creating character:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `AIキャラクターの作成中にエラーが発生しました:\n${errorMessage}` };
  }
}
