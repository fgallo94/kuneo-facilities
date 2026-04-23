import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createUserSchema } from './schemas/createUserSchema';
import { sendInvoiceEmail } from './callables/sendInvoiceEmail';
import { sendWhatsAppMessage } from './callables/sendWhatsAppMessage';
import { onIncidenceCreated } from './triggers/onIncidenceCreated';
import { onIncidenceUpdated } from './triggers/onIncidenceUpdated';
import { onCommentCreated } from './triggers/onCommentCreated';

// Inicializa la app de admin (idempotente)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export { onIncidenceCreated, onIncidenceUpdated, onCommentCreated, sendInvoiceEmail, sendWhatsAppMessage };

export const createUser = functions.https.onCall({ cors: true }, async (request) => {
  // 1. Solo admins pueden crear usuarios
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Se requiere autenticación');
  }

  const caller = await admin.auth().getUser(request.auth.uid);
  const callerRole = (caller.customClaims?.role as string) ?? 'user';

  if (callerRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden crear usuarios');
  }

  // 2. Validar payload con Zod
  const parseResult = createUserSchema.safeParse(request.data);
  if (!parseResult.success) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      parseResult.error.issues.map((e) => e.message).join(', ')
    );
  }

  const { email, password, displayName, role } = parseResult.data;

  try {
    // 3. Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // 4. Asignar custom claim de rol
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    return {
      uid: userRecord.uid,
      email,
      displayName,
      role,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    throw new functions.https.HttpsError('internal', message);
  }
});
