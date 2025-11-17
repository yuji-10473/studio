'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth, useFirestore } from '../provider';
import type { UserProfile, UserRole } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';

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

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Set loading to false once auth state is determined
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (!firestore || !user) {
        setRole('user');
        return;
    }

    const userDocRef = doc(firestore, 'users', user.uid);
    const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data() as UserProfile;
            setRole(userData.isAdmin ? 'admin' : 'user');
        } else {
            setRole('user');
        }
    });

    return () => unsubscribeDoc();

  }, [firestore, user]);


  return { user, role, loading };
}
