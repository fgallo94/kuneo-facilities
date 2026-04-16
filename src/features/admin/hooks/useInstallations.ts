'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, where, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { Installation } from '@/types';

export function useInstallations(groupId?: string) {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstallations = useCallback(async () => {
    try {
      const db = getClientFirestore();
      let q = query(collection(db, 'installations'), orderBy('name'));
      if (groupId) {
        q = query(q, where('groupId', '==', groupId));
      }
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          } as Installation)
      );
      setInstallations(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    let cancelled = false;
    fetchInstallations().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [fetchInstallations]);

  const createInstallation = async (payload: {
    groupId: string;
    name: string;
    address?: string;
    description?: string;
    imageUrl?: string;
    assignedUserIds?: string[];
    ownerDetails?: { name: string; nif?: string };
    exploiterDetails?: { name: string; nif?: string };
  }) => {
    const db = getClientFirestore();
    const ref = doc(collection(db, 'installations'));
    await setDoc(ref, {
      ...payload,
      assignedUserIds: payload.assignedUserIds ?? [],
      createdAt: serverTimestamp(),
    });
    await fetchInstallations();
    return ref.id;
  };

  const assignUsers = async (installationId: string, userIds: string[]) => {
    const db = getClientFirestore();
    const ref = doc(db, 'installations', installationId);
    await updateDoc(ref, { assignedUserIds: userIds });
    await fetchInstallations();
  };

  const updateInstallation = async (
    installationId: string,
    payload: {
      name: string;
      address?: string;
      description?: string;
      imageUrl?: string;
      assignedUserIds?: string[];
      ownerDetails?: { name: string; nif?: string };
      exploiterDetails?: { name: string; nif?: string };
    }
  ) => {
    const db = getClientFirestore();
    const ref = doc(db, 'installations', installationId);
    await updateDoc(ref, {
      ...payload,
      assignedUserIds: payload.assignedUserIds ?? [],
      updatedAt: serverTimestamp(),
    });
    await fetchInstallations();
  };

  return { installations, loading, error, createInstallation, assignUsers, updateInstallation, refetch: fetchInstallations };
}
