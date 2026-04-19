'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { UserNotification } from '@/types';
import type { Firestore } from 'firebase/firestore';

interface NotificationsState {
  notifications: UserNotification[];
  urgentAlerts: UserNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export function useNotifications(userId?: string, injectedDb?: Firestore) {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    urgentAlerts: [],
    unreadCount: 0,
    loading: false,
    error: null,
  });

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;
    const db = injectedDb ?? getClientFirestore();
    const ref = doc(db, 'userNotifications', userId, 'inbox', notificationId);
    await updateDoc(ref, { read: true });
  }, [userId, injectedDb]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const db = injectedDb ?? getClientFirestore();
    const q = query(
      collection(db, 'userNotifications', userId, 'inbox'),
      where('dismissed', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: UserNotification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          notifications.push({
            id: docSnap.id,
            ...data,
          } as UserNotification);
        });

        const urgentAlerts = notifications.filter((n) => n.urgency === 'urgent');
        const unreadCount = notifications.filter((n) => !n.read).length;

        setState({
          notifications,
          urgentAlerts,
          unreadCount,
          loading: false,
          error: null,
        });
      },
      (err) => {
        const msg = err instanceof Error ? err.message : 'Error de conexión';
        console.error('[useNotifications] onSnapshot error:', msg, err);
        setState((s) => ({
          ...s,
          loading: false,
          error: msg,
        }));
      }
    );

    return () => unsubscribe();
  }, [userId, injectedDb]);

  return { ...state, markAsRead };
}
