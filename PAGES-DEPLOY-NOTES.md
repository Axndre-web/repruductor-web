# NEON PLAYER X — GitHub Pages

Esta carpeta contiene una copia estática del frontend de `public/` preparada para GitHub Pages.

## Publicación
1. Copia el contenido de esta carpeta a la raíz de la rama/carpeta que publica GitHub Pages.
2. En el repositorio, abre **Settings → Pages** y selecciona la fuente correcta.
3. Verifica la URL publicada tras completar el despliegue.

## Límites
GitHub Pages sirve archivos estáticos; no ejecuta `server.js`, Node.js ni rutas `/api/*`.
Para funciones que dependen de NEON ORB o del backend, despliega el servidor en un host compatible y configura las variables de entorno allí.

No incluyas `.env`, tokens, claves privadas ni credenciales en el sitio estático.
