'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { Incidence } from '@/types';

export function useIncidenceDetail(incidenceId: string | undefined) {
  const [incidence, setIncidence] = useState<Incidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incidenceId) {
      return;
    }

    const db = getClientFirestore();
    const ref = doc(db, 'incidences', incidenceId);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) {
          setIncidence(null);
          setError('Incidencia no encontrada');
          setLoading(false);
          return;
        }
        setIncidence({
          id: snapshot.id,
          ...snapshot.data(),
        } as Incidence);
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

  return { incidence, loading, error };
}
