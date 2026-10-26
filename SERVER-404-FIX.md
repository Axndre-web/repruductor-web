# Corrección de rutas 404 — NEON PLAYER X / Neo Orb

- `GET /` y `GET /index.html` sirven explícitamente `public/index.html`.
- Los recursos estáticos se resuelven desde la ruta del proyecto, independientemente del directorio desde el que se ejecute Node.
- Los recursos inexistentes conservan un 404 real; no reciben por error el HTML de la SPA.
- Las rutas `/api/*` no registradas devuelven JSON `404 api_route_not_found` en vez de devolver la interfaz HTML.
- Las rutas API existentes se mantienen sin cambios y se añade una prueba de regresión para el orden de los fallbacks.

Inicio: `npm install` y después `npm start`. Verificación básica: abrir `http://localhost:3000/` y `http://localhost:3000/healthz`.
