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
    if (!docRefMemo) {
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
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRefMemo]);

  return { data, loading, error };
}
