
'use server';

import { initializeFirebase } from '@/firebase';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import type { Character } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { generateNewCharacter } from '@/ai/flows/generate-new-character';

export async function createCharacter(characterData: Omit<Character, 'id'>): Promise<{ success: boolean; message: string, id?: string }> {
  const { firestore } = initializeFirebase();
  const charactersCollectionRef = collection(firestore, 'characters');

  const finalData: Omit<Character, 'id'> = {
    ...characterData,
    unlockedBy: [], // Initialize unlockedBy as an empty array
  };
  
  try {
    // We are awaiting the result here to properly catch the error.
    const docRef = await addDoc(charactersCollectionRef, finalData);
    return { success: true, message: 'キャラクターを作成しました。', id: docRef.id };
  } catch (error) {
    console.error('Error creating character:', error);
    
    // Create and emit the detailed permission error for the dev overlay
    const permissionError = new FirestorePermissionError({
        path: charactersCollectionRef.path,
        operation: 'create',
        requestResourceData: finalData,
    }, error); // Pass the original error as the cause
    errorEmitter.emit('permission-error', permissionError);

    // Return a user-friendly message for the UI
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
        success: false, 
        message: `キャラクターの作成中にエラーが発生しました。詳細は開発者コンソールまたはエラーオーバーレイを確認してください。\nError: ${errorMessage}` 
    };
  }
}

export async function generateAndCreateCharacter(theme: string): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Generate character data using the AI flow
    const generatedData = await generateNewCharacter({ theme });
    if (!generatedData.name || !generatedData.introduction || !generatedData.description) {
      throw new Error('AIがキャラクター情報を正しく生成できませんでした。');
    }

    const newCharacter: Omit<Character, 'id'> = {
      ...generatedData,
      imagePath: '/images/icons/icon5.png', // Assign a default icon for AI generated characters
      isLocked: true,
      unlockCost: 20,
    };

    // 2. Create the character in Firestore using the existing action
    const result = await createCharacter(newCharacter);
    
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

/**
 * DEBUG: Toggles the isLocked status of a character.
 * This is an admin-only action.
 */
export async function toggleCharacterLock(characterId: string, isLocked: boolean): Promise<{ success: boolean; message: string }> {
    try {
        const { firestore } = initializeFirebase();
        const characterDocRef = doc(firestore, 'characters', characterId);
        await updateDoc(characterDocRef, {
            isLocked: !isLocked
        });
        return { success: true, message: `キャラクターのロック状態を${!isLocked ? 'ロック' : 'アンロック'}しました。` };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `ロック状態の切り替えに失敗しました: ${errorMessage}` };
    }
}
