import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import twilio from 'twilio';
import { z } from 'zod';

const sendWhatsAppSchema = z.object({
  to: z.string().min(1),
  body: z.string().min(1).max(1600),
  templateSid: z.string().optional(),
});

export const sendWhatsAppMessage = functions.https.onCall({ cors: true }, async (request) => {
  // 1. Solo admins pueden enviar mensajes de WhatsApp
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Se requiere autenticación');
  }

  const db = getFirestore();
  const callerDoc = await db.collection('users').doc(request.auth.uid).get();
  const callerData = callerDoc.data();

  if (!callerData || callerData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden enviar mensajes');
  }

  // 2. Validar payload
  const parseResult = sendWhatsAppSchema.safeParse(request.data);
  if (!parseResult.success) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      parseResult.error.issues.map((e) => e.message).join(', ')
    );
  }

  const { to, body, templateSid } = parseResult.data;

  // 3. Configurar Twilio client
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken) {
    throw new functions.https.HttpsError('failed-precondition', 'Twilio no está configurado');
  }

  const client = twilio(accountSid, authToken);

  try {
    let message;

    if (templateSid) {
      // Usar template aprobado por Meta (requerido para iniciar conversaciones)
      message = await client.messages.create({
        from: fromNumber || 'whatsapp:+14155238886',
        to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
        contentSid: templateSid,
      });
    } else {
      // Mensaje libre (solo dentro de la ventana de 24h de conversación)
      message = await client.messages.create({
        from: fromNumber || 'whatsapp:+14155238886',
        to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
        body,
      });
    }

    return { success: true, messageSid: message.sid };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido de Twilio';
    console.error('Twilio WhatsApp error:', err);
    throw new functions.https.HttpsError('internal', errorMessage);
  }
});
