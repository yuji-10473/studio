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
    const authPort = process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || 9099;
    const firestorePort = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080;

    // It's recommended to use 127.0.0.1 for the host instead of `host`
    // to avoid potential issues with IPv6.
    const emulatorHost = '127.0.0.1';

    try {
       // @ts-ignore
      if (!auth.emulatorConfig) {
        connectAuthEmulator(auth, `http://${emulatorHost}:${authPort}`);
      }
    } catch (e) {
      console.log(e);
    }
    try {
      // @ts-ignore
      if (!firestore.emulatorConfig) {
        connectFirestoreEmulator(firestore, emulatorHost, Number(firestorePort));
      }
    } catch (e) {
      console.log(e);
    }
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
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
