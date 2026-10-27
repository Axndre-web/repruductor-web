# NEON PLAYER X — sincronización segura con GitHub Pages

## Qué incluye este paquete

- Conserva la estructura del proyecto, el servidor Node.js, módulos, UI, integraciones, documentación y pruebas.
- Añade `.github/workflows/deploy-pages.yml`: cada push a `main` publica **solo `public/`** en GitHub Pages.
- No incluye `.env`, `keypair.js` ni `neon-lim.state.json`, porque el archivo de entorno y la clave privada no deben subirse a un repositorio. Se conserva `.env.example` como plantilla sin credenciales.

## Importante: GitHub Pages solo ejecuta contenido estático

GitHub Pages no ejecuta `server.js`, Express, Ollama ni las rutas `/api/*`. Por tanto, el sitio estático puede servir la interfaz, pero NEON ORB, las consultas API, el runtime residente y las integraciones de servidor no funcionarán en la página publicada hasta que exista un backend Node.js alojado por separado y configurado de forma segura. No se debe exponer un backend privado sin HTTPS, autenticación, límites de uso y reglas CORS explícitas.

## Publicación

1. Descarga y descomprime el paquete.
2. En el repositorio `axndre-web/repruductor-web`, sube el contenido de esta carpeta `neon-player-x/` (no la carpeta contenedora adicional) conservando las rutas y carpetas ocultas, incluida `.github/workflows/`.
3. Confirma el cambio en la rama `main`.
4. En GitHub, abre **Settings → Pages** y selecciona **GitHub Actions** como origen de publicación.
5. Abre **Actions** y comprueba que `Deploy NEON PLAYER X to GitHub Pages` termina correctamente.
6. Verifica `https://axndre-web.github.io/repruductor-web/` tras finalizar el workflow.

## Configuración local

Para ejecutar las capacidades Node.js en tu equipo, crea tu `.env` local a partir de `.env.example`, añade los secretos solo en tu equipo y ejecuta `npm install` y `npm start`. No subas el `.env` ni `keypair.js`.

## Limitación de sincronización

Este paquete queda preparado para subir al repositorio, pero no se ha realizado un `git push` desde este entorno: no hay una sesión autenticada de GitHub disponible. No se afirma que la web publicada ya haya cambiado.
