import * as functions from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

async function notifyUser(
  db: FirebaseFirestore.Firestore,
  messaging: ReturnType<typeof getMessaging>,
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    incidenceId: string;
    urgency: 'normal' | 'urgent';
    createdBy: string;
  }
): Promise<void> {
  const inboxRef = db.collection('userNotifications').doc(userId).collection('inbox').doc();
  await inboxRef.set({
    ...notification,
    notificationId: inboxRef.id,
    read: false,
    dismissed: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  const tokens: string[] = userData?.fcmTokens || [];
  if (tokens.length === 0) return;

  try {
    const response = await messaging.sendEachForMulticast({
      notification: { title: notification.title, body: notification.message },
      data: { incidenceId: notification.incidenceId, urgency: notification.urgency, type: notification.type },
      tokens,
    });
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(tokens[idx]);
        }
      });
      if (invalidTokens.length > 0) {
        await userDoc.ref.update({ fcmTokens: FieldValue.arrayRemove(...invalidTokens) });
      }
    }
  } catch (err) {
    console.error(`FCM send error for user ${userId}:`, err);
  }
}

async function notifyAdmins(
  db: FirebaseFirestore.Firestore,
  messaging: ReturnType<typeof getMessaging>,
  notification: {
    type: string;
    title: string;
    message: string;
    incidenceId: string;
    urgency: 'normal' | 'urgent';
    createdBy: string;
  }
): Promise<void> {
  const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
  if (adminsSnapshot.empty) return;

  const batchLimit = 500;
  let batch = db.batch();
  let count = 0;

  for (const adminDoc of adminsSnapshot.docs) {
    const adminId = adminDoc.id;
    const inboxRef = db.collection('userNotifications').doc(adminId).collection('inbox').doc();
    batch.set(inboxRef, {
      ...notification,
      notificationId: inboxRef.id,
      read: false,
      dismissed: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    count++;
    if (count === batchLimit) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) await batch.commit();

  const fcmPromises = adminsSnapshot.docs.map(async (adminDoc) => {
    const adminData = adminDoc.data();
    const tokens: string[] = adminData.fcmTokens || [];
    if (tokens.length === 0) return;
    try {
      const response = await messaging.sendEachForMulticast({
        notification: { title: notification.title, body: notification.message },
        data: { incidenceId: notification.incidenceId, urgency: notification.urgency, type: notification.type },
        tokens,
      });
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[idx]);
          }
        });
        if (invalidTokens.length > 0) {
          await adminDoc.ref.update({ fcmTokens: FieldValue.arrayRemove(...invalidTokens) });
        }
      }
    } catch (err) {
      console.error(`FCM send error for admin ${adminDoc.id}:`, err);
    }
  });
  await Promise.allSettled(fcmPromises);
}

export async function handleCommentCreated(event: {
  data?: { data: () => Record<string, unknown> | undefined };
  params: { incidenceId: string; commentId: string };
}): Promise<void> {
  const snapshot = event.data;
  if (!snapshot) {
    console.log('No snapshot data for comment event');
    return;
  }

  const commentData = snapshot.data();
  if (!commentData) {
    console.log('No data in comment snapshot');
    return;
  }

  const incidenceId = event.params.incidenceId;
  const db = getFirestore();
  const messaging = getMessaging();

  // Obtener incidencia padre
  const incidenceDoc = await db.collection('incidences').doc(incidenceId).get();
  if (!incidenceDoc.exists) {
    console.log('Incidence not found for comment');
    return;
  }

  const incidence = incidenceDoc.data() as { title: string; reportedBy: string; urgency?: string } | undefined;
  if (!incidence) return;

  const authorId = String(commentData.authorId || '');
  const authorName = String(commentData.authorName || 'Usuario');
  const text = String(commentData.text || '');
  const reportedBy = incidence.reportedBy;

  // Si el autor es el reportador → notificar a admins
  if (authorId === reportedBy) {
    await notifyAdmins(db, messaging, {
      type: 'comment',
      title: `Nuevo comentario: ${incidence.title}`,
      message: `${authorName}: ${text.substring(0, 150)}`,
      incidenceId,
      urgency: incidence.urgency === 'urgent' ? 'urgent' : 'normal',
      createdBy: authorId,
    });
    return;
  }

  // Si el autor es otro (admin) → notificar al reportador
  await notifyUser(db, messaging, reportedBy, {
    type: 'comment',
    title: `Nuevo comentario en tu incidencia: ${incidence.title}`,
    message: `${authorName}: ${text.substring(0, 150)}`,
    incidenceId,
    urgency: incidence.urgency === 'urgent' ? 'urgent' : 'normal',
    createdBy: authorId,
  });
}

export const onCommentCreated = functions
  .region('us-central1')
  .firestore.document('incidences/{incidenceId}/comments/{commentId}')
  .onCreate((snapshot, context) => {
    return handleCommentCreated({
      data: { data: () => snapshot.data() as Record<string, unknown> | undefined },
      params: context.params as { incidenceId: string; commentId: string },
    });
  });
