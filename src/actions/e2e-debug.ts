
'use server';

import type { Character, Message, UserProfile } from '@/lib/types';
import { getAiResponse } from './chat';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Cloud Logging向けの構造化ログを出力します。
 * @param severity ログの重要度 (INFO, ERRORなど)
 * @param message ログメッセージ
 * @param context 追加情報
 */
function log(severity: 'INFO' | 'ERROR', message: string, context: Record<string, any> = {}) {
  const logEntry = {
    severity,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  };
  // console.log/errorは自動的にCloud Loggingに転送されます
  if (severity === 'ERROR') {
    console.error(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Simulates an E2E test scenario by fetching a character and user profile,
 * and then calling the getAiResponse server action.
 * This is intended to be called from a debug menu in the UI.
 * @param userId The UID of the user to run the test as.
 */
export async function runE2eTest(userId: string): Promise<{ success: boolean; message: string; data?: any }> {
  log('INFO', 'E2E debug test started.', { userId, testName: 'runE2eTest' });

  // --- Test Data Setup ---
  // Based on E2E_API_SPEC.md, we need a character, userMessage, and userProfile.
  const testCharacter: Character = {
    id: 'elara',
    name: 'エララ',
    introduction: '村の賢いパン屋。いつも焼きたてのパンの香りがする。',
    description: 'あなたは村のパン屋、エララです。温かく、思いやりがあり、村人たちの相談相手になることが多いです。あなたは常にポジティブで、人々の心を温める言葉をかけます。焼きたてのパンの話を交えながら、相手を元気づけてください。',
    imagePath: '/images/icons/icon1.png',
  };
  const testUserMessage = 'こんにちは！いい天気ですね。';
  const testConversationHistory: Message[] = [];
  
  let userProfile: UserProfile;

  // --- Step 1: Get User Profile (Simulating authenticated user) ---
  try {
    const { firestore } = initializeFirebase();
    const userDocRef = doc(firestore, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    userProfile = userDocSnap.data() as UserProfile;
    log('INFO', 'Successfully fetched user profile.', { userId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('ERROR', 'Failed to get user profile.', { userId, error: errorMessage });
    return { 
        success: false, 
        message: `[E2Eデバッグエラー] ユーザープロファイルの取得に失敗しました:\n${errorMessage}` 
    };
  }

  // --- Step 2: Call the AI chat action ---
  try {
    log('INFO', 'Calling getAiResponse action...', { userId, characterName: testCharacter.name });
    const result = await getAiResponse(
      testCharacter,
      testUserMessage,
      testConversationHistory,
      userProfile
    );
    
    log('INFO', 'getAiResponse action finished.', { userId, result });

    if (result.success) {
      const responseData = {
        request: {
          character: testCharacter.name,
          userMessage: testUserMessage,
        },
        response: {
          aiMessage: result.message,
          loveScore: result.loveScore,
        },
      };
      log('INFO', 'E2E debug test successful.', { userId, data: responseData });
      return {
        success: true,
        message: '[E2Eデバッグ成功] AIからの応答を正常に受信しました。',
        data: responseData,
      };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('ERROR', 'getAiResponse action failed.', { userId, error: errorMessage });
    return { 
        success: false, 
        message: `[E2Eデバッグエラー] AI応答の取得中にエラーが発生しました:\n${errorMessage}` 
    };
  }
}
