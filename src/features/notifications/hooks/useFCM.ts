'use client';

import { useEffect, useState } from 'react';
import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getClientMessaging, getClientFirestore, getClientAuth } from '@/lib/firebase';

export function useFCM() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const auth = getClientAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getClientFirestore();
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    let unsubscribeMessage: (() => void) | undefined;

    const init = async () => {
      try {
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        if (!isSupported) return;

        const messaging = getClientMessaging();
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setError('Permiso de notificaciones denegado');
          return;
        }

        const currentToken = await getToken(messaging, {
          vapidKey: vapidKey || undefined,
        });

        if (currentToken) {
          setToken(currentToken);
          await updateDoc(doc(db, 'users', user.uid), {
            fcmTokens: arrayUnion(currentToken),
          });
        } else {
          setError('No se pudo obtener el token FCM');
        }

        unsubscribeMessage = onMessage(messaging, (payload) => {
          // Foreground message: podríamos mostrar un toast, pero la UI ya
          // se actualiza vía Firestore onSnapshot. Dejamos log para debug.
          console.log('FCM foreground message:', payload);
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error FCM';
        setError(msg);
      }
    };

    init();

    return () => {
      if (unsubscribeMessage) unsubscribeMessage();
    };
  }, []);

  const removeToken = async () => {
    if (!token) return;
    const auth = getClientAuth();
    const user = auth.currentUser;
    if (!user) return;

    const messaging = getClientMessaging();
    const db = getClientFirestore();

    await deleteToken(messaging);
    await updateDoc(doc(db, 'users', user.uid), {
      fcmTokens: arrayRemove(token),
    });
    setToken(null);
  };

  return { token, error, removeToken };
}
