'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { Group } from '@/types';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      const db = getClientFirestore();
      const snapshot = await getDocs(
        query(collection(db, 'groups'), orderBy('name'))
      );
      const list = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          } as Group)
      );
      setGroups(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchGroups().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [fetchGroups]);

  const createGroup = async (payload: {
    name: string;
    address?: string;
    description?: string;
    imageUrl?: string;
    assignedUserIds?: string[];
  }) => {
    const db = getClientFirestore();
    const ref = doc(collection(db, 'groups'));
    await setDoc(ref, {
      ...payload,
      isActive: true,
      assignedUserIds: payload.assignedUserIds ?? [],
      createdAt: serverTimestamp(),
    });
    await fetchGroups();
    return ref.id;
  };

  const assignUsers = async (groupId: string, userIds: string[]) => {
    const db = getClientFirestore();
    const ref = doc(db, 'groups', groupId);
    await updateDoc(ref, { assignedUserIds: userIds });
    await fetchGroups();
  };

  const updateGroup = async (
    groupId: string,
    payload: {
      name: string;
      address?: string;
      description?: string;
      imageUrl?: string;
      assignedUserIds?: string[];
    }
  ) => {
    const db = getClientFirestore();
    const ref = doc(db, 'groups', groupId);
    await updateDoc(ref, {
      ...payload,
      assignedUserIds: payload.assignedUserIds ?? [],
      updatedAt: serverTimestamp(),
    });
    await fetchGroups();
  };

  return { groups, loading, error, createGroup, assignUsers, updateGroup, refetch: fetchGroups };
}
