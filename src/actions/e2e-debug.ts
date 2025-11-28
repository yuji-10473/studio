
'use server';

import { headers } from 'next/headers';
import { initializeFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

/**
 * 構造化ログをコンソールに出力します。
 * 本番環境（App Hosting）では、このコンソール出力が自動的にCloud Loggingに収集されます。
 * @param severity ログの重要度
 * @param message ログメッセージ
 * @param context 追加情報
 */
function log(severity: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG' | 'CRITICAL', message: string, context: Record<string, any> = {}) {
  headers(); // Opt-out of caching
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

/**
 * E2E test for Firebase Authentication using client-side SDK.
 * This function attempts to sign in with a test user's credentials.
 * @param email The email of the test user.
 * @param password The password of the test user.
 */
export async function runFirebaseAuthE2eTest(email: string, password: string):Promise<{ success: boolean; message: string; data?: any }> {
  log('INFO', 'Firebase Auth E2E test started.', { testName: 'runFirebaseAuthE2eTest', email });

  try {
    const { auth } = initializeFirebase();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();

    const result = {
      uid: user.uid,
      email: user.email,
      idToken: idToken.substring(0, 30) + '...', // Don't log the full token
    };

    log('INFO', 'Firebase Auth E2E test successful.', { data: result });

    return {
        success: true,
        message: '[E2E成功] Firebase認証に成功しました。',
        data: result,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('ERROR', 'Firebase Auth E2E test failed.', { error: errorMessage });
    return { 
        success: false, 
        message: `[E2Eエラー] Firebase認証に失敗しました:\n${errorMessage}` 
    };
  }
}

/**
 * A simple server action to test Cloud Logging.
 */
export async function testCloudLogging(): Promise<{ success: boolean; message: string; }> {
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
