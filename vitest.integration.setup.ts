/**
 * Setup exclusivo para tests de integración.
 * Setea las variables de entorno del emulador ANTES de que Vitest cargue
 * cualquier módulo de la aplicación, evitando que Firebase se conecte
 * accidentalmente a los servicios reales en la nube.
 */

process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'demo-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'demo-project.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'demo-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'demo-project.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456:web:abc123';
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL = 'http://127.0.0.1:9091';
process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST = '127.0.0.1:5001';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9091';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
