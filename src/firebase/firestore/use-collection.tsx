
'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
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
  limit,
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useUser } from '../auth/use-user';
import { initializeFirebase } from '..';

type Filter = readonly [string, '==', any];

interface UseCollectionOptions {
  sort?: string;
  sortDirection?: 'asc' | 'desc';
  filter?: Filter;
  limit?: number;
}

function buildQuery(firestore: any, path: string, options?: UseCollectionOptions & { startAfter?: QueryDocumentSnapshot | null; }) {
    let q: Query<DocumentData> = collection(firestore, path);
    if (options?.filter) {
      q = query(q, where(options.filter[0], options.filter[1], options.filter[2]));
    }
    if (options?.sort) {
      q = query(q, orderBy(options.sort, options.sortDirection || 'asc'));
    }
    if (options?.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }
    return q;
}

export function useCollection<T>(
  path: string | null,
  options?: UseCollectionOptions
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();

  const queryMemo = useMemo(() => {
    if (!firestore || !path || !user) return null;
    return buildQuery(firestore, path, options);
  }, [path, firestore, user, options]);

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }
    
    if (!queryMemo || !path || !user) {
      setLoading(false);
      setData(null);
      return;
    }
    
    setLoading(true);
    
    const unsubscribe = onSnapshot(
      queryMemo,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          ...doc.data(),
          id: doc.id,
        })) as T[];
        setData(docs);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] ?? null);
        setHasMore(!snapshot.empty && snapshot.docs.length >= (options?.limit ?? 0));
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
  }, [queryMemo, path, user, userLoading, options?.limit]);

  const loadMore = useCallback(async () => {
    if (!firestore || !path || !lastVisible || !hasMore || loadingMore) return;

    setLoadingMore(true);
    const moreOptions = { ...options, startAfter: lastVisible };
    const q = buildQuery(firestore, path, moreOptions);

    try {
        const snapshot = await getDocs(q);
        const newDocs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
        setData(prev => (prev ? [...newDocs, ...prev] : newDocs));
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] ?? null);
        setHasMore(!snapshot.empty && snapshot.docs.length >= (options?.limit ?? 0));
    } catch (err: any) {
        const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'list',
        }, err);
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
    } finally {
        setLoadingMore(false);
    }
  }, [firestore, path, lastVisible, hasMore, loadingMore, options]);


  return { data, loading, error, hasMore, loadingMore, loadMore };
}
