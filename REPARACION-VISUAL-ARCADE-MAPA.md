# Reparación visual — NEON PLAYER X + NEON ORB

## Qué se ha corregido

- El mapa holográfico se dibuja inmediatamente y después consulta el estado de las API; una API lenta o desconectada ya no bloquea la primera representación.
- La máquina arcade local dispone de una interfaz de respaldo inmediata si el módulo JavaScript moderno no llega a cargar.
- El respaldo del mapa y de la máquina se ejecuta al terminar de analizar el documento, sin esperar varios segundos para llenar zonas vacías.
- Se ha actualizado el identificador de caché de la aplicación para que los navegadores puedan abandonar los recursos de la versión anterior.
- Se han mantenido sincronizadas las copias de la interfaz principal, `public/` y `github-pages-sync/`.
- La interfaz está diseñada para adaptarse a móvil Android, iPhone/iPad, tabletas, portátiles y monitores de escritorio.

## Publicación

1. Haz una copia de seguridad de tu repositorio actual.
2. Publica el contenido de `github-pages-sync/` en la carpeta que utiliza GitHub Pages, o publica la raíz del proyecto si esa es la fuente configurada en el repositorio.
3. En el navegador, recarga la web sin caché. Si sigue mostrando la versión antigua, borra los datos del sitio para ese dominio y vuelve a abrirlo.
4. El mapa holográfico es una topología visual del sistema, no un mapa GPS. Los estados de servicios externos solo se muestran como conectados cuando hay una respuesta comprobable.
5. GitHub Pages solo sirve archivos estáticos; los endpoints `/api/*` y el runtime Node.js requieren desplegar el backend en un servidor compatible.

## Validación de esta entrega

- Pruebas automáticas: 90 correctas, 0 fallidas.
- Integridad del archivo ZIP: verificada tras la creación.
- El archivo `.env` del paquete completo se conserva; no publiques ese archivo ni credenciales en un repositorio público.
