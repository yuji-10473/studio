'use server';

import { initializeFirebase } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import type { Character } from '@/lib/types';

export async function createCharacter(characterData: Omit<Character, 'id' | 'imageId'>): Promise<{ success: boolean; message: string, id?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const charactersCollectionRef = collection(firestore, 'characters');
    
    const newCharacterData: Character = {
        ...characterData,
        imageId: 'new-character-image', // Assign a generic placeholder
    };

    const docRef = await addDoc(charactersCollectionRef, newCharacterData);

    return { success: true, message: 'キャラクターを作成しました。', id: docRef.id };
  } catch (error) {
    console.error('Error creating character:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `キャラクターの作成中にエラーが発生しました:\n${errorMessage}` };
  }
}
