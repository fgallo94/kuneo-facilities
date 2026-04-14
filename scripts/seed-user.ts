import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Ejecutar con:
// npx tsx scripts/seed-user.ts
// Requiere la variable de entorno GOOGLE_APPLICATION_CREDENTIALS apuntando a tu serviceAccountKey.json

async function main() {
  if (getApps().length === 0) {
    initializeApp();
  }

  const auth = getAuth();

  const email = process.argv[2] || 'admin@kuneo.app';
  const password = process.argv[3] || 'Kuneo2024!';
  const displayName = process.argv[4] || 'Administrador Kuneo';

  try {
    const user = await auth.createUser({
      email,
      password,
      displayName,
    });

    await auth.setCustomUserClaims(user.uid, { role: 'admin' });

    console.log('Usuario creado exitosamente:');
    console.log({ uid: user.uid, email: user.email, displayName: user.displayName });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    process.exit(1);
  }
}

main();
