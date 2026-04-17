'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const db = getClientFirestore();
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

      if (userUid) {
        constraints.push(where('reportedBy', '==', userUid));
      }

      if (maxResults > 0) {
        constraints.push(limit(maxResults));
      }

      const q = query(collection(db, 'incidences'), ...constraints);
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
        } as Incidence;
      });
      setIncidences(list);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[useRecentIncidences]', message, err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userUid, maxResults]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, enabled]);

  return { incidences, loading, error, refetch: fetchData };
}
