'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth, useFirestore } from '../provider';
import type { UserRole } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { useDoc } from '../firestore/use-doc';

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
  
  const { data: adminDoc, loading: adminLoading } = useDoc(user ? `/admins/${user.uid}` : null);

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    if (loading) return; // Wait for auth state to be determined

    if (!user) {
        setRole('user');
        return;
    }
    
    if (adminLoading) return; // Wait for admin doc to load

    if (adminDoc) {
        setRole('admin');
    } else {
        setRole('user');
    }
    setLoading(false);

  }, [user, adminDoc, adminLoading, loading]);


  return { user, role, loading };
}
