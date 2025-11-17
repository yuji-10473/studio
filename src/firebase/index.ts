import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Initializes and returns the Firebase app, auth, and firestore instances.
// It ensures that Firebase is initialized only once.
export function initializeFirebase() {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (process.env.NEXT_PUBLIC_EMULATOR_HOST) {
    // These environment variables are set by the `firebase emulators:exec` command
    // when running the Next.js dev server.
    const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;
    connectAuthEmulator(auth, `http://${host}:9099`);
    connectFirestoreEmulator(firestore, host, 8080);
  }

  return { app, auth, firestore };
}

// Export the hooks from the provider so they can be used throughout the app.
export {
  useFirebase,
  useFirebaseApp,
  useAuth,
  useFirestore,
  FirebaseProvider,
} from './provider';
export { FirebaseClientProvider } from './client-provider';
