
'use server';

import { headers } from 'next/headers';
import fetch, { Headers } from 'node-fetch';
import FormData from 'form-data';
import { initializeFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getAiResponse, getGuideResponse } from '@/actions/chat';
import type { Character, Message, UserProfile } from '@/lib/types';


/**
 * 構造化ログをコンソールに出力します。
 * @param severity ログの重要度
 * @param message ログメッセージ
 * @param context 追加情報
 */
function log(severity: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG' | 'CRITICAL', message: string, context: Record<string, any> = {}) {
  try {
    headers(); 
  } catch (error) {
    // This function might be called in contexts where headers() is not available.
  }
  
  const logEntry = { severity, message, ...context };
  if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
  } else {
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
  headers(); // Opt-out of caching
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
 * E2E test for the AI chat response functionality.
 * This function calls the `getAiResponse` server action with mock data.
 */
export async function runChatE2eTest(): Promise<{ success: boolean; message: string; data?: any }> {
    headers(); // Opt-out of caching
    log('INFO', 'Chat E2E test started.', { testName: 'runChatE2eTest' });

    try {
        const testCharacter: Character = {
            id: 'test-char-01',
            name: 'エララ',
            introduction: '村の賢いパン屋。',
            description: 'あなたは村のパン屋、エララです。温かく、思いやりがあり、村人たちの相談相手になることが多いです。焼きたてのパンの話を交えながら、相手を元気づけてください。',
            imagePath: '/images/icons/icon1.png',
        };

        const testUserProfile: UserProfile = {
            id: 'test-user-01',
            email: 'e2e-user@example.com',
            displayName: 'E2Eテスター',
            bio: 'これはE2Eテスト用の自己紹介です。',
            charm: 100,
            gameDate: 1,
        };

        const testUserMessage = 'こんにちは！いい天気ですね。';

        const testConversationHistory: Message[] = [
            { sender: 'user', text: '初めまして！', characterId: 'test-char-01' },
            { sender: 'test-char-01', text: 'あら、こんにちは！パンのいい匂いがするでしょう？', characterId: 'test-char-01' },
        ];

        log('INFO', 'Calling getAiResponse with test data.', { request: { testCharacter, testUserProfile, testUserMessage, testConversationHistory }});

        const result = await getAiResponse(
            testCharacter,
            testUserMessage,
            testConversationHistory,
            testUserProfile
        );

        log('INFO', 'Chat E2E test finished.', { response: result });

        if (result.success) {
            return {
                success: true,
                message: '[E2E成功] AI応答の取得に成功しました。',
                data: result,
            };
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log('ERROR', 'Chat E2E test failed.', { error: errorMessage });
        return { 
            success: false, 
            message: `[E2Eエラー] AI応答の取得に失敗しました:\n${errorMessage}` 
        };
    }
}


/**
 * A simple server action to test Cloud Logging.
 */
export async function testCloudLogging(): Promise<{ success: boolean; message: string; }> {
    headers(); // Opt-out of caching
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


/**
 * E2E test for the Guide AI chat response functionality.
 * This function calls the `getGuideResponse` server action with mock data.
 */
export async function runGuideChatE2eTest(): Promise<{ success: boolean; message: string; data?: any }> {
    headers(); // Opt-out of caching
    log('INFO', 'Guide Chat E2E test started.', { testName: 'runGuideChatE2eTest' });

    try {
        const testUserMessage = '魅力ポイントって何？';

        const testConversationHistory: { role: 'user' | 'model'; content: string }[] = [
            { role: 'user', content: 'こんにちは！' },
            { role: 'model', content: 'こんにちは！ 私は案内役の零無皇です。ゲームのことで分からないことがあれば、何でも聞いてくださいね。' },
        ];

        log('INFO', 'Calling getGuideResponse with test data.', { request: { testUserMessage, testConversationHistory }});

        const result = await getGuideResponse(
            testUserMessage,
            testConversationHistory
        );

        log('INFO', 'Guide Chat E2E test finished.', { response: result });

        if (result.success) {
            return {
                success: true,
                message: '[E2E成功] 案内役のAI応答取得に成功しました。',
                data: result,
            };
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log('ERROR', 'Guide Chat E2E test failed.', { error: errorMessage });
        return { 
            success: false, 
            message: `[E2Eエラー] 案内役のAI応答取得に失敗しました:\n${errorMessage}` 
        };
    }
}


/**
 * Runs a comprehensive suite of E2E tests in sequence.
 */
export async function runComprehensiveE2eTest(): Promise<{ success: boolean; message: string; results: any }> {
    headers(); // Opt-out of caching
    log('INFO', 'Comprehensive E2E test suite started.', { testName: 'runComprehensiveE2eTest' });

    const results = {
        authTest: {},
        chatTest: {},
        guideTest: {},
    };
    let overallSuccess = true;

    try {
        log('INFO', 'Running Auth Test...');
        results.authTest = await runFirebaseAuthE2eTest('user@example.com', 'password123');
        if (!(results.authTest as any).success) {
            overallSuccess = false;
        }
        log('INFO', 'Auth Test finished.');

        log('INFO', 'Running Chat Test...');
        results.chatTest = await runChatE2eTest();
        if (!(results.chatTest as any).success) {
            overallSuccess = false;
        }
        log('INFO', 'Chat Test finished.');

        log('INFO', 'Running Guide Chat Test...');
        results.guideTest = await runGuideChatE2eTest();
        if (!(results.guideTest as any).success) {
            overallSuccess = false;
        }
        log('INFO', 'Guide Chat Test finished.');

        const finalMessage = overallSuccess
            ? '[総合E2E成功] すべてのテストが正常に完了しました。'
            : '[総合E2E失敗] いくつかのテストに失敗しました。詳細は結果を確認してください。';

        log('INFO', 'Comprehensive E2E test suite finished.', { overallSuccess });
        
        return {
            success: overallSuccess,
            message: finalMessage,
            results,
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log('CRITICAL', 'Comprehensive E2E test suite failed with an unhandled exception.', { error: errorMessage });
        return {
            success: false,
            message: `[E2Eクリティカルエラー] 総合テストの実行中に予期せぬエラーが発生しました:\n${errorMessage}`,
            results,
        };
    }
}

/**
 * Runs an E2E test against a remote API endpoint.
 * @param baseUrl The base URL of the remote API.
 * @param testType The type of test to run ('auth' or 'chat').
 * @param actionId The server action ID for chat test.
 */
export async function runRemoteApiTest(baseUrl: string, testType: 'auth' | 'chat', actionId?: string): Promise<{ success: boolean; message: string; data?: any }> {
    headers(); // Opt-out of caching
    const webApiKey = process.env.NEXT_PUBLIC_FIREBASE_WEB_API_KEY;

    if (!webApiKey) {
        const message = 'NEXT_PUBLIC_FIREBASE_WEB_API_KEY is not set in environment variables.';
        log('ERROR', message, { testName: 'runRemoteApiTest' });
        return { success: false, message };
    }
    
    log('INFO', 'Remote API test started.', { testName: 'runRemoteApiTest', baseUrl, testType });

    try {
        const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${webApiKey}`;
        const authBody = {
            email: 'user@example.com',
            password: 'password123',
            returnSecureToken: true,
        };

        log('DEBUG', 'Attempting remote authentication.', { url: authUrl });
        const authRes = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authBody),
        });

        const authData = await authRes.json() as any;

        if (!authRes.ok || !authData.idToken) {
            throw new Error(`Remote auth failed: ${authData?.error?.message || 'Unknown error'}`);
        }
        log('DEBUG', 'Remote authentication successful.');
        const idToken = authData.idToken;

        if (testType === 'auth') {
            return {
                success: true,
                message: `[リモートテスト成功] 認証に成功しました。UID: ${authData.localId}`,
                data: { uid: authData.localId },
            };
        }

        if (testType === 'chat') {
            if (!actionId) {
                throw new Error('Chat test requires the Server Action ID. Please run the local chat test first to log the ID.');
            }
            // For Server Actions, the URL is the page path, not a dedicated API route.
            const chatUrl = new URL('/', baseUrl).toString(); 
            
            const testCharacter: Character = {
                 id: 'elara', name: 'エララ', introduction: '村の賢いパン屋。', description: '...', imagePath: '/images/icons/icon1.png'
            };
            const testUserProfile: UserProfile = { 
                id: 'test-user', displayName: 'Remote Tester', charm: 10, gameDate: 1, email: 'user@example.com' 
            };
            const testUserMessage = 'こんにちは';
            const testConversationHistory: Message[] = [];

            const form = new FormData();
            form.append('0', JSON.stringify(testCharacter));
            form.append('1', JSON.stringify(testUserMessage));
            form.append('2', JSON.stringify(testConversationHistory));
            form.append('3', JSON.stringify(testUserProfile));
            
            log('DEBUG', 'Attempting remote chat action.', { url: chatUrl, actionId });
            
            const fetchHeaders = new Headers();
            fetchHeaders.append('Next-Action', actionId);
            fetchHeaders.append('Authorization', `Bearer ${idToken}`);

            const chatRes = await fetch(chatUrl, {
                method: 'POST',
                headers: fetchHeaders,
                body: form,
            });

            log('DEBUG', 'Remote chat action response received.', { status: chatRes.status, headers: Object.fromEntries(chatRes.headers.entries()) });
            
            const responseText = await chatRes.text();
            
            if (!chatRes.ok) {
                 throw new Error(`Remote chat API failed with status ${chatRes.status}: ${responseText}`);
            }

            // Server action responses need special parsing.
            // The response is a string where each line starts with a number, a colon, and then the chunk.
            const resultLines = responseText.split('\n').filter(line => line.startsWith('1:'));
            if (resultLines.length === 0) {
              throw new Error(`Invalid server action response format: ${responseText}`);
            }
            // We take the last valid line which should contain the full response object
            const lastLine = resultLines[resultLines.length - 1];

            const jsonString = lastLine.substring(lastLine.indexOf('{'));
            const chatData = JSON.parse(jsonString);

            return {
                success: true,
                message: '[リモートテスト成功] AI応答の取得に成功しました。',
                data: chatData,
            };
        }

        throw new Error(`Unknown remote test type: ${testType}`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log('ERROR', 'Remote API test failed.', { error: errorMessage });
        return { 
            success: false, 
            message: `[リモートテストエラー] 外部APIのテストに失敗しました:\n${errorMessage}` 
        };
    }
}
