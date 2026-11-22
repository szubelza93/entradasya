# EntradasYa — aplicación web

Frontend React servido y desarrollado con Vite. Consume los microservicios de
EntradasYa mediante las rutas `/api/*`.

## Requisitos

- Node.js 18 o superior.
- npm.
- Microservicios iniciados para usar las funciones que dependen de la API.

## Variables de entorno

La aplicación no requiere variables `.env`. En desarrollo, Vite configura los
proxies a `localhost` en [vite.config.js](./vite.config.js); actualiza esos
destinos si los servicios usan otros puertos. No coloques secretos de backend
en variables `VITE_*`, porque se incluyen en el bundle público.

El frontend no gestiona una base de datos y no requiere migraciones.

## Instalación y ejecución

Desde esta carpeta:

```powershell
npm install
npm run dev
```

Vite muestra la URL local al iniciar (por defecto `http://localhost:5173`).

Para generar y probar el build de producción:

```bash
npm run build
npm run preview
```
