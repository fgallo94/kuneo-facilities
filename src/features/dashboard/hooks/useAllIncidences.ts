'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { Incidence } from '@/types';

export function useAllIncidences() {
  const [incidences, setIncidences] = useState<Incidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getClientFirestore();
    const q = query(collection(db, 'incidences'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
          } as Incidence;
        });
        setIncidences(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { incidences, loading, error };
}
