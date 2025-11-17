'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth } from '../provider';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
