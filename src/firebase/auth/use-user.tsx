'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth } from '../provider';
import type { UserRole } from '@/lib/types';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
            const tokenResult = await currentUser.getIdTokenResult();
            const isAdmin = tokenResult.claims.isAdmin === true;
            setRole(isAdmin ? 'admin' : 'user');
        } catch (error) {
            console.error('Error getting user token result:', error);
            setRole('user');
        }
      } else {
        setRole('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, role, loading };
}
