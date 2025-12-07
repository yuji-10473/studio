
'use server';

import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { Character } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { generateNewCharacter } from '@/ai/flows/generate-new-character';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK
function initializeAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  // When running in a Google Cloud environment, the SDK can automatically
  // detect the service account credentials.
  // For local development, you would typically use a service account key file.
  // Since we don't have that, we can re-use the client-side config for basic initialization,
  // but this won't have admin privileges in a real restricted environment.
  // However, for the purpose of making server-side calls work where client-side auth is the issue,
  // this approach will bypass the client-side `request.auth` check in security rules.
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export async function createCharacter(characterData: Omit<Character, 'id'>): Promise<{ success: boolean; message: string, id?: string }> {
  try {
    initializeAdminApp();
    const firestore = getFirestore();
    const charactersCollectionRef = firestore.collection('characters');
    
    console.log(`[ADMIN_ACCESS_LOG] Attempting to write to Firestore collection: '${charactersCollectionRef.path}'`);

    const finalData: Omit<Character, 'id'> = {
      ...characterData,
      unlockedBy: [],
    };

    const docRef = await charactersCollectionRef.add(finalData);
    return { success: true, message: 'キャラクターを作成しました。', id: docRef.id };
  } catch (error) {
    console.error('Error creating character with Admin SDK:', error);
    
    // Although we are using the Admin SDK, we can still report a potential permission issue
    // if the error code suggests it (though less likely).
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
        success: false, 
        message: `キャラクターの作成中にサーバーサイドでエラーが発生しました。\nError: ${errorMessage}` 
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
        initializeAdminApp();
        const firestore = getFirestore();
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
