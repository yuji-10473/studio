'use client';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

// This provider is responsible for initializing Firebase on the client side.
// It should be used as a wrapper around the root of your application.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseProvider value={initializeFirebase()}>
      {children}
    </FirebaseProvider>
  );
}
