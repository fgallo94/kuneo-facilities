import * as functions from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { notificationIncidenceDataSchema } from '../schemas/notificationPayloadSchema';

export async function handleIncidenceCreated(event: {
  data?: { data: () => Record<string, unknown> | undefined };
  params: { incidenceId: string };
}): Promise<void> {
  const snapshot = event.data;
  if (!snapshot) {
    console.log('No snapshot data for event');
    return;
  }

  const data = snapshot.data();
  if (!data) {
    console.log('No data in snapshot');
    return;
  }
  const incidenceId = event.params.incidenceId;

  // Validar datos de la incidencia con Zod
  const parseResult = notificationIncidenceDataSchema.safeParse(data);
  if (!parseResult.success) {
    console.error('Invalid incidence data in trigger:', parseResult.error.issues);
    return;
  }

  const inc = parseResult.data;
  const db = getFirestore();
  const messaging = getMessaging();

  // Obtener todos los usuarios admin
  const usersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
  if (usersSnapshot.empty) {
    console.log('No admins found to notify');
    return;
  }

  const admins = usersSnapshot.docs;

  // Mapear urgencia: solo 'urgent' genera alerta roja, el resto es 'normal'
  const notificationUrgency = inc.urgency === 'urgent' ? 'urgent' : 'normal';

  const notificationBase = {
    type: 'new_incidence' as const,
    title: `Nueva incidencia: ${inc.title}`,
    message: inc.description.substring(0, 200),
    incidenceId,
    urgency: notificationUrgency,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: inc.reportedBy,
  };

  // Fan-out: crear un documento por admin en su inbox personal
  const batchLimit = 500;
  let batch = db.batch();
  let count = 0;

  for (const adminDoc of admins) {
    const adminId = adminDoc.id;
    const inboxRef = db
      .collection('userNotifications')
      .doc(adminId)
      .collection('inbox')
      .doc();

    batch.set(inboxRef, {
      ...notificationBase,
      notificationId: inboxRef.id,
      read: false,
      dismissed: false,
    });

    count++;
    if (count === batchLimit) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  // Enviar FCM push notifications a cada admin
  const fcmPromises = admins.map(async (adminDoc) => {
    const adminData = adminDoc.data();
    const tokens: string[] = adminData.fcmTokens || [];
    if (tokens.length === 0) return;

    const multicastMessage = {
      notification: {
        title: notificationBase.title,
        body: notificationBase.message,
      },
      data: {
        incidenceId,
        urgency: notificationUrgency,
        type: 'new_incidence',
      },
      tokens,
    };

    try {
      const response = await messaging.sendEachForMulticast(multicastMessage);
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[idx]);
          }
        });
        if (invalidTokens.length > 0) {
          await adminDoc.ref.update({
            fcmTokens: FieldValue.arrayRemove(...invalidTokens),
          });
        }
      }
    } catch (err) {
      console.error(`FCM send error for admin ${adminDoc.id}:`, err);
    }
  });

  await Promise.allSettled(fcmPromises);
}

export const onIncidenceCreated = functions
  .region('us-central1')
  .firestore.document('incidences/{incidenceId}')
  .onCreate((snapshot, context) => {
    return handleIncidenceCreated({
      data: { data: () => snapshot.data() as Record<string, unknown> | undefined },
      params: context.params as { incidenceId: string },
    });
  });
