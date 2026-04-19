# Plan: Sistema de Notificaciones en Tiempo Real

## 1. Análisis de Documentación Oficial

### Firebase (Context7 + Functions SDK)
- **Cola de Notificaciones:** El patrón recomendado es **Fan-Out con Firestore**. NO usar FCM como única cola porque FCM no es persistente ni permite trackear estado (read/dismiss) por usuario. La práctica estándar es:
  1. Cloud Function `onDocumentCreated` en `incidences`.
  2. La función obtiene todos los admins y hace un **BatchWrite** a `userNotifications/{adminId}/inbox/{notificationId}` para cada uno.
  3. Firestore `onSnapshot` en el cliente escucha SOLO su inbox personal (`userNotifications/{uid}/inbox`), lo cual es escalable y eficiente.
- **FCM:** Se usa como canal secundario de "push nativo" (campana del sistema operativo). Se envía en paralelo o vía Cloud Tasks si hay >500 destinatarios para evitar timeouts. Cada admin almacena sus tokens FCM en `users/{uid}/fcmTokens`.
- **Idempotencia:** La Cloud Function v2 provee `eventId`. Se puede usar para evitar duplicados, aunque con BatchWrite atómico no es estrictamente necesario para el MVP.

### Next.js (Docs locales + Context7)
- **Real-time nativo:** Next.js App Router **NO** tiene WebSockets, SSE ni real-time nativo.
- **Componentes obligatorios:** Todo listener de Firebase (`onSnapshot`) debe vivir en un **Client Component** (`'use client'`). No hay alternativa Server Component para esto.
- **Patrón óptimo:** El `dashboard/layout.tsx` (Server Component) renderiza la estructura estática (logo, navegación) e importa como hijos los componentes interactivos (`NotificationBell`, `UrgentAlertBanner`, `SearchBar`), todos Client Components. Esto minimiza el JS bundle según la guía oficial de Next.js.

## 2. Arquitectura de Datos

### Nuevos Tipos (TypeScript)
```typescript
// src/types/index.ts (ampliar)
interface Notification {
  id: string;
  type: 'new_incidence';
  title: string;
  message: string;
  incidenceId: string;
  urgency: 'normal' | 'urgent';
  createdAt: Timestamp;
  createdBy: string;
}

interface UserNotification {
  id: string;
  notificationId: string;
  type: 'new_incidence';
  title: string;
  message: string;
  incidenceId: string;
  urgency: 'normal' | 'urgent';
  read: boolean;
  dismissed: boolean;
  dismissedAt?: Timestamp;
  dismissedBy?: string; // UID del admin que hizo dismiss
  createdAt: Timestamp;
}
```

### Colecciones Firestore
- `userNotifications/{userId}/inbox/{notificationId}` — Inbox personal de cada usuario. Cada admin tiene sus propios documentos. Esto permite:
  - Queries en tiempo real por usuario (escalabilidad).
  - Estado individual (read/dismiss).
  - Traqueo explícito de quién dio dismiss en el campo `dismissedBy`.

## 3. Componentes y Hooks (Frontend)

### Nuevos archivos
- `src/features/notifications/hooks/useNotifications.ts` — `onSnapshot` a `userNotifications/{uid}/inbox`, filtra `dismissed == false`, expone `notifications`, `urgentAlerts`, `unreadCount`, `isLoading`.
- `src/features/notifications/hooks/useDismissNotification.ts` — Mutación para marcar `dismissed: true`, `dismissedAt: serverTimestamp()`, `dismissedBy: uid`. Si es urgente, abre confirmación antes de ejecutar.
- `src/features/notifications/hooks/useFCM.ts` — Solicita permiso de notificaciones, obtiene token FCM con `getToken`, lo guarda en `users/{uid}/fcmTokens`, y escucha foreground messages con `onMessage`.
- `src/features/notifications/components/NotificationBell.tsx` — Client Component. Campanita con badge (contador no leídas). Dropdown con lista de notificaciones recientes. Al hacer click marca como `read`.
- `src/features/notifications/components/UrgentAlertBanner.tsx` — Client Component. Alerta roja persistente (tipo recuadro de la imagen) que se muestra SI hay notificaciones urgentes no descartadas. Se ubica debajo del header.
- `src/features/notifications/components/ConfirmDismissModal.tsx` — Client Component. Modal que aparece al intentar dismiss de una notificación urgente. Muestra: "Esta notificación es de alta urgencia. ¿Está seguro de que desea descartarla?".
- `src/features/search/components/GlobalSearchBar.tsx` — Client Component. Input con ícono de búsqueda, placeholder "Search incidents, properties...". Filtra incidencias del admin (hook `useAllIncidences`).

### Archivos a modificar
- `src/app/dashboard/layout.tsx` — Integrar nuevo `Header` que componga: logo/título, navegación, `GlobalSearchBar`, `NotificationBell`, avatar/settings. Debajo del header, renderizar `<UrgentAlertBanner />`.

## 4. Backend (Cloud Functions)

### Nuevos archivos
- `functions/src/triggers/onIncidenceCreated.ts`:
  - Trigger: `onDocumentCreated('incidences/{incidenceId}')`.
  - Valida payload con Zod (reutiliza/extiende `incidenceSchema`).
  - Obtiene todos los usuarios con `role == 'admin'` de la colección `users`.
  - Crea los documentos `userNotifications/{adminId}/inbox/{notificationId}` usando `BatchWrite` (máximo 500 por batch).
  - Construye payload FCM y envía a todos los tokens registrados de cada admin.
  - Maneja errores de tokens inválidos (los elimina de `fcmTokens`).
- `functions/src/schemas/notificationPayloadSchema.ts` — Schema Zod para validar datos internos del trigger.

### Archivos a modificar
- `functions/src/index.ts` — Exportar nuevo trigger.

## 5. Seguridad (Firestore Rules)

Actualizar `firestore.rules`:
```
match /userNotifications/{userId}/inbox/{notificationId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null 
    && request.auth.uid == userId
    && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['read', 'dismissed', 'dismissedAt', 'dismissedBy']);
}

match /users/{userId} {
  allow update: if request.auth != null 
    && request.auth.uid == userId
    && request.resource.data.diff(resource.data).affectedKeys()
        .hasOnly(['fcmTokens']);
}
```

## 6. Tests Obligatorios

### Unitarios (Vitest + jsdom)
- `src/features/notifications/hooks/useNotifications.test.ts` — Mockear `onSnapshot`, probar que expone urgentes y conteo correcto.
- `src/features/notifications/components/NotificationBell.test.tsx` — Renderizar, probar badge, dropdown, click read.
- `src/features/notifications/components/UrgentAlertBanner.test.tsx` — Renderizar, verificar que solo muestra urgentes no dismiss.
- `src/features/notifications/components/ConfirmDismissModal.test.tsx` — Probar confirmación en urgente y dismiss directo en normal.

### Integración (Firebase Emulator)
- `functions/src/triggers/onIncidenceCreated.integration.test.ts` — Crear incidencia en Firestore Emulator, esperar que el trigger cree notificaciones en los inboxes de los admins, validar campos y conteo.

## 7. Archivos Afectados (Resumen)

**Crear:**
- `src/features/notifications/hooks/useNotifications.ts`
- `src/features/notifications/hooks/useDismissNotification.ts`
- `src/features/notifications/hooks/useFCM.ts`
- `src/features/notifications/components/NotificationBell.tsx`
- `src/features/notifications/components/UrgentAlertBanner.tsx`
- `src/features/notifications/components/ConfirmDismissModal.tsx`
- `src/features/search/components/GlobalSearchBar.tsx`
- `functions/src/triggers/onIncidenceCreated.ts`
- `functions/src/schemas/notificationPayloadSchema.ts`
- Tests unitarios e integración correspondientes.

**Modificar:**
- `src/types/index.ts`
- `src/app/dashboard/layout.tsx`
- `functions/src/index.ts`
- `firestore.rules`

---

## Pregunta de Approach

**Opción A — Fan-Out Completo (Recomendada):** Cada admin recibe su propio documento en `userNotifications/{uid}/inbox`. Máxima escalabilidad, estado individual perfecto, queries rápidas. Complejidad media (batch write en Cloud Function).

**Opción B — Documento Central + Array:** Una colección `notifications` con un mapa `dismissedBy`. Más simple de escribir pero el documento crece con cada admin, las queries en tiempo real escuchan TODO el documento, y Firestore cobra por lecturas de documentos grandes. No recomendado para >10 admins.

Se propone **Opción A**.
