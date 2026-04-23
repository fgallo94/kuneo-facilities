# Configuración de Notificaciones: Email (SendGrid) + WhatsApp (Twilio)

Este documento describe paso a paso cómo configurar los canales de notificación del sistema Kuneo.

---

## 1. Email transaccional — SendGrid

### ¿Qué se usa?
- Envío de facturas a contadores (`sendInvoiceEmail`)
- Envío de incidencias a contratistas (`sendContractorEmail`)
- Alertas automáticas a administradores (nueva incidencia, comentario, conformidad)

### Prerrequisitos
1. Cuenta en [SendGrid](https://signup.sendgrid.com/)
2. Crear un **Single Sender** verificado (o dominio propio con DKIM/SPF para producción)
3. Generar una **API Key** con permisos de envío de email

### Configuración en Firebase Functions

Las variables se guardan en `functions/.env` (ya está en `.gitignore`):

```bash
# functions/.env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=tu-email-verificado@ejemplo.com
```

> **Seguridad**: nunca comitear este archivo. Si necesitas compartir la configuración con otro desarrollador, usa un gestor de secrets (1Password, Bitwarden, etc.) o los Secret Manager de Firebase.

### Verificar envío de email
1. Crear una incidencia y pasarla a estado **"A facturar"**
2. En el modal de detalle, clic en **"Facturar"**
3. Seleccionar un contador y confirmar
4. Revisar inbox del contador (y spam)

### Solución de problemas comunes (SendGrid)
| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| `550 5.7.1` en Gmail | Falta autenticación de dominio | Configurar DKIM/SPF/DMARC en un dominio propio; el sandbox de `outlook.com` suele ser bloqueado |
| `403 Forbidden` | API key inválida o sin permisos | Revisar que la key tenga permiso "Mail Send" en SendGrid |
| Emails en spam | Falta reputación de dominio | Añadir `List-Unsubscribe`, `Precedence: bulk`, footer legal CAN-SPAM (ya incluido en el código) |

---

## 2. WhatsApp — Twilio

### ¿Qué se usa?
- Envío manual de incidencias a contratistas desde el modal **"Enviar a contratista"**
- Alertas automáticas a administradores según sus preferencias de notificación

### Prerrequisitos
1. Cuenta en [Twilio](https://www.twilio.com/try-twilio)
2. Número de teléfono del destinatario (admin o contratista) registrado en el sandbox

---

## 2A. Sandbox de Twilio (modo prueba / desarrollo)

El sandbox es gratis y permite probar sin verificar un negocio en Meta.

### Paso 1 — Obtener credenciales
En el [Twilio Console](https://console.twilio.com/):
- **Account SID**: `AC...` (página principal)
- **Auth Token**: también en la página principal (ojo, se regenera si lo pierdes)

### Paso 2 — Activar el sandbox de WhatsApp
```
Consola Twilio → Messaging → Try it out → Send a WhatsApp message
```
Verás:
- **Sandbox number**: `+14155238886` (puede variar)
- **Join code**: `join teach-yet` (código único de tu sandbox)

### Paso 3 — Registrar el número del destinatario
El destinatario (admin o contratista) debe:
1. Guardar en su agenda el número del sandbox (`+14155238886`)
2. Enviarle por WhatsApp exactamente: `join teach-yet`
3. Esperar confirmación de Twilio

> ⚠️ **Sin este paso, Twilio rechazará todos los mensajes** con error similar a `Failed to send freeform message because you are outside the allowed window`.

### Paso 4 — Configurar variables en Firebase

Agregar a `functions/.env`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Limitaciones del sandbox
- El destinatario **debe haber iniciado la conversación** primero (enviar `join ...`)
- Solo funciona con los números que ya enviaron el join code
- Mensajes libres (sin template) solo se pueden enviar dentro de la **ventana de 24 horas** desde el último mensaje del destinatario

---

## 2B. WhatsApp Business API (producción)

Cuando el cliente tenga un número de empresa verificado por Meta, migra así:

### Paso 1 — Verificar negocio en Meta
1. Crear cuenta en [Meta for Developers](https://developers.facebook.com/)
2. Crear una app tipo **Business**
3. En **WhatsApp → Getting Started**, vincular un número de teléfono
4. Completar la verificación de negocio (puede tardar días)

### Paso 2 — Crear y aprobar templates
Para iniciar conversaciones **fuera de la ventana de 24h**, Meta exige usar **templates aprobados**.

Ejemplo de templates que puedes solicitar:

| Nombre | Categoría | Contenido |
|--------|-----------|-----------|
| `incidence_alert` | Alerta | `Hola {{1}}, se te ha asignado una nueva incidencia: {{2}}. Descripción: {{3}}.` |
| `admin_notification` | Alerta | `*{{1}}*\n\n{{2}}\n\nVer en Kuneo: https://kuneo.app` |

- Los templates se aprueban en horas o días
- Una vez aprobados, Twilio te da un `contentSid` (SID del template)

### Paso 3 — Actualizar código (si usas templates)
En `functions/src/callables/sendWhatsAppMessage.ts` y `functions/src/lib/twilioClient.ts` puedes pasar `contentSid` en lugar de `body`:

```typescript
await client.messages.create({
  from: 'whatsapp:+34123456789', // tu número verificado
  to: 'whatsapp:+34600123456',
  contentSid: 'HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // SID del template aprobado
  contentVariables: JSON.stringify({ '1': 'Juan', '2': 'Fuga de agua', '3': 'Cocina planta baja' }),
});
```

### Paso 4 — Actualizar variables de entorno
```bash
TWILIO_WHATSAPP_NUMBER=+34XXXXXXXXX  # tu número verificado
```

---

## 3. Configuración de notificaciones por admin

### Dónde se configura
1. Iniciar sesión como admin
2. Ir a **Configuraciones → Notificaciones**
3. Indicar tu teléfono (con código de país, ej: `+34 600 000 000`)
4. Marcar **Email** y/o **WhatsApp** para cada tipo de evento:
   - Nueva incidencia creada
   - Nuevo comentario de usuario
   - Conformidad aceptada o rechazada

### Guardar preferencias
Las preferencias se almacenan en Firestore en `users/{uid}/notificationPreferences`:

```json
{
  "incidenceCreated": ["email", "whatsapp"],
  "commentAdded": ["email"],
  "conformityResponse": ["whatsapp"]
}
```

---

## 4. Deploy a producción

Después de cualquier cambio en variables de entorno o código de functions:

```bash
# 1. Asegurarse de que functions/.env tenga todo
# 2. Deploy
firebase deploy --only firestore:rules,functions

# Si solo cambiaste variables de entorno (sin código):
# firebase deploy --only functions
```

---

## 5. Checklist rápido de verificación

### Email (SendGrid)
- [ ] Cuenta SendGrid creada
- [ ] Single sender verificado
- [ ] API key generada
- [ ] `SENDGRID_API_KEY` y `FROM_EMAIL` en `functions/.env`
- [ ] Prueba de envío desde el modal "Facturar" o "Enviar a contratista → Email"

### WhatsApp Sandbox (Twilio)
- [ ] Cuenta Twilio creada
- [ ] Sandbox de WhatsApp activado
- [ ] Número del destinatario guardado en agenda
- [ ] Destinatario envió `join teach-yet` al sandbox
- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` en `functions/.env`
- [ ] Deploy de functions realizado
- [ ] Teléfono del admin/contratista guardado en su perfil de Kuneo
- [ ] Prueba de envío desde "Enviar a contratista → WhatsApp"

### WhatsApp Business (futuro)
- [ ] Negocio verificado en Meta
- [ ] Número de teléfono aprobado
- [ ] Templates creados y aprobados por Meta
- [ ] Actualizar `TWILIO_WHATSAPP_NUMBER` al número propio
- [ ] Actualizar código para usar `contentSid` si es necesario
