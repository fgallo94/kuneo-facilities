'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, where, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { Property } from '@/types';

export function useAdminProperties(installationId?: string) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    try {
      const db = getClientFirestore();
      let q = query(collection(db, 'properties'), orderBy('name'));
      if (installationId) {
        q = query(q, where('installationId', '==', installationId));
      }
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          } as Property)
      );
      setProperties(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => {
    let cancelled = false;
    fetchProperties().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [fetchProperties]);

  const createProperty = async (payload: {
    installationId: string;
    name: string;
    address?: string;
    description?: string;
    imageUrl?: string;
    assignedUserIds?: string[];
    type?: string;
  }) => {
    const db = getClientFirestore();
    const ref = doc(collection(db, 'properties'));
    await setDoc(ref, {
      ...payload,
      assignedUserIds: payload.assignedUserIds ?? [],
      createdAt: serverTimestamp(),
    });
    await fetchProperties();
    return ref.id;
  };

  const assignUsers = async (propertyId: string, userIds: string[]) => {
    const db = getClientFirestore();
    const ref = doc(db, 'properties', propertyId);
    await updateDoc(ref, { assignedUserIds: userIds });
    await fetchProperties();
  };

  const updateProperty = async (
    propertyId: string,
    payload: {
      name: string;
      address?: string;
      description?: string;
      imageUrl?: string;
      assignedUserIds?: string[];
      type?: string;
    }
  ) => {
    const db = getClientFirestore();
    const ref = doc(db, 'properties', propertyId);
    await updateDoc(ref, {
      ...payload,
      assignedUserIds: payload.assignedUserIds ?? [],
      updatedAt: serverTimestamp(),
    });
    await fetchProperties();
  };

  return { properties, loading, error, createProperty, assignUsers, updateProperty, refetch: fetchProperties };
}
