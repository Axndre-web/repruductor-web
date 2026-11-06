# Sincronización con GitHub Pages

- Se conserva la estructura y los módulos de la base del proyecto.
- `github-pages-sync/` contiene la copia estática del frontend derivada de `public/`.
- La aplicación completa y su backend permanecen en el proyecto principal.
- GitHub Pages no ejecuta Node.js ni el backend de NEON ORB.
- No publicar archivos `.env` ni credenciales.
- El ZIP no se publica automáticamente en GitHub; hay que subirlo al repositorio de forma controlada.
