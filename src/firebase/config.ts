
// Your web app's Firebase configuration
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_WEB_API_KEY;

if (!apiKey) {
  console.warn(
    'Firebase APIキーが設定されていません。Firebaseの機能は無効になります。' +
    'アプリケーションを正しく動作させるには、.env.localファイルを作成し、' +
    'NEXT_PUBLIC_FIREBASE_WEB_API_KEY="あなたのキー"' +
    'という行を追加してください。'
  );
}

export const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "studio-3901474762-72cde.firebaseapp.com",
  projectId: "studio-3901474762-72cde",
  storageBucket: "studio-3901474762-72cde.firebasestorage.app",
  messagingSenderId: "379923605206",
  appId: "1:379923605206:web:6c5b10b13fcb1d73970b77"
};
