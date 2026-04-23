import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import sgMail from '@sendgrid/mail';
import { z } from 'zod';

const sendInvoiceEmailSchema = z.object({
  incidenceId: z.string().min(1),
  counterEmail: z.string().email(),
  counterName: z.string().min(1),
  amount: z.number().positive(),
  concept: z.string().min(1),
});

export const sendInvoiceEmail = functions.https.onCall({ cors: true }, async (request) => {
  // 1. Solo admins pueden enviar emails de factura
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Se requiere autenticación');
  }

  const db = getFirestore();
  const callerDoc = await db.collection('users').doc(request.auth.uid).get();
  const callerData = callerDoc.data();

  if (!callerData || callerData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden enviar facturas');
  }

  // 2. Validar payload
  const parseResult = sendInvoiceEmailSchema.safeParse(request.data);
  if (!parseResult.success) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      parseResult.error.issues.map((e) => e.message).join(', ')
    );
  }

  const { incidenceId, counterEmail, counterName, amount, concept } = parseResult.data;

  // 3. Obtener detalles de la incidencia
  const incidenceDoc = await db.collection('incidences').doc(incidenceId).get();
  if (!incidenceDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Incidencia no encontrada');
  }

  const incidence = incidenceDoc.data();
  const title = incidence?.title ?? 'Sin título';
  const description = incidence?.description ?? '';

  // 4. Configurar SendGrid
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@kuneo.app';

  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'SendGrid no está configurado');
  }

  sgMail.setApiKey(apiKey);

  // 5. Construir email con buenas prácticas anti-spam
  const subject = `Resumen de incidencia — ${title}`;

  const textBody = `Hola ${counterName},

Te informamos que se ha registrado un nuevo movimiento relacionado con la siguiente incidencia gestionada en Kuneo:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Incidencia: ${title}
Descripción: ${description}
Concepto: ${concept}
Importe: ${amount.toFixed(2)} €
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Si necesitas más información o tienes alguna consulta, responde directamente a este mensaje.

---
Este mensaje fue enviado automáticamente por Kuneo Facilities Management.
Si no deseas recibir estos avisos, responde con el asunto "Unsubscribe".
Web: https://kuneo.app
`;

  const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de incidencia</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:28px 36px; border-bottom:3px solid #2563eb;">
              <h1 style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:20px; color:#1a1a1a;">Notificación de incidencia</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 36px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.6; color:#333333;">
              <p style="margin:0 0 14px;">Hola ${counterName},</p>
              <p style="margin:0 0 22px;">Te informamos que se ha registrado un nuevo movimiento relacionado con la siguiente incidencia:</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8f9fa; border-radius:6px; border-left:4px solid #2563eb;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px; font-size:14px; color:#333333;"><strong style="color:#1a1a1a;">Incidencia:</strong> ${title}</p>
                    <p style="margin:0 0 8px; font-size:14px; color:#333333;"><strong style="color:#1a1a1a;">Descripción:</strong> ${description}</p>
                    <p style="margin:0 0 8px; font-size:14px; color:#333333;"><strong style="color:#1a1a1a;">Concepto:</strong> ${concept}</p>
                    <p style="margin:12px 0 0; font-size:18px; color:#2563eb; font-weight:bold; font-family:Arial,Helvetica,sans-serif;">Importe: ${amount.toFixed(2)} €</p>
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0; font-size:13px; color:#666666;">Si necesitas más información o tienes alguna consulta, responde directamente a este mensaje.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px; background-color:#f8f9fa; border-top:1px solid #e9ecef; font-family:Arial,Helvetica,sans-serif; font-size:11px; line-height:1.5; color:#6c757d;">
              <p style="margin:0 0 8px;">Este mensaje fue enviado automáticamente por <strong>Kuneo Facilities Management</strong>.</p>
              <p style="margin:0 0 8px;">Si no deseas recibir estos avisos, <a href="mailto:${fromEmail}?subject=Unsubscribe" style="color:#2563eb; text-decoration:underline;">haz clic aquí para darte de baja</a>.</p>
              <p style="margin:0;"><a href="https://kuneo.app" style="color:#6c757d; text-decoration:none;">kuneo.app</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await sgMail.send({
      to: { email: counterEmail, name: counterName },
      from: { email: fromEmail, name: 'Kuneo Facilities' },
      replyTo: fromEmail,
      subject,
      text: textBody,
      html: htmlBody,
      headers: {
        'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'OOF',
      },
      categories: ['incidence-notification'],
    });
    console.log(`Email enviado a ${counterEmail} para incidencia ${incidenceId}`);
  } catch (err: unknown) {
    const sgError = err as { response?: { body?: { errors?: Array<{ message: string }> } }; message?: string };
    console.error('SendGrid error:', sgError.response?.body || (err instanceof Error ? err.message : err));
    throw new functions.https.HttpsError(
      'internal',
      sgError.response?.body?.errors?.[0]?.message || (err instanceof Error ? err.message : 'Error al enviar el email via SendGrid')
    );
  }

  // 6. Actualizar estado de la incidencia a "Facturada"
  await db.collection('incidences').doc(incidenceId).update({
    status: 'Facturada',
    updatedAt: new Date(),
    updatedBy: request.auth.uid,
  });

  // 7. Registrar en historial el cambio de estado
  const caller = await admin.auth().getUser(request.auth.uid);
  const callerName = caller.displayName || caller.email || 'Usuario';

  await db.collection('incidences').doc(incidenceId).collection('history').add({
    changedBy: request.auth.uid,
    changedByName: callerName,
    changeType: 'status',
    oldStatus: 'A facturar',
    newStatus: 'Facturada',
    timestamp: new Date(),
  });

  return { success: true };
});
