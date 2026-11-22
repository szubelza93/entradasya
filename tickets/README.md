# EntradasYa — microservicio de tickets

Genera tickets PDF con código QR, permite que los clientes consulten y descarguen sus tickets, y permite a los porteros validar códigos y registrar el ingreso.

## Requisitos y configuración

- Node.js 18 o superior.
- PostgreSQL y una base de datos existente.
- El mismo `JWT_SECRET` usado por `auth`, con al menos 32 caracteres.

Desde `tickets`:

```powershell
npm install
Copy-Item .env.example .env
```

Completa `.env` con las credenciales de PostgreSQL y el mismo `JWT_SECRET` y `JWT_ISSUER` configurados en `auth`. El servidor rechaza el secreto JWT de ejemplo y no inicia si la clave es demasiado corta.

### Variables de entorno

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `NODE_ENV` | No | Entorno; `development` activa el log SQL. |
| `PORT` | No | Puerto HTTP (por defecto `3005`). |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Sí | Conexión PostgreSQL; `DB_PORT` por defecto es `5432`. |
| `JWT_SECRET` | Sí | Mismo secreto que `auth`, con mínimo 32 caracteres. |
| `JWT_ISSUER` | No | Issuer esperado para tokens (por defecto `entradasya-auth`). |
| `ORDERS_API_KEY` | Sí | Clave interna compartida con `orders` para emitir entradas. |
| `TICKETS_STORAGE` | No | Carpeta para guardar PDF (por defecto `storage/tickets`). |
| `CORS_ORIGIN` | No | Orígenes web permitidos, separados por coma. |

Scripts disponibles:

```bash
npm run db:migrate
npm run dev
npm start
```

`npm run db:migrate` crea la tabla `tickets` y sus índices. `npm run dev` y
`npm start` aplican primero las migraciones pendientes. Las migraciones
versionadas son la fuente del esquema. Agrega un archivo SQL nuevo en
`db/migrations/` para cada cambio; no edites migraciones aplicadas. El puerto
predeterminado es `3005`.

## Autenticación

Las rutas de cliente y portero requieren `Authorization: Bearer <token>`. Los JWT se verifican con HS256, `JWT_SECRET` y el issuer `JWT_ISSUER` (por defecto `entradasya-auth`). Los tickets del usuario se identifican con el ID numérico del token.

La generación es interna: solo `orders`, mediante el encabezado `x-orders-key`, puede emitir entradas tras aprobarse el pago. Las rutas de consulta y descarga siguen requiriendo el JWT del cliente.

## API

Todas las rutas usan el prefijo `/api/tickets`.

`GET /health` comprueba la conexión a PostgreSQL sin autenticación y responde
`503` si la base de datos no está disponible. También está disponible como
`GET /api/tickets/health` detrás del proxy.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/tickets/generate` | Interno (`orders`) | Genera un ticket por cada artículo indicado y su PDF con QR. |
| `GET` | `/api/tickets/my` | Cliente autenticado | Lista los tickets del usuario actual. |
| `GET` | `/api/tickets/order/:orderId` | Cliente autenticado | Lista los tickets de la compra solo si pertenecen al usuario actual. |
| `GET` | `/api/tickets/:id/download` | Cliente autenticado | Descarga el PDF de uno de sus tickets. |
| `POST` | `/api/tickets/validate` | Rol `portero` | Comprueba si un código existe y está emitido. |
| `POST` | `/api/tickets/:code/check-in` | Rol `portero` | Marca como usado un ticket emitido. |

### Generar tickets

`POST /api/tickets/generate` requiere `x-orders-key` y un cuerpo JSON como este:

```json
{
  "orderId": 123,
  "customerId": 25,
  "event": {
    "id": 14,
    "name": "Festival EntradasYa",
    "date": "2027-06-20T20:00:00-04:00",
    "place": "Estadio Central"
  },
  "tickets": [
    {
      "itemId": "06b1d7b6-1bc7-4a35-bbc0-86cece5d10e3",
      "sectorId": 3,
      "sectorName": "General",
      "seatNumber": "A-12"
    }
  ]
}
```

`orderId`, `customerId`, `event.id` y `sectorId` deben ser enteros positivos. `itemId` debe ser UUID. Se admite un máximo de 100 tickets por compra y no se permiten `itemId` duplicados. Estos tipos deben coincidir con el contrato de `orders`.

La generación es idempotente por combinación de compra y artículo. Si existe una emisión parcial, el servicio responde `409` para evitar completarla silenciosamente.

### Validar y registrar ingreso

Validar código con `POST /api/tickets/validate`:

```json
{ "code": "TKT-7A42E5B180D9012C" }
```

Los códigos generados siguen el formato `TKT-` más 16 caracteres hexadecimales. Un ticket nuevo tiene estado `emitida`; al registrar su ingreso cambia a `usada`. Los estados posibles son `emitida`, `usada` y `cancelada`.

El check-in se registra con `POST /api/tickets/:code/check-in`, por ejemplo `/api/tickets/TKT-7A42E5B180D9012C/check-in`. El acceso requiere el rol `portero`; los check-ins concurrentes se serializan con una transacción y bloqueo de fila.

## Archivos PDF

El servicio guarda los PDF localmente en la ruta indicada por `TICKETS_STORAGE`, cuyo valor predeterminado es `storage/tickets`. Si ejecutas `npm run dev` desde esta carpeta, los archivos quedan bajo `tickets/storage/tickets/`.

El nombre del archivo es el código del ticket, por ejemplo `TKT-7A42E5B180D9012C.pdf`. La ruta se conserva en la base de datos y se usa en el endpoint de descarga. En producción, configura almacenamiento persistente para esta carpeta; los registros de la base de datos no contienen el archivo PDF.

## Modelo de datos

La tabla `tickets` registra el código, IDs de compra, cliente, evento y sector, datos necesarios para el PDF, estado, fecha de uso y ruta del archivo. El ID propio del ticket, compra, cliente, evento y sector es entero; `itemId` es UUID.

En una base existente, la migración inicial no convierte automáticamente
`order_id` de UUID a entero. Cada UUID antiguo necesita una correspondencia con
el ID entero de la orden; prepara esa conversión de datos antes de migrar una
base heredada.
