'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  orderBy,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

interface UseCollectionOptions {
  sort?: string;
  sortDirection?: 'asc' | 'desc';
  filter?: [string, '==', any];
}

export function useCollection<T>(
  path: string,
  options?: UseCollectionOptions
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const firestore = useFirestore();

  const queryMemo = useMemo(() => {
    if (!firestore) return null;
    let q: Query<DocumentData> = collection(firestore, path);
    if (options?.filter) {
      q = query(q, where(...options.filter));
    }
    if (options?.sort) {
      q = query(q, orderBy(options.sort, options.sortDirection || 'asc'));
    }
    return q;
  }, [path, options, firestore]);

  useEffect(() => {
    if (!queryMemo) return;
    setLoading(true);

    const unsubscribe = onSnapshot(
      queryMemo,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          ...doc.data(),
          id: doc.id,
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      (err: FirestoreError) => {
        const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'list',
        }, err);
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryMemo, path]);

  return { data, loading, error };
}
