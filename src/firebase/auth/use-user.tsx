'use client';
import { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth, useFirestore, useMemoFirebase } from '../provider';
import type { UserRole } from '@/lib/types';
import { useDoc } from '../firestore/use-doc';
import { doc } from 'firebase/firestore';

export interface UserState {
    user: User | null;
    role: UserRole;
    loading: boolean;
}

export function useUser(): UserState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);
  const auth = useAuth();
  const firestore = useFirestore();
  
  const adminDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'admins', user.uid) : null),
    [user, firestore]
  );
  
  // Get the admin status based on the current user's UID.
  const { data: adminDoc, loading: adminLoading } = useDoc(adminDocRef);

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }
    
    // Subscribe to auth state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // If there's no user, we are done loading auth state.
      if (!currentUser) {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    // If we have a user, loading depends on whether we have checked for admin status.
    if (user) {
      if (!adminLoading) { // Admin check is complete
        setRole(adminDoc ? 'admin' : 'user');
        setLoading(false); // Final loading state is now false.
      }
      // If admin check is still loading, we wait. `loading` remains true.
    } else {
        // If there is no user, role is 'user' and loading is already handled by onAuthStateChanged.
        setRole('user');
    }
  }, [user, adminDoc, adminLoading]);


  return { user, role, loading };
}
