# EntradasYa — microservicio de pagos

Servicio Express que procesa pagos de prueba y registra transacciones en
PostgreSQL. Escucha en el puerto `3004` por defecto.

## Requisitos

- Node.js 18 o superior.
- PostgreSQL y la base de datos configurada en `DATABASE_URL`.
- El servicio crea la tabla `transacciones` con sus migraciones antes de iniciar.
- El servicio `orders` debe usar la misma clave `API_KEY`.

## Variables de entorno

Copia `.env.example` a `.env` y reemplaza los valores de ejemplo:

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `PORT` | No | Puerto HTTP (por defecto `3004`). |
| `DATABASE_URL` | Sí | URL de conexión PostgreSQL. |
| `API_KEY` | Sí | Secreto de al menos 32 caracteres, compartido con `orders`. |

No publiques `.env` ni incluyas `API_KEY` en el frontend.

## Instalación y ejecución

Desde esta carpeta:

```powershell
npm install
Copy-Item .env.example .env
```

Inicia el servicio:

```bash
npm run db:migrate
npm run dev
# producción
npm start
```

`npm run db:migrate` es seguro de repetir; `npm run dev` y `npm start` también
aplican las migraciones pendientes antes de iniciar. Para cambios futuros,
agrega un nuevo archivo SQL en `db/migrations/` y no modifiques uno ya aplicado.

## Chequeo de salud

`GET /health` comprueba la conexión a PostgreSQL. Devuelve `200` si la base de
datos está disponible y `503` si no puede responder.
