
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
  limit,
  startAfter,
  getDocs,
  getFirestore,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { useUser } from '../auth/use-user';

type Filter = readonly [string, '==', any];

interface UseCollectionOptions {
  sort?: string;
  sortDirection?: 'asc' | 'desc';
  filter?: Filter;
  limit?: number;
  startAfter?: QueryDocumentSnapshot | null;
}

type SnapshotCallback = (snapshot: QuerySnapshot<DocumentData> | null) => void;

function buildQuery(firestore: any, path: string, options?: UseCollectionOptions) {
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
  options?: UseCollectionOptions,
  onSnapshotCallback?: SnapshotCallback
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  
  const filterKey = options?.filter?.[0];
  const filterOp = options?.filter?.[1];
  const filterValue = options?.filter?.[2];

  const queryMemo = useMemo(() => {
    if (!firestore || !path || userLoading) return null;
    return buildQuery(firestore, path, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, firestore, userLoading, options?.sort, options?.sortDirection, options?.limit, filterKey, filterOp, filterValue, options?.startAfter]);

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }
    
    if (!queryMemo || !path || !user) { // Ensure user exists before querying
      setLoading(false);
      setData(null);
      return;
    }
    
    console.log(`[useCollection] Firestore list query initiated. Path: "${path}", User UID: ${user.uid}`);
    
    const unsubscribe = onSnapshot(
      queryMemo,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          ...doc.data(),
          id: doc.id,
        })) as T[];
        setData(docs);
        setLoading(false);
        onSnapshotCallback?.(snapshot);
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
  }, [queryMemo, path, onSnapshotCallback, user, userLoading]);

  return { data, loading, error };
}

useCollection.fetchMore = async <T>(
    path: string,
    options: UseCollectionOptions
): Promise<{ data: T[] | null; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean; }> => {
    const firestore = getFirestore();
    const q = buildQuery(firestore, path, options);
    
    try {
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
        const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        const hasMore = !snapshot.empty && snapshot.docs.length >= (options.limit || 0);
        return { data: docs, lastDoc, hasMore };
    } catch (err: any) {
         const permissionError = new FirestorePermissionError({
            path: path,
            operation: 'list',
        }, err);
        errorEmitter.emit('permission-error', permissionError);
        throw err;
    }
};
