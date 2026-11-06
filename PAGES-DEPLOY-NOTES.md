# NEON PLAYER X — GitHub Pages

Esta carpeta es un espejo de publicación estática de `public/`. Ejecuta `npm run sync:pages` desde la raíz del proyecto antes de publicar.

## Publicación
1. Publica el contenido de esta carpeta en la fuente configurada en Settings → Pages.
2. Espera a que la ejecución de Actions/despliegue de Pages termine correctamente.
3. Comprueba la web pública y compara la interfaz con el servidor local.

## Arquitectura y seguridad
- La interfaz visual y los recursos públicos se sincronizan desde `public/`; no se mantiene un diseño paralelo.
- Los módulos internos siguen existiendo en el ecosistema, pero los elementos internos permanecen ocultos al público.
- GitHub Pages no ejecuta `server.js`, Node.js, procesos residentes ni endpoints `/api/*`. NEON ORB completo requiere su backend desplegado por separado.
- No publicar `.env`, tokens, claves privadas, semillas, archivos de datos ni la consola privada.
- Los estados que dependan del backend deben reflejar indisponibilidad real, nunca fingir que el runtime está conectado.
