
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

  console.log(`[ACCESS_LOG] Attempting to write to Firestore collection: '${charactersCollectionRef.path}'`);

  const finalData: Omit<Character, 'id'> = {
    ...characterData,
    unlockedBy: [],
  };
  
  try {
    const docRef = await addDoc(charactersCollectionRef, finalData);
    return { success: true, message: 'キャラクターを作成しました。', id: docRef.id };
  } catch (error) {
    console.error('Error creating character:', error);
    
    // Generate and emit a detailed permission error for the debug overlay.
    const permissionError = new FirestorePermissionError({
        path: charactersCollectionRef.path,
        operation: 'create',
        requestResourceData: finalData,
    }, error);
    errorEmitter.emit('permission-error', permissionError);

    // Return a more informative message to the user UI.
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
        success: false, 
        message: `キャラクターの作成中にエラーが発生しました。パス: '${charactersCollectionRef.path}'.\n詳細は開発者コンソールまたはエラーオーバーレイを確認してください。\nError: ${errorMessage}` 
    };
  }
}

export async function generateAndCreateCharacter(theme: string): Promise<{ success: boolean; message: string }> {
  try {
    const generatedData = await generateNewCharacter({ theme });
    if (!generatedData.name || !generatedData.introduction || !generatedData.description) {
      throw new Error('AIがキャラクター情報を正しく生成できませんでした。');
    }

    const newCharacter: Omit<Character, 'id'> = {
      ...generatedData,
      imagePath: '/images/icons/icon5.png',
      isLocked: true,
      unlockCost: 20,
    };

    const result = await createCharacter(newCharacter);
    
    if (result.success) {
      return { success: true, message: `AIキャラクター「${generatedData.name}」が作成されました！` };
    } else {
      // Pass the detailed error message from createCharacter directly to the UI
      return { success: false, message: `AIキャラクターの作成中にエラーが発生しました: ${result.message}` };
    }
  } catch (error) {
    console.error('Error generating and creating character:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `AIキャラクターの作成中にエラーが発生しました:\n${errorMessage}` };
  }
}

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
