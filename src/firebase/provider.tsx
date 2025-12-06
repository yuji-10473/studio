
'use client';
import { createContext, useContext, useMemo } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { ErrorBoundary } from 'react-error-boundary';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Define the shape of the context value
interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

// Create the context with an undefined initial value
const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

function FirebaseErrorFallback({ error }: { error: Error }) {
    // This is a silent fallback. The actual error is shown in the dev overlay.
    return null;
}


// Define the provider component
export function FirebaseProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: FirebaseContextValue;
}) {
  // Memoize the value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => value, [value]);
  
  // Always render the provider, even if Firebase is not initialized.
  // Hooks like useAuth will check for the nullness of the services.
  return (
    <FirebaseContext.Provider value={memoizedValue}>
      <ErrorBoundary FallbackComponent={FirebaseErrorFallback}>
        {process.env.NODE_ENV === 'development' && <FirebaseErrorListener />}
        {children}
      </ErrorBoundary>
    </FirebaseContext.Provider>
  );
}

// Custom hook to access the Firebase context
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

// Custom hooks for specific Firebase services
export const useFirebaseApp = (): FirebaseApp | null => {
  const context = useFirebase();
  return context?.app ?? null;
};
export const useAuth = (): Auth | null => {
  const context = useFirebase();
  return context?.auth ?? null;
};
export const useFirestore = (): Firestore | null => {
  const context = useFirebase();
  return context?.firestore ?? null;
};
