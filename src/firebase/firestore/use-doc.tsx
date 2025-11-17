'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const firestore = useFirestore();

  const docRefMemo = useMemo(() => {
    if (!firestore || !path) return null;
    return doc(firestore, path) as DocumentReference<DocumentData>;
  }, [path, firestore]);

  useEffect(() => {
    if (!docRefMemo || !path) { // also check for path
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
      docRefMemo,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          const docData = { ...snapshot.data(), id: snapshot.id } as T;
          setData(docData);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        // Create and emit a detailed permission error
        const permissionError = new FirestorePermissionError({
          path: path, // Use the path passed to the hook
          operation: 'get',
        }, err);
        errorEmitter.emit('permission-error', permissionError);

        // Also set the local error state for the component
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRefMemo, path]); // Add path to dependencies

  return { data, loading, error };
}
