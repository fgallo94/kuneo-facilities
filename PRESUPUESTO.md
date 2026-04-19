# Presupuesto Comercial: Sistema Kuneo
## Gestión de Incidencias Inmobiliarias — Venta de Proyecto (Licencia Perpetua)

---

**Fecha:** Abril 2026  
**Validez de la oferta:** 30 días naturales  
**Modalidad:** Venta de proyecto con licencia perpetua de uso  
**Entrega:** Código fuente completo + despliegue en infraestructura Firebase del cliente

---

## 1. Resumen Ejecutivo

Kuneo es una aplicación web B2B de gestión de incidencias inmobiliarias construida con arquitectura moderna (Next.js 16 + Firebase), lista para producción. Incluye gestión de usuarios con roles, propiedades e instalaciones, creación y seguimiento de incidencias con fotos, dashboard administrativo en tiempo real, y un sistema avanzado de notificaciones push y persistentes.

Este presupuesto desglosa el valor de cada módulo funcional desarrollado.

---

## 2. Alcance del Proyecto Entregado

### Funcionalidades Incluidas

| # | Funcionalidad | Descripción |
|---|--------------|-------------|
| 1 | **Autenticación Segura** | Login/registro con Firebase Auth. Roles de usuario (Admin / Usuario) mediante Custom Claims. Protección de rutas. |
| 2 | **Gestión de Usuarios** | CRUD de usuarios, asignación de roles, visualización de perfiles. |
| 3 | **Gestión de Propiedades** | Alta, edición y organización de comunidades/propiedades, instalaciones y grupos. |
| 4 | **Gestión de Incidencias** | Creación de incidencias con formulario validado (Zod), adjunto de fotos (Cloud Storage), historial de cambios de estado, priorización por severidad/urgencia. |
| 5 | **Dashboard Admin** | Panel de control en tiempo real con estadísticas (pendientes, en curso, resueltas), gráfico de tendencias de los últimos 7 días con 3 niveles de prioridad (Urgente/Alta/Normal), y listado de incidencias recientes. |
| 6 | **Notificaciones en Tiempo Real** | Sistema completo de notificaciones: fan-out pattern vía Cloud Function, notificaciones push FCM, inbox persistente en Firestore, campana con badge, banners de alerta urgentes, y búsqueda global. |
| 7 | **Seguridad Zero Trust** | Reglas de seguridad de Firestore con validación de propiedad, permisos por rol, y validación de payloads con Zod en Cloud Functions. |
| 8 | **Testing Automatizado** | 118 tests unitarios + 6 tests de integración contra Firebase Emulator Suite. Pipeline CI completa. |
| 9 | **Diseño Responsive** | Interfaz mobile-first con Tailwind CSS, adaptada a escritorio, tablet y móvil. |

---

## 3. Desglose de Inversión por Módulo

### Fase 1: Infraestructura y Arquitectura
| Concepto | Detalle | Importe |
|----------|---------|---------|
| Arquitectura técnica | Diseño de arquitectura Firebase + Next.js App Router + Feature-Sliced Design | 500 € |
| Setup proyecto | Configuración inicial, tooling (ESLint, TypeScript estricto, CI/CD), modelado de datos Firestore | 600 € |
| Configuración emuladores | Firebase Local Emulator Suite para desarrollo y testing local | 200 € |
| **Subtotal Fase 1** | | **1.300 €** |

### Fase 2: Autenticación y Gestión de Usuarios
| Concepto | Detalle | Importe |
|----------|---------|---------|
| Firebase Auth integration | Login/registro con listeners en tiempo real | 500 € |
| Sistema de roles | Custom Claims (admin/user), hook useAuth, protección de rutas | 600 € |
| Gestión de usuarios | Listado, creación de usuarios, asignación de roles desde panel admin | 500 € |
| **Subtotal Fase 2** | | **1.600 €** |

### Fase 3: Gestión de Propiedades e Instalaciones
| Concepto | Detalle | Importe |
|----------|---------|---------|
| CRUD Propiedades | Alta, edición y eliminación de comunidades/propiedades | 600 € |
| CRUD Instalaciones | Gestión de instalaciones vinculadas a propiedades | 500 € |
| CRUD Grupos | Organización por grupos de propiedades | 300 € |
| UI y relaciones | Interfaz responsive y navegación entre entidades | 400 € |
| **Subtotal Fase 3** | | **1.800 €** |

### Fase 4: Gestión de Incidencias (Núcleo del Negocio)
| Concepto | Detalle | Importe |
|----------|---------|---------|
| Creación de incidencias | Formulario con React Hook Form + Zod, validación estricta de tipos | 800 € |
| Adjunto multimedia | Carga de imágenes a Firebase Cloud Storage | 400 € |
| Listado y filtros | Vista de incidencias con filtros por estado, prioridad y propiedad | 500 € |
| Detalle e historial | Vista de detalle con historial completo de cambios de estado | 600 € |
| Workflow de estados | Transiciones de estado (Reportada → En reparación → Reparado) | 400 € |
| **Subtotal Fase 4** | | **2.700 €** |

### Fase 5: Dashboard Administrativo y Analytics
| Concepto | Detalle | Importe |
|----------|---------|---------|
| Dashboard en tiempo real | Datos derivados de incidencias con onSnapshot (sin refresco manual) | 600 € |
| Gráfico de tendencias | Evolución de incidencias últimos 7 días con 3 datasets (Urgente/Alta/Normal) | 500 € |
| Estadísticas de estado | Contadores de pendientes, en curso y resueltas | 300 € |
| Lista de incidencias recientes | Tarjetas con color coding por prioridad y estado | 300 € |
| Dashboard de usuario | Vista "Mis incidencias" para usuarios no-admin | 200 € |
| **Subtotal Fase 5** | | **1.900 €** |

### Fase 6: Sistema de Notificaciones Avanzado ⭐
| Concepto | Detalle | Importe |
|----------|---------|---------|
| Cloud Function trigger | Trigger onIncidenceCreated con fan-out pattern a todos los admins | 700 € |
| Notificaciones push FCM | Envío multicast con gestión de tokens inválidos y cleanup | 600 € |
| Inbox persistente | Subcolección userNotifications/{uid}/inbox con datos enriquecidos | 500 € |
| Hook useNotifications | Listener onSnapshot en tiempo real con manejo de errores | 400 € |
| UI Campana de notificaciones | Componente NotificationBell con badge de no leídas, lista desplegable | 350 € |
| Alertas urgentes | UrgentAlertBanner para notificaciones de alta prioridad | 250 € |
| Modal de confirmación | ConfirmDismissModal para descartar alertas | 150 € |
| Búsqueda global | GlobalSearchBar para búsqueda de incidencias desde el header | 250 € |
| **Subtotal Fase 6** | | **3.200 €** |

### Fase 7: Seguridad y Backend
| Concepto | Detalle | Importe |
|----------|---------|---------|
| Firestore Security Rules | Reglas owner-based y admin-based, validación de updates atómicos | 600 € |
| Composite indexes | Índices para consultas complejas (notificaciones, incidencias) | 200 € |
| Cloud Functions v1 | Despliegue de funciones con validación Zod de payloads | 400 € |
| Service Worker FCM | Generación automatizada de firebase-messaging-sw.js | 150 € |
| Configuración producción | Variables de entorno, CORS, ajustes de producción | 150 € |
| **Subtotal Fase 7** | | **1.500 €** |

### Fase 8: Testing y Calidad de Código
| Concepto | Detalle | Importe |
|----------|---------|---------|
| Tests unitarios | 118 tests con Vitest + jsdom + React Testing Library | 700 € |
| Tests de integración | 6 tests contra Firebase Emulator Suite (Auth + Firestore + Functions) | 500 € |
| Pipeline CI/CD | Automatización: lint → type-check → test:unit → test:integration | 300 € |
| TypeScript estricto | Tipado completo sin uso de `any`, interfaces para todos los modelos | 200 € |
| **Subtotal Fase 8** | | **1.700 €** |

### Fase 9: Despliegue y Entrega
| Concepto | Detalle | Importe |
|----------|---------|---------|
| Build producción | Compilación optimizada de Next.js y Cloud Functions | 200 € |
| Deploy Firebase | Hosting, Functions, Firestore Rules, Storage Rules | 300 € |
| Documentación técnica | Guía de despliegue, arquitectura y operación | 200 € |
| Formación básica | Sesión de 1h de onboarding para administradores | 200 € |
| **Subtotal Fase 9** | | **900 €** |

---

## 4. Resumen de Inversión

| Concepto | Importe |
|----------|---------|
| Fase 1: Infraestructura y Arquitectura | 1.300 € |
| Fase 2: Autenticación y Gestión de Usuarios | 1.600 € |
| Fase 3: Gestión de Propiedades e Instalaciones | 1.800 € |
| Fase 4: Gestión de Incidencias | 2.700 € |
| Fase 5: Dashboard y Analytics | 1.900 € |
| Fase 6: Sistema de Notificaciones | 3.200 € |
| Fase 7: Seguridad y Backend | 1.500 € |
| Fase 8: Testing y Calidad | 1.700 € |
| Fase 9: Despliegue y Entrega | 900 € |
| **TOTAL PROYECTO** | **17.600 €** |

### 💰 Oferta Comercial

| Escenario | Precio Final |
|-----------|-------------|
| **Pago único (licencia perpetua)** | **14.900 €** *(descuento del 15%)* |
| **Pago fraccionado** (50% inicio + 50% entrega) | **16.500 €** |
| **Mantenimiento anual** (opcional, updates + soporte) | **1.800 €/año** |

---

## 5. Condiciones del Proyecto

### Incluido en el precio:
- ✅ Código fuente completo del proyecto (repositorio Git)
- ✅ Despliegue en proyecto Firebase del cliente
- ✅ Licencia perpetua de uso para el ámbito contratado
- ✅ Documentación técnica de arquitectura y despliegue
- ✅ Sesión de formación de 1 hora para administradores
- ✅ Garantía de funcionamiento: 3 meses sobre errores críticos

### No incluido (presupuesto aparte):
- ❌ Diseño UX/UI personalizado (se entrega el diseño actual basado en Tailwind)
- ❌ Integraciones con sistemas externos (ERP, contabilidad, etc.)
- ❌ App móvil nativa (la web es responsive/PWA-ready)
- ❌ Hosting e infraestructura Firebase (se despliega en cuenta del cliente)
- ❌ Desarrollos futuros o nuevas funcionalidades post-entrega

### Condiciones de pago:
- **Opción A (recomendada):** Pago único de 14.900 € con 15% de descuento.
- **Opción B:** 50% (8.250 €) al inicio + 50% (8.250 €) contra entrega.
- **Mantenimiento:** 1.800 €/año, pagadero anualmente. Incluye updates de seguridad, resolución de incidencias y soporte técnico prioritario.

---

## 6. Comparativa con el Mercado

| Solución | Precio aproximado (3 admins, 5 años) |
|----------|-------------------------------------|
| Freshservice (SaaS) | ~11.000 € – 18.000 € |
| Jira Service Management | ~4.500 € – 11.500 € |
| SolarWinds Service Desk | ~9.000 € – 23.000 € |
| **Kuneo (licencia perpetua)** | **14.900 € (pago único)** |

**Ventaja competitiva:** A diferencia de los SaaS genéricos, Kuneo está diseñado específicamente para facility management inmobiliario, con priorización de urgencias, notificaciones push a admins y seguimiento de incidencias por propiedad e instalación. Se amortiza en 3-4 años comparado con un SaaS recurrente.

---

## 7. Validez y Aceptación

Este presupuesto tiene una validez de **30 días naturales** desde la fecha de emisión. La aceptación se formalizará mediante firma y pago del anticipo correspondiente.

**Fecha de emisión:** Abril 2026

---

*Este documento es una propuesta comercial confidencial. Queda prohibida su distribución sin autorización expresa.*
