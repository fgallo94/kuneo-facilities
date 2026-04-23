import * as functions from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { notificationIncidenceDataSchema } from '../schemas/notificationPayloadSchema';
import { notifyAdmins } from '../lib/adminNotifications';

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

  const parseResult = notificationIncidenceDataSchema.safeParse(data);
  if (!parseResult.success) {
    console.error('Invalid incidence data in trigger:', parseResult.error.issues);
    return;
  }

  const inc = parseResult.data;
  const db = getFirestore();
  const messaging = getMessaging();

  const notificationUrgency = inc.urgency === 'urgent' ? 'urgent' : 'normal';

  await notifyAdmins(db, messaging, 'incidenceCreated', {
    type: 'new_incidence',
    title: `Nueva incidencia: ${inc.title}`,
    message: inc.description.substring(0, 200),
    incidenceId,
    urgency: notificationUrgency,
    createdBy: inc.reportedBy,
  });
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
