# Orders

Servicio que coordina la compra. Escucha en el puerto `3003` y expone:

- `GET /health` — comprueba la conexión a PostgreSQL; responde `503` si no está disponible.
- `POST /` — requiere el JWT del cliente; recibe `eventId`, `sectorId`, `quantity` y `cardNumber`. Reserva cupos, procesa el pago, genera entradas y envía la confirmación.
- `GET /mias` — requiere el JWT y devuelve el historial del usuario autenticado.

## Configuración

### Requisitos

- Node.js 18 o superior.
- PostgreSQL y una base de datos creada.
- Los servicios `events`, `payments` y `tickets` disponibles para completar una compra.

### Variables de entorno

Copia `.env.example` como `.env` y configura:

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `PORT` | No | Puerto HTTP (por defecto `3003`). |
| `DATABASE_URL` | Sí | URL de conexión PostgreSQL. |
| `JWT_SECRET` | Sí | Mismo secreto que `auth`, para verificar tokens de clientes. |
| `API_KEY` | Sí | Clave compartida por `orders` y `payments`. |
| `ORDERS_API_KEY` | Sí | Clave compartida con `events`, `tickets` y `notifications`. |
| `EVENTS_URL` | Sí | URL base de `events` (en el ejemplo, `http://localhost:3002`). |
| `PAYMENTS_URL` | Sí | URL base de `payments` (en el ejemplo, `http://localhost:3004`). |
| `TICKETS_URL` | Sí | URL base de `tickets` (en el ejemplo, `http://localhost:3005`). |
| `NOTIFICATIONS_URL` | Sí | URL base de `notifications` (en el ejemplo, `http://localhost:3006`). |
| `WEB_URL` | No | URL de la web que se incluye en correos (por defecto `http://localhost:5173`). |

`API_KEY` debe ser un secreto aleatorio de al menos 32 caracteres y coincidir
entre `orders` y `payments`. Configura `ORDERS_API_KEY` con el mismo secreto
aleatorio de al menos 32 caracteres en `orders`, `events`, `tickets` y
`notifications`.

### Instalación y ejecución

Desde esta carpeta instala dependencias y crea el archivo local de variables:

```powershell
npm install
Copy-Item .env.example .env
```

Ejecuta `npm run dev` para desarrollo o `npm start` para iniciar el servicio.
`npm run db:migrate` crea la tabla `orders`; tanto `npm run dev` como `npm start`
aplican migraciones pendientes antes de iniciar. El comando de migración también
se puede ejecutar por separado y es seguro de repetir. Agrega un nuevo archivo
SQL en `db/migrations/` para futuros cambios de esquema. Las tarjetas terminadas
en `0000` se rechazan en el servicio de pagos de prueba; las demás se aprueban.
