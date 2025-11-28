
'use server';

import { headers } from 'next/headers';
import type { Character, Message, UserProfile } from '@/lib/types';
import { getAiResponse } from './chat';
// import { initializeApp, getApps, App } from 'firebase-admin/app';
// import { getFirestore } from 'firebase-admin/firestore';

/**
 * 構造化ログをコンソールに出力します。
 * 本番環境（App Hosting）では、このコンソール出力が自動的にCloud Loggingに収集されます。
 * @param severity ログの重要度
 * @param message ログメッセージ
 * @param context 追加情報
 */
function log(severity: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG' | 'CRITICAL', message: string, context: Record<string, any> = {}) {
  const logEntry = { severity, message, ...context };
  // 本番環境ではCloud Loggingが自動でJSONをパースするため、JSON文字列として出力する
  if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
  } else {
      // 開発環境では読みやすいようにオブジェクトのまま出力する
      if (severity === 'ERROR' || severity === 'CRITICAL') {
        console.error(logEntry);
      } else {
        console.log(logEntry);
      }
  }
}


// // Admin SDKの初期化
// function initializeAdminApp(): App {
//     if (getApps().length > 0) {
//         return getApps()[0];
//     }
//     // App Hosting環境では引数なしで初期化することで、
//     // 環境に設定されたサービスアカウントが自動的に使用されます。
//     return initializeApp();
// }


/**
 * Simulates an E2E test scenario by fetching a character and user profile,
 * and then calling the getAiResponse server action.
 * This is intended to be called from a debug menu in the UI.
 * @param userId The UID of the user to run the test as.
 */
export async function runE2eTest(userId: string): Promise<{ success: boolean; message: string; data?: any }> {
  headers(); // Opt out of caching
  log('INFO', '[Temporary Fix] E2E debug test started. Firestore logic is temporarily disabled for debugging.', { userId, testName: 'runE2eTest' });

  // --- Firestore access is temporarily disabled to isolate logging issues.
  const message = '[Temporary Fix] E2E test action was called, but Firestore logic is currently disabled for debugging. Check Cloud Logging for this message.';
  
  log('INFO', message, { userId });

  return { 
    success: true, 
    message: message
  };

  // The original logic is commented out below for now.

  /*
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
    const adminApp = initializeAdminApp();
    const firestore = getFirestore(adminApp);
    const userDocRef = firestore.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
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
  */
}

/**
 * A simple server action to test Cloud Logging.
 */
export async function testCloudLogging(): Promise<{ success: boolean; message: string; }> {
    headers(); // Opt out of caching
    const testData = { 
        testName: "testCloudLogging",
        timestamp: new Date().toISOString(),
        randomNumber: Math.random(),
        from: process.env.NODE_ENV === 'development' ? 'DEVELOPMENT_SERVER' : 'PRODUCTION_SERVER'
    };
    
    try {
        log('INFO', 'This is a test log for Cloud Logging.', testData);
        return {
            success: true,
            message: `テストログをコンソールに出力しました。本番環境ではCloud Loggingに転送されます。 testName: ${testData.testName}, from: ${testData.from}`
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        log('ERROR', 'Failed to send test log to console.', {
            error: errorMessage,
            ...testData
        });

        return {
            success: false,
            message: `コンソールへのテストログ出力に失敗しました: ${errorMessage}`
        };
    }
}
