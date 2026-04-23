import * as functions from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { notificationIncidenceDataSchema } from '../schemas/notificationPayloadSchema';
import { getPublicStatus, isAdminOnlyTransition } from '../lib/incidenceVisibility';
import { notifyAdmins } from '../lib/adminNotifications';

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

  // FCM push
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

export async function handleIncidenceUpdated(event: {
  data?: {
    before: { data: () => Record<string, unknown> | undefined };
    after: { data: () => Record<string, unknown> | undefined };
  };
  params: { incidenceId: string };
}): Promise<void> {
  const change = event.data;
  if (!change) {
    console.log('No change data for event');
    return;
  }

  const beforeData = change.before.data();
  const afterData = change.after.data();
  if (!beforeData || !afterData) {
    console.log('Missing before/after data');
    return;
  }

  const incidenceId = event.params.incidenceId;
  const db = getFirestore();
  const messaging = getMessaging();

  const before = notificationIncidenceDataSchema.safeParse(beforeData);
  const after = notificationIncidenceDataSchema.safeParse(afterData);

  if (!before.success || !after.success) {
    console.error('Invalid incidence data in trigger');
    return;
  }

  const beforeInc = before.data;
  const afterInc = after.data;
  const updatedBy = (afterData.updatedBy as string) || '';
  const isAdminAction = updatedBy !== afterInc.reportedBy;

  // 1. Cambio de conformidad (aceptación/rechazo por el usuario)
  // Se evalúa antes que el cambio de estado porque en el flujo de conformidad
  // ambos cambian simultáneamente (status + conformityStatus).
  if (beforeInc.conformityStatus !== afterInc.conformityStatus && !isAdminAction) {
    if (afterInc.conformityStatus === 'accepted') {
      await notifyAdmins(db, messaging, 'conformityResponse', {
        type: 'conformity_accepted',
        title: `Conformidad aceptada: ${afterInc.title}`,
        message: 'El usuario ha aceptado la reparación. La incidencia está lista para facturar.',
        incidenceId,
        urgency: 'normal',
        createdBy: updatedBy,
      });
      return;
    }

    if (afterInc.conformityStatus === 'rejected') {
      const reason = afterInc.conformityReason || 'Sin motivo especificado';
      await notifyAdmins(db, messaging, 'conformityResponse', {
        type: 'conformity_rejected',
        title: `Conformidad rechazada: ${afterInc.title}`,
        message: `El usuario rechazó la reparación. Motivo: ${reason}`,
        incidenceId,
        urgency: afterInc.urgency === 'urgent' ? 'urgent' : 'normal',
        createdBy: updatedBy,
      });
      return;
    }
  }

  // 2. Cambio de estado
  if (beforeInc.status !== afterInc.status) {
    // Admin pasó de En reparación → Reparado: solicitar conformidad
    if (beforeInc.status === 'En reparación' && afterInc.status === 'Reparado' && isAdminAction) {
      await notifyUser(db, messaging, afterInc.reportedBy, {
        type: 'conformity_request',
        title: `Reparación completada: ${afterInc.title}`,
        message: 'Tu incidencia ha sido reparada. Por favor, revisa y confirma si estás conforme con la reparación.',
        incidenceId,
        urgency: afterInc.urgency === 'urgent' ? 'urgent' : 'normal',
        createdBy: updatedBy,
      });
      return;
    }

    // Otros cambios de estado por admin
    if (isAdminAction) {
      // Si la transición es puramente administrativa, no molestar al usuario
      if (isAdminOnlyTransition(beforeInc.status, afterInc.status)) {
        console.log(
          `Admin-only transition ${beforeInc.status} → ${afterInc.status} for incidence ${incidenceId}. Skipping user notification.`
        );
        return;
      }

      // Notificar al usuario con estados públicos simplificados
      const publicFrom = getPublicStatus(beforeInc.status);
      const publicTo = getPublicStatus(afterInc.status);
      await notifyUser(db, messaging, afterInc.reportedBy, {
        type: 'status_change',
        title: `Actualización: ${afterInc.title}`,
        message: `La incidencia pasó de "${publicFrom}" a "${publicTo}".`,
        incidenceId,
        urgency: afterInc.urgency === 'urgent' ? 'urgent' : 'normal',
        createdBy: updatedBy,
      });
      return;
    }

    // Cambio de estado por el usuario fuera del flujo de conformidad
    if (!isAdminAction) {
      await notifyAdmins(db, messaging, 'conformityResponse', {
        type: 'status_change',
        title: `Cambio de estado por usuario: ${afterInc.title}`,
        message: `El usuario cambió el estado de "${beforeInc.status}" a "${afterInc.status}".`,
        incidenceId,
        urgency: afterInc.urgency === 'urgent' ? 'urgent' : 'normal',
        createdBy: updatedBy,
      });
      return;
    }
  }
}

export const onIncidenceUpdated = functions
  .region('us-central1')
  .firestore.document('incidences/{incidenceId}')
  .onUpdate((change, context) => {
    return handleIncidenceUpdated({
      data: change,
      params: context.params as { incidenceId: string },
    });
  });
