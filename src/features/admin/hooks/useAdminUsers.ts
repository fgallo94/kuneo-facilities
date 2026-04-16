'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { User } from '@/types';

export function useAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const db = getClientFirestore();
      const snapshot = await getDocs(
        query(collection(db, 'users'), orderBy('displayName'))
      );
      const list = snapshot.docs.map(
        (doc) =>
          ({
            uid: doc.id,
            ...doc.data(),
          } as User)
      );
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}
