'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { IncidenceComment } from '@/types';

export function useIncidenceComments(incidenceId: string | undefined) {
  const [comments, setComments] = useState<IncidenceComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incidenceId) {
      return;
    }

    const db = getClientFirestore();
    const q = query(
      collection(db, 'incidences', incidenceId, 'comments'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as IncidenceComment[];
        setComments(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [incidenceId]);

  return { comments, loading, error };
}
