import { FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { sendEmail } from './sendGrid';
import { sendWhatsApp } from './twilioClient';

export type NotificationEvent = 'incidenceCreated' | 'commentAdded' | 'conformityResponse';

interface AdminNotificationPrefs {
  incidenceCreated?: string[];
  commentAdded?: string[];
  conformityResponse?: string[];
}

interface AdminData {
  email?: string;
  displayName?: string;
  phone?: string;
  fcmTokens?: string[];
  notificationPreferences?: AdminNotificationPrefs;
}

function getChannelsForEvent(
  prefs: AdminNotificationPrefs | undefined,
  event: NotificationEvent
): ('email' | 'whatsapp')[] {
  if (!prefs) return [];
  const channels = prefs[event];
  if (!channels || !Array.isArray(channels)) return [];
  return channels.filter((c): c is 'email' | 'whatsapp' => c === 'email' || c === 'whatsapp');
}

export async function notifyAdmins(
  db: FirebaseFirestore.Firestore,
  messaging: ReturnType<typeof getMessaging>,
  event: NotificationEvent,
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
    const adminData = adminDoc.data() as AdminData;
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

  const emailPromises: Promise<unknown>[] = [];
  const whatsappPromises: Promise<unknown>[] = [];

  for (const adminDoc of adminsSnapshot.docs) {
    const adminData = adminDoc.data() as AdminData;
    const channels = getChannelsForEvent(adminData.notificationPreferences, event);

    if (channels.includes('email') && adminData.email) {
      emailPromises.push(
        sendEmail({
          to: adminData.email,
          toName: adminData.displayName,
          subject: notification.title,
          text: `${notification.title}\n\n${notification.message}\n\n---\nKuneo Facilities Management`,
          html: `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td align="center" style="padding:20px 10px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;border-radius:8px;">
<tr><td style="padding:28px 36px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#333;">
<h2 style="margin:0 0 14px;font-size:18px;color:#1a1a1a;">${notification.title}</h2>
<p style="margin:0 0 14px;">${notification.message.replace(/\n/g, '<br>')}</p>
<p style="margin:22px 0 0;font-size:13px;color:#666;"><a href="https://kuneo.app" style="color:#2563eb;">Ver en Kuneo</a></p>
</td></tr>
<tr><td style="padding:20px 36px;background-color:#f8f9fa;border-top:1px solid #e9ecef;font-size:11px;color:#6c757d;">
<p style="margin:0;">Kuneo Facilities Management</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
          categories: ['admin-notification'],
        }).catch((err) => {
          console.error(`Email send error for admin ${adminDoc.id}:`, err);
        })
      );
    }

    if (channels.includes('whatsapp') && adminData.phone) {
      whatsappPromises.push(
        sendWhatsApp({
          to: adminData.phone,
          body: `*${notification.title}*\n\n${notification.message}\n\n_Ver en Kuneo: https://kuneo.app_`,
        }).catch((err) => {
          console.error(`WhatsApp send error for admin ${adminDoc.id}:`, err);
        })
      );
    }
  }

  await Promise.allSettled([...fcmPromises, ...emailPromises, ...whatsappPromises]);
}
