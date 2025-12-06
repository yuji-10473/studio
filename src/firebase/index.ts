import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

type FirebaseInstances = {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
};

let firebaseInstances: FirebaseInstances | null = null;


// Initializes and returns the Firebase app, auth, and firestore instances.
// It ensures that Firebase is initialized only once.
export function initializeFirebase(): FirebaseInstances {
  if (firebaseInstances) {
    return firebaseInstances;
  }
  
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase API Key is missing, Firebase functionality will be disabled.");
    firebaseInstances = { app: null, auth: null, firestore: null };
    return firebaseInstances;
  }

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

  firebaseInstances = { app, auth, firestore };
  return firebaseInstances;
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
