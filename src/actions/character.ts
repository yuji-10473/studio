
'use server';

import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Character } from '@/lib/types';
import { generateNewCharacter } from '@/ai/flows/generate-new-character';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK at the module level
if (getApps().length === 0) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const adminApp = getApp();
const firestore = getFirestore(adminApp);


export async function createCharacter(characterData: Omit<Character, 'id'>): Promise<{ success: boolean; message: string, id?: string }> {
  try {
    const charactersCollectionRef = firestore.collection('characters');
    
    console.log(`[ADMIN] Attempting to write to Firestore collection: '${charactersCollectionRef.path}'`);

    const finalData: Omit<Character, 'id'> = {
      ...characterData,
      unlockedBy: [],
    };

    const docRef = await charactersCollectionRef.add(finalData);
    return { success: true, message: 'キャラクターを作成しました。', id: docRef.id };
  } catch (error) {
    console.error('Error creating character with Admin SDK:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Return a more detailed error for admins/devs to see in the UI
    return { 
        success: false, 
        message: `キャラクターの作成中にサーバーサイドでエラーが発生しました。\nError: ${errorMessage}` 
    };
  }
}

export async function generateAndCreateCharacter(theme: string): Promise<{ success: boolean; message: string }> {
  const debugLogRef = firestore.collection('debug_character_generation');
  const logPayload: any = {
      theme: theme,
      timestamp: FieldValue.serverTimestamp(),
  };

  try {
    const generatedData = await generateNewCharacter({ theme });
    logPayload.response = generatedData;
    
    const newCharacter: Omit<Character, 'id'> = {
      ...generatedData,
      imagePath: '/images/icons/icon5.png',
      imagePathHighAffection: '/images/icons/icon5.png',
      isLocked: true,
      unlockCost: 20,
    };

    const result = await createCharacter(newCharacter);
    logPayload.creationResult = result;
    
    if (result.success) {
      await debugLogRef.add(logPayload);
      return { success: true, message: `AIキャラクター「${generatedData.name}」が作成されました！` };
    } else {
      // Pass the detailed error message from createCharacter directly to the UI
      logPayload.error = result.message;
      await debugLogRef.add(logPayload);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('Error generating and creating character:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // The Firestore write in the catch block is causing a secondary error.
    // The primary error is already logged to the console, which is sufficient.
    return { success: false, message: `AIキャラクターの作成中にエラーが発生しました:\n${errorMessage}` };
  }
}

export async function toggleCharacterLock(characterId: string, isLocked: boolean): Promise<{ success: boolean; message: string }> {
    try {
        const characterDocRef = firestore.collection('characters').doc(characterId);
        await characterDocRef.update({
            isLocked: !isLocked
        });
        return { success: true, message: `キャラクターのロック状態を${!isLocked ? 'ロック' : 'アンロック'}しました。` };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `ロック状態の切り替えに失敗しました: ${errorMessage}` };
    }
}
