'use server';

import { initializeFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

/**
 * A simple server action to test writing to Firestore.
 */
export async function testFirestoreWrite(): Promise<{ success: boolean; message: string }> {
  try {
    const { firestore } = initializeFirebase();
    const testCollectionRef = collection(firestore, 'debug_writes');
    
    const docRef = await addDoc(testCollectionRef, {
      message: 'Hello from Server Action!',
      createdAt: serverTimestamp(),
    });

    console.log('Document written with ID: ', docRef.id);

    return { success: true, message: `ドキュメント (ID: ${docRef.id}) の書き込みに成功しました。` };
  } catch (error) {
    console.error('Firestore Write Test Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      message: `Firestoreの書き込みテスト中にエラーが発生しました:\n${errorMessage}`,
    };
  }
}
