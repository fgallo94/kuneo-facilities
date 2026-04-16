/**
 * Promueve un usuario existente a admin tanto en Firebase Auth (custom claims)
 * como en Firestore (documento users/{uid}).
 *
 * Requiere la variable de entorno GOOGLE_APPLICATION_CREDENTIALS apuntando
 * a tu serviceAccountKey.json descargado desde Firebase Console.
 *
 * Ejemplo de uso:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\feder\Downloads\serviceAccountKey.json"
 *   npx tsx scripts/make-admin.ts lU9vecBMXFZm8n1oIPpc9SGDaqR2
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const UID = process.argv[2] || 'lU9vecBMXFZm8n1oIPpc9SGDaqR2';

async function main() {
  if (getApps().length === 0) {
    initializeApp();
  }

  const auth = getAuth();
  const db = getFirestore();

  try {
    // 1. Asignar custom claim de admin
    await auth.setCustomUserClaims(UID, { role: 'admin' });

    // 2. Recuperar datos del usuario para persistir en Firestore
    const user = await auth.getUser(UID);

    // 3. Crear / actualizar documento en Firestore
    await db.collection('users').doc(UID).set(
      {
        uid: UID,
        email: user.email,
        displayName: user.displayName || 'Administrador',
        role: 'admin',
        assignedEntities: [],
        updatedAt: new Date(),
      },
      { merge: true }
    );

    console.log(`✅ Usuario ${UID} promovido a admin correctamente.`);
    console.log({ uid: UID, email: user.email, displayName: user.displayName });
  } catch (error) {
    console.error('❌ Error al promover usuario:', error);
    process.exit(1);
  }
}

main();
