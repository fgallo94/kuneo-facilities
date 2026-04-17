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
import { getClientAuth, getClientFirestore } from '@/lib/firebase';
import type { Incidence } from '@/types';

const OPEN_STATUSES: Incidence['status'][] = [
  'Reportada',
  'En reparación',
  'A falta de presupuesto',
  'Presupuestado',
  'Falta de material',
  'A facturar',
];

export function useUserOpenIncidences(limitCount = 10, enabled = true) {
  const [incidences, setIncidences] = useState<Incidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const auth = getClientAuth();
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    try {
      const db = getClientFirestore();
      const constraints: QueryConstraint[] = [
        where('reportedBy', '==', user.uid),
        where('status', 'in', OPEN_STATUSES),
        orderBy('createdAt', 'desc'),
      ];

      if (limitCount > 0) {
        constraints.push(limit(limitCount));
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
      console.error('[useUserOpenIncidences]', message, err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [limitCount]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, enabled]);

  return { incidences, loading, error, refetch: fetchData };
}
