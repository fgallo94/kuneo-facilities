🛠️ Stack Tecnológico Completo (Ecosistema Kuneo)
Aunque ya tienes la base (Next.js + Firebase), para cumplir con las buenas prácticas, la validación y el testing, este debe ser tu ecosistema completo:

1. Core & Frontend:

Framework: Next.js 15+ (usando App Router para aprovechar Server Components y optimizar carga).

Lenguaje: TypeScript (Obligatorio para evitar errores en tiempo de ejecución y mantener la consistencia de los datos).

Estilos: Tailwind CSS (Permite maquetar rapidísimo de forma responsive) + shadcn/ui (opcional, pero altamente recomendado para tener componentes accesibles como modales, tablas y botones sin programarlos desde cero).

Manejo de Formularios: react-hook-form combinado con Zod (Para validar en el cliente antes de enviar a Firebase).

2. Backend & Cloud (Firebase):

Base de Datos: Cloud Firestore.

Archivos: Cloud Storage.

Autenticación: Firebase Authentication (Email/Password).

Lógica de Servidor: Firebase Cloud Functions (Node.js).

Notificaciones: Firebase Cloud Messaging (FCM).

Inteligencia Artificial: Extensiones de Firebase con Gemini API (o la SDK directa @google/genai dentro de las Cloud Functions).

3. Entorno de Testing:

Unitario (Frontend): Vitest (o Jest) + React Testing Library.

Integración (Backend): Firebase Local Emulator Suite (¡Crucial! Permite probar la base de datos y las funciones localmente sin gastar cuota ni ensuciar datos reales).

📐 Análisis Exhaustivo de Reglas y Arquitectura
🖥️ Reglas para el Frontend (Next.js)
Arquitectura por Funcionalidades (Feature-Sliced Design): No agrupes todos los componentes en una carpeta. Agrupa por dominio. Ej: src/features/incidences, src/features/auth, src/features/admin. Cada feature debe tener sus propios componentes, hooks y tipos.

Principio DRY y Custom Hooks: NUNCA llames a Firebase directamente desde un componente visual (UI). Crea hooks personalizados (ej. useIncidences(), useAuth()) que encapsulen la lógica. Si cambias de base de datos mañana, solo cambias el hook, no la UI.

Componentes Tontos vs Inteligentes: Los componentes que renderizan UI (botones, tarjetas de incidencia) deben ser "tontos" (reciben datos por props). Las páginas o componentes superiores son "inteligentes" (llaman a la base de datos y pasan los datos hacia abajo).

Validación Estricta: Toda entrada del usuario se valida con un esquema de Zod. Si el frontend falla la validación, el botón de "Enviar" ni siquiera hace la petición.

⚙️ Reglas para el Backend (Firebase & Functions)
Reglas de Seguridad de Firestore (No confíes en el Frontend):

Un usuario "normal" SOLO puede leer/escribir documentos donde userId == request.auth.uid.

Un "Admin" o "Apoderado" valida su rol a través de Custom Claims en el token de autenticación (ej. request.auth.token.role == 'admin').

Funciones Idempotentes: Las Cloud Functions (ej. la que envía el email o actualiza el estado) deben estar diseñadas para que, si se ejecutan dos veces por error, no dupliquen el envío ni rompan la base de datos.

Principio de Privilegio Mínimo: Las funciones backend deben usar el Firebase Admin SDK con cuidado, validando siempre si el usuario que disparó la función (mediante onCall) tiene permisos para hacerlo.

🧪 Estrategia de Testing (TDD Continuo)
Unit Tests: Se deben generar inmediatamente al crear una función de utilidad (ej. calcular el tiempo transcurrido desde la incidencia) o un componente UI complejo.

Integration Tests: Cada vez que se crea una regla de Firestore o una Cloud Function, se debe escribir un test que se ejecute contra el Firebase Emulator, probando tanto el "Happy Path" (lo que debe funcionar) como el "Unhappy Path" (intentos de hackeo o roles incorrectos que deben ser rechazados).


# Contexto del Proyecto: Kuneo App

Eres un Desarrollador Senior Full-Stack experto en Next.js (App Router), TypeScript, Tailwind CSS y el ecosistema de Firebase. Tu misión es ayudarme a construir la aplicación "Kuneo", un sistema B2B de gestión de incidencias inmobiliarias.

## 🛠️ Stack Tecnológico
- Frontend: Next.js 15+ (App Router), React 18, TypeScript, Tailwind CSS.
- Formularios: React Hook Form + Zod.
- Backend/BaaS: Firebase (Auth, Firestore, Storage, Cloud Functions, Cloud Messaging).
- IA: Gemini API (vía Firebase/Functions).
- Testing: Vitest, React Testing Library, Firebase Local Emulator Suite.

## 📜 Reglas Arquitectónicas y de Código (¡ESTRICTAS!)

1. **Código Limpio y DRY:** No repitas código. Extrae lógicas comunes a `utils/` y la interacción con Firebase a Custom Hooks (ej. `hooks/useFirestore.ts`).
2. **Tipado Estricto:** Usa TypeScript siempre. Define interfaces/types precisos para cada modelo de la base de datos (Ej: `Incidence`, `User`, `Property`). Evita el uso de `any`.
3. **Validación:** Todo input de usuario y todo payload enviado a Cloud Functions DEBE ser validado previamente con Zod.
4. **Seguridad (Zero Trust):** Asume que el frontend puede ser manipulado. Toda validación de roles y permisos se debe duplicar en las Reglas de Firestore y en las Cloud Functions mediante Custom Claims.
5. **Componentes:** Sigue una estructura mobile-first. Utiliza componentes funcionales, Server Components donde sea posible para mejorar el rendimiento, y Client Components (`'use client'`) solo cuando requieras interactividad o hooks de React.

## 🧪 Reglas de Testing Obligatorias
Por cada funcionalidad nueva que te pida generar, DEBES seguir este flujo:
1. Entregar el código del componente/función.
2. Entregar inmediatamente el test unitario (`.test.tsx` o `.test.ts`) correspondiente.
3. Si la funcionalidad incluye Firebase, generar las reglas de seguridad necesarias y el test de integración pensado para ejecutarse en el Firebase Emulator.

## 🚀 Flujo de Trabajo
Cuando te solicite una nueva funcionalidad:
1. Haz preguntas si hay ambigüedad.
2. Plantea una breve solución técnica (1-2 párrafos) antes de escupir código.
3. Proporciona el código modularizado.
4. Proporciona los tests de la nueva funcionalidad.

¿Entendido? Responde "Sistema Kuneo Inicializado. ¿Qué funcionalidad vamos a construir hoy?" si has comprendido estas reglas.