'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { Counter } from '@/types';

export function useCounters() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getClientFirestore();
    const q = query(collection(db, 'counters'), orderBy('name'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Counter[];
        setCounters(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { counters, loading, error };
}
