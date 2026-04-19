/**
 * Genera public/firebase-messaging-sw.js a partir de las variables
 * de entorno NEXT_PUBLIC_FIREBASE_* definidas en .env.local.
 *
 * Este script se ejecuta automáticamente antes de `npm run dev` y `npm run build`
 * mediante los hooks predev/prebuild de npm.
 */

const fs = require('fs');
const path = require('path');

// Cargar .env.local manualmente (Node no lo hace por defecto)
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) return;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key && !key.startsWith('#') && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(config).filter(([, v]) => !v);
if (missing.length > 0) {
  console.error(
    `[generate-fcm-sw] Missing env vars: ${missing.map(([k]) => k).join(', ')}`
  );
  process.exit(1);
}

const swContent = `importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config, null, 2)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received', payload);
  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.incidenceId
    ? '/dashboard/incidences?id=' + event.notification.data.incidenceId
    : '/dashboard';
  event.waitUntil(self.clients.openWindow(url));
});
`;

const outputPath = path.join(process.cwd(), 'public', 'firebase-messaging-sw.js');
fs.writeFileSync(outputPath, swContent);
console.log(`[generate-fcm-sw] Generated ${outputPath}`);
