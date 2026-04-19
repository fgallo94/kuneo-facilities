'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { Incidence } from '@/types';

export function useRecentIncidences(
  userUid?: string,
  maxResults = 10,
  enabled = true
): { incidences: Incidence[]; loading: boolean; error: string | null; refetch: () => void } {
  const [incidences, setIncidences] = useState<Incidence[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const db = getClientFirestore();
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (userUid) {
      constraints.push(where('reportedBy', '==', userUid));
    }

    if (maxResults > 0) {
      constraints.push(limit(maxResults));
    }

    const q = query(collection(db, 'incidences'), ...constraints);

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
        console.error('[useRecentIncidences]', message, err);
        setError(message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userUid, maxResults, enabled]);

  return { incidences, loading, error, refetch: () => {} };
}
