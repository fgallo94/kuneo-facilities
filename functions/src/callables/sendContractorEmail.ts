import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import sgMail from '@sendgrid/mail';
import { z } from 'zod';

const sendContractorEmailSchema = z.object({
  incidenceId: z.string().min(1),
  contractorId: z.string().min(1),
  contractorEmail: z.string().email(),
  contractorName: z.string().min(1),
  contractorPhone: z.string().optional(),
  extraContext: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
});

export const sendContractorEmail = functions.https.onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Se requiere autenticación');
  }

  const db = getFirestore();
  const callerDoc = await db.collection('users').doc(request.auth.uid).get();
  const callerData = callerDoc.data();

  if (!callerData || callerData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden enviar incidencias a contratistas');
  }

  const parseResult = sendContractorEmailSchema.safeParse(request.data);
  if (!parseResult.success) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      parseResult.error.issues.map((e) => e.message).join(', ')
    );
  }

  const {
    incidenceId,
    contractorId,
    contractorEmail,
    contractorName,
    extraContext,
    imageUrls,
  } = parseResult.data;

  const incidenceDoc = await db.collection('incidences').doc(incidenceId).get();
  if (!incidenceDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Incidencia no encontrada');
  }

  const incidence = incidenceDoc.data();
  const title = incidence?.title ?? 'Sin título';
  const description = incidence?.description ?? '';
  const category = incidence?.category ?? '';
  const propertyId = incidence?.propertyId ?? '';
  const installationId = incidence?.installationId ?? '';

  // Obtener nombres de propiedad/instalación para contexto
  let propertyName = 'Propiedad desconocida';
  let installationName = 'Instalación desconocida';

  if (propertyId) {
    const propDoc = await db.collection('properties').doc(propertyId).get();
    if (propDoc.exists) propertyName = propDoc.data()?.name ?? propertyName;
  }
  if (installationId) {
    const instDoc = await db.collection('installations').doc(installationId).get();
    if (instDoc.exists) installationName = instDoc.data()?.name ?? installationName;
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@kuneo.app';

  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'SendGrid no está configurado');
  }

  sgMail.setApiKey(apiKey);

  const subject = `Nueva incidencia asignada — ${title}`;

  const evidenceSection = imageUrls && imageUrls.length > 0
    ? `\nEvidencias visuales adjuntas:\n${imageUrls.map((url) => `• ${url}`).join('\n')}\n`
    : '';

  const extraContextSection = extraContext
    ? `\nContexto adicional:\n${extraContext}\n`
    : '';

  const textBody = `Hola ${contractorName},

Se te ha asignado una nueva incidencia para su revisión y reparación.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Incidencia: ${title}
Categoría: ${category}
Descripción: ${description}
Ubicación: ${installationName} — ${propertyName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${extraContextSection}${evidenceSection}
Si necesitas más información, responde directamente a este mensaje.

---
Este mensaje fue enviado automáticamente por Kuneo Facilities Management.
Si no deseas recibir estos avisos, responde con el asunto "Unsubscribe".
Web: https://kuneo.app
`;

  const htmlImages = imageUrls && imageUrls.length > 0
    ? `<div style="margin:18px 0;">
        <p style="margin:0 0 10px; font-size:13px; color:#666666;"><strong>Evidencias visuales:</strong></p>
        ${imageUrls.map((url) => `<p style="margin:4px 0; font-size:12px; word-break:break-all;"><a href="${url}" style="color:#2563eb;">${url}</a></p>`).join('')}
      </div>`
    : '';

  const htmlExtraContext = extraContext
    ? `<div style="margin:18px 0; padding:14px 16px; background-color:#fffbeb; border-radius:6px; border-left:4px solid #f59e0b;">
        <p style="margin:0 0 6px; font-size:13px; color:#92400e;"><strong>Contexto adicional:</strong></p>
        <p style="margin:0; font-size:13px; color:#78350f; white-space:pre-wrap;">${extraContext.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>`
    : '';

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
              <h1 style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:20px; color:#1a1a1a;">Nueva incidencia asignada</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 36px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.6; color:#333333;">
              <p style="margin:0 0 14px;">Hola ${contractorName},</p>
              <p style="margin:0 0 22px;">Se te ha asignado una nueva incidencia para su revisión y reparación:</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8f9fa; border-radius:6px; border-left:4px solid #2563eb;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px; font-size:14px; color:#333333;"><strong style="color:#1a1a1a;">Incidencia:</strong> ${title}</p>
                    <p style="margin:0 0 8px; font-size:14px; color:#333333;"><strong style="color:#1a1a1a;">Categoría:</strong> ${category}</p>
                    <p style="margin:0 0 8px; font-size:14px; color:#333333;"><strong style="color:#1a1a1a;">Descripción:</strong> ${description}</p>
                    <p style="margin:0 0 8px; font-size:14px; color:#333333;"><strong style="color:#1a1a1a;">Ubicación:</strong> ${installationName} — ${propertyName}</p>
                  </td>
                </tr>
              </table>
              ${htmlExtraContext}
              ${htmlImages}
              <p style="margin:22px 0 0; font-size:13px; color:#666666;">Si necesitas más información, responde directamente a este mensaje.</p>
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
      to: { email: contractorEmail, name: contractorName },
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
      categories: ['contractor-notification'],
    });
    console.log(`Email enviado a contratista ${contractorEmail} para incidencia ${incidenceId}`);
  } catch (err: unknown) {
    const sgError = err as { response?: { body?: { errors?: Array<{ message: string }> } }; message?: string };
    console.error('SendGrid error:', sgError.response?.body || (err instanceof Error ? err.message : err));
    throw new functions.https.HttpsError(
      'internal',
      sgError.response?.body?.errors?.[0]?.message || (err instanceof Error ? err.message : 'Error al enviar el email via SendGrid')
    );
  }

  // Registrar en historial (NO cambia el estado de la incidencia)
  const caller = await admin.auth().getUser(request.auth.uid);
  const callerName = caller.displayName || caller.email || 'Usuario';

  await db.collection('incidences').doc(incidenceId).collection('history').add({
    changedBy: request.auth.uid,
    changedByName: callerName,
    changeType: 'contractor',
    contractorId,
    contractorName,
    contractorEmail,
    contactMethod: 'email',
    extraContext: extraContext || null,
    timestamp: new Date(),
  });

  return { success: true };
});
