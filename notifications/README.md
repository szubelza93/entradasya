# Notifications

Microservicio de notificaciones por correo de EntradasYa. Está construido con Node.js, Express y Nodemailer; no utiliza base de datos.

No requiere migraciones ni inicialización de esquema.

## Requisitos

- Node.js 20 o superior.
- Una cuenta de Yahoo y su contraseña de aplicación.

## Instalación

Desde esta carpeta:

```powershell
npm install
Copy-Item .env.example .env
```

Configura `SMTP_USER` con tu cuenta Yahoo y `SMTP_PASS` con su contraseña de
aplicación. No subas `.env` al repositorio.

### Variables de entorno

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `PORT` | No | Puerto HTTP (por defecto `3006`). |
| `SMTP_HOST` | Sí | Host del servidor SMTP. |
| `SMTP_PORT` | Sí | Puerto SMTP (por ejemplo, `465`). |
| `SMTP_SECURE` | Sí | `true` para TLS implícito; `false` para conexión STARTTLS. |
| `SMTP_USER` | Sí para Yahoo | Cuenta usada para autenticarse en SMTP. |
| `SMTP_PASS` | Sí para Yahoo | Contraseña de aplicación SMTP. |
| `EMAIL_FROM` | Sí para enviar | Remitente de los correos. |
| `ORDERS_API_KEY` | Sí para confirmaciones | Clave interna compartida con `orders`. |

## Ejecución

```bash
npm start
# o, en desarrollo:
npm run dev
```

El servicio verifica la conexión SMTP antes de escuchar en el puerto configurado. Si la conexión falla, el proceso termina. El puerto predeterminado es `3006`.

## Endpoints

### Estado

`GET /health`

Respuesta `200`:

```json
{
  "service": "notifications",
  "status": "ok",
  "checks": { "smtp": "ok" },
  "timestamp": "2026-11-18T12:00:00.000Z"
}
```

El servicio verifica SMTP en cada chequeo. Responde `503` y marca `smtp` como
`error` si el proveedor no está disponible. También acepta
`GET /api/notifications/health` detrás del proxy.

### Enviar correo de prueba

`POST /api/notifications/test` con `Content-Type: application/json`:

```json
{
  "to": "destinatario@example.com"
}
```

### Enviar confirmación de compra

`POST /api/notifications/purchase-confirmation` con `Content-Type: application/json` requiere el encabezado interno `x-orders-key`, configurado mediante `ORDERS_API_KEY`.

```json
{
  "to": "destinatario@example.com",
  "customerName": "Ana Pérez",
  "orderId": "ORD-12345",
  "eventName": "Concierto de ejemplo",
  "ticketsUrl": "https://entradas.example.com/mis-entradas/ORD-12345"
}
```

Todos los campos son obligatorios. `to` debe ser un correo válido y `ticketsUrl` debe usar `http` o `https`. Devuelve `200` cuando se envía el mensaje y `400` si los datos no son válidos.

Los errores del proveedor SMTP se procesan como errores internos (`500`). El límite del cuerpo JSON es de 16 KB; solicitudes JSON malformadas reciben `400` y las que exceden el límite reciben `413`.

## Postman

Importa `EntradasYa Notifications.postman_collection.json` en Postman. La colección usa `{{baseUrl}}`, cuyo valor predeterminado es `http://localhost:3006`.
