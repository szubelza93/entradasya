# EntradasYa — microservicio de check-in

Registra los ingresos de porteros, valida cada entrada con `tickets` y ofrece
estadísticas de asistencia. Requiere Node.js 18 o superior y PostgreSQL.

## Configuración

Desde esta carpeta:

```powershell
npm install
Copy-Item .env.example .env
```

Configura `JWT_SECRET` con el mismo valor de `auth` y `tickets` (mínimo 32
caracteres), las credenciales de PostgreSQL y `TICKETS_URL`. Por defecto, el
ejemplo reutiliza la base de datos de `tickets`; también se puede configurar una
base propia. Ejecuta `npm run db:migrate` para crear la tabla `checkins` y sus
índices únicos. `npm run dev` y `npm start` aplican primero las migraciones
pendientes. El rol PostgreSQL necesita permiso para crear tablas e índices.

El servicio de `tickets` debe estar disponible en `TICKETS_URL`; el valor
predeterminado apunta a `http://127.0.0.1:3005/api/tickets`.

### Variables de entorno

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `PORT` | No | Puerto HTTP (por defecto `3007`). |
| `DATABASE_URL` | Una opción | URL PostgreSQL; si no se usa, configura las variables `DB_*`. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Una opción | Conexión PostgreSQL por campos. `DB_PORT` por defecto es `5432`. |
| `JWT_SECRET` | Sí | Mismo secreto JWT que `auth` y `tickets` (mínimo 32 caracteres). |
| `TICKETS_URL` | No | URL base de tickets (por defecto `http://127.0.0.1:3005/api/tickets`). |
| `CORS_ORIGIN` | No | Orígenes web permitidos, separados por coma. |
| `NODE_ENV` | No | Entorno de ejecución. |

```bash
npm run db:migrate
npm run dev
npm start
```

El comando de migración es seguro de repetir; registra cada migración aplicada.
Para cambios futuros agrega un nuevo archivo SQL en `db/migrations/` en lugar
de modificar una migración ya aplicada. El puerto predeterminado es `3007`.

## API

Las rutas requieren `Authorization: Bearer <token>` de un usuario con rol
`portero`. `tickets` verifica el mismo token. El prefijo público detrás de nginx
es `/api/checkin`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health` | Comprueba PostgreSQL y la disponibilidad de `tickets`; no requiere token. |
| `POST` | `/scan` | Valida y registra un ingreso. Cuerpo: `{ "code": "...", "eventId": 14 }`. |
| `GET` | `/stats` | Devuelve el total de ingresos por evento. |
| `GET` | `/stats/:eventId` | Devuelve el total de ingresos de un evento. |

El chequeo devuelve `200` cuando ambas dependencias están disponibles y `503`
cuando alguna no lo está.

Una entrada solo se registra si `tickets` la reconoce como `emitida` (estado
asignado tras aprobarse el pago), corresponde al evento indicado y aún no fue
usada. La respuesta rechaza entradas inválidas, de otro evento o previamente
utilizadas; en este último caso informa la hora registrada del primer ingreso.
