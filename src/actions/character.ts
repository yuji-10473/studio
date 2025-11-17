'use server';

import { initializeFirebase } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import type { Character } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export async function createCharacter(characterData: Omit<Character, 'id' | 'imageId'>): Promise<{ success: boolean; message: string, id?: string }> {
  const { firestore } = initializeFirebase();
  const charactersCollectionRef = collection(firestore, 'characters');
  
  const newCharacterData: Omit<Character, 'id'> = {
      ...characterData,
      imageId: 'new-character-image', // Assign a generic placeholder
  };

  try {
    const docRef = await addDoc(charactersCollectionRef, newCharacterData)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: charactersCollectionRef.path,
            operation: 'create',
            requestResourceData: newCharacterData,
        }, serverError);
        // Emit the error so the dev overlay can pick it up
        errorEmitter.emit('permission-error', permissionError);
        // Also throw it to be caught by the local try/catch
        throw permissionError;
      });

    return { success: true, message: 'キャラクターを作成しました。', id: docRef.id };
  } catch (error) {
    console.error('Error creating character:', error);
    // Return the specific permission error message if it's our custom type
    if (error instanceof FirestorePermissionError) {
        return { success: false, message: `キャラクターの作成に失敗しました: ${error.message}` };
    }
    // Generic error message for other cases
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `キャラクターの作成中にエラーが発生しました:\n${errorMessage}` };
  }
}
