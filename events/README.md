# EntradasYa — microservicio de eventos

Servicio Express para crear y administrar eventos, sus sectores y la cartelera pública. Usa PostgreSQL mediante Sequelize y valida localmente los JWT emitidos por `auth` para las operaciones de organizador.

## Requisitos y configuración

- Node.js 18 o superior.
- PostgreSQL y una base de datos existente.
- Credenciales de Cloudinary para subir imágenes de eventos.
- `JWT_SECRET` igual al configurado en `auth`. Los tokens de `auth` deben incluir `sub` y `role`.

Desde la carpeta `events`:

```powershell
npm install
Copy-Item .env.example .env
```

Completa `.env` con los datos de PostgreSQL, el secreto JWT y las credenciales de Cloudinary. El puerto por defecto es `3002`; `CORS_ORIGIN` acepta una lista de orígenes separados por coma.

### Variables de entorno

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `PORT` | No | Puerto HTTP (por defecto `3002`). |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Sí | Conexión PostgreSQL; `DB_PORT` por defecto es `5432`. |
| `DB_LOGGING` | No | Activa el log SQL si vale `true` (por defecto desactivado). |
| `JWT_SECRET` | Sí | Secreto para verificar tokens de `auth`. |
| `JWT_ISSUER` | No | Issuer esperado para tokens (por defecto `entradasya-auth`). |
| `ORDERS_API_KEY` | Sí | Clave compartida con `orders` para reservas. |
| `CORS_ORIGIN` | No | Orígenes web permitidos, separados por coma. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Sí para crear eventos | Credenciales de carga de imágenes. |
| `NODE_ENV` | No | Entorno de ejecución. |

Scripts definidos actualmente:

```bash
npm run db:migrate
npm run dev
npm start
```

`npm run db:migrate` crea las tablas de eventos, sectores y reservas y registra
la migración aplicada. `npm run dev` y `npm start` aplican primero las
migraciones pendientes. Las migraciones versionadas son la fuente del esquema.
Para cambios futuros agrega un nuevo archivo SQL en `db/migrations/` y no
modifiques migraciones ya aplicadas.

## Autenticación y permisos

Las rutas de administración requieren `Authorization: Bearer <token>`. `events` valida la firma HS256 localmente con `JWT_SECRET`, comprueba el issuer y exige el rol `organizador`. No hace llamadas a `auth`. La ruta de lectura pública no requiere token.

## API implementada

Todas las rutas de eventos están bajo `/api/events`.

### Integración con el frontend

El frontend consume las rutas bajo `/api/eventos`. En desarrollo, Vite reescribe ese prefijo a `/api/events` en `http://localhost:3002`; en producción, Nginx aplica la misma traducción al microservicio. Así se conserva el prefijo en español usado por la aplicación web sin cambiar las rutas propias del servicio.

Para desarrollo, inicia el microservicio desde `events` con `npm run dev` y la aplicación web desde `web` con `npm run dev`. El servicio requiere PostgreSQL y las variables configuradas en su `.env`.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/events/health` | Público | Comprueba la conexión a PostgreSQL; responde `503` si no está disponible. |
| `GET` | `/api/events` | Público | Lista eventos publicados cuya fecha aún no pasó. Admite `page`, `limit` (máximo 50) y `search` por nombre. |
| `GET` | `/api/events/check-in-events` | Portero | Lista eventos publicados, incluidos los que ya comenzaron o terminaron, para control de acceso. Admite `page` y `limit` (máximo 100). |
| `GET` | `/api/events/:id` | Público | Detalle de un evento publicado, con sectores activos. |
| `GET` | `/api/events/mine` | Organizador | Lista los eventos del organizador autenticado. |
| `GET` | `/api/events/:id/manage` | Organizador | Obtiene un evento propio y sus sectores para administración. |
| `POST` | `/api/events` | Organizador | Crea un evento en borrador. Requiere imagen multipart en el campo `imagen`. |
| `PATCH` | `/api/events/:id` | Organizador | Actualiza campos de un evento propio en borrador. |
| `POST` | `/api/events/:id/sectors` | Organizador | Agrega un sector a un evento propio en borrador. |
| `PATCH` | `/api/events/:id/sectors/:sectorId` | Organizador | Actualiza un sector de un evento propio en borrador. |
| `POST` | `/api/events/:id/publish` | Organizador | Publica un borrador si su fecha es futura y tiene al menos un sector activo. |
| `POST` | `/api/events/:id/cancel` | Organizador | Cancela un evento propio. |
| `POST` | `/api/events/:id/reserve` | Interno (`orders`) | Reserva cupos disponibles para una orden. Requiere `x-orders-key`. |
| `POST` | `/api/events/:id/release` | Interno (`orders`) | Libera una reserva mediante su ID de orden. Requiere `x-orders-key`. |

La respuesta de cartelera tiene la forma `{ total, page, limit, data }`. Las operaciones de detalle y administración devuelven el recurso bajo `data`.
El chequeo de salud también está disponible directamente como `GET /health`.

### Crear un evento

Envía `multipart/form-data` con:

- `imagen`: imagen JPEG, PNG o WebP de hasta 5 MB.
- `nombre`: texto de 3 a 160 caracteres.
- `fecha`: fecha y hora en formato ISO datetime.
- `lugar`: texto de 2 a 220 caracteres.
- `descripcion`: opcional, hasta 10 000 caracteres.
- `sectores`: opcional; si se envía en multipart debe ser un arreglo JSON serializado.

Ejemplo del campo `sectores`:

```json
[
  { "nombre": "General", "precio": 120, "cupo": 500 }
]
```

Los sectores también se pueden crear individualmente con `POST /api/events/:id/sectors` y un cuerpo JSON como:

```json
{
  "nombre": "General",
  "precio": 120,
  "cupo": 500
}
```

El esquema actual usa `cupo` y `activo`; no define un contador de disponibilidad. La moneda no se especifica en este servicio.

## Estados y reglas

Los nombres usados por los modelos y la lógica son `borrador`, `publicado` y `cancelado`. Solo se pueden editar eventos y sectores mientras el evento está en borrador. La cartelera pública filtra eventos publicados con fecha futura y muestra únicamente sectores activos.

## Reservas de compra

`orders` envía `{ orderId, sectorId, quantity }` a la ruta de reserva. La operación bloquea el sector dentro de una transacción, descuenta las reservas activas de la capacidad total y devuelve el total, nombre del sector y datos del evento. Si no hay cupo suficiente responde `409` con el mensaje `Agotado`. La liberación recibe `{ orderId }` y es idempotente.

Configura `ORDERS_API_KEY` con la misma clave aleatoria de al menos 32 caracteres en `events`, `orders`, `tickets` y `notifications`. La tabla `reservations` se crea con la migración inicial del servicio.

## Alcance y migraciones

- La migración inicial crea eventos, sectores, reservas, sus tipos enumerados e índices.
- `npm run db:migrate` aplica las migraciones pendientes y guarda su versión y checksum en `events_schema_migrations`.
- Los comandos `npm run dev` y `npm start` aplican migraciones antes de iniciar. Para cada cambio futuro agrega un archivo SQL nuevo en `db/migrations/`.
