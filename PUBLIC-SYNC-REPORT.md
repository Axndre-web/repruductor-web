# Informe de sincronización `public/` ↔ `index.html`

- `index.html` de la raíz es la referencia canónica y `public/index.html` queda idéntico.
- Los recursos locales que referencia el HTML se verifican y sincronizan entre ambas ubicaciones.
- Se preservan los módulos exclusivos de `public/UI/` y se copian al árbol de desarrollo sin borrar componentes existentes.
- CSS responsive añadido como capa complementaria: no reemplaza el tema ni las reglas anteriores.
- Service worker versionado y precaché regenerada con rutas existentes para evitar instalaciones fallidas por recursos inexistentes.
- El backend Node.js continúa fuera de GitHub Pages; las rutas API necesitan servidor compatible.

## Publicación
Publica el contenido de `public/` en la fuente configurada de GitHub Pages. Conserva la raíz y los módulos del proyecto completo en el repositorio. No publiques `.env` ni credenciales en repositorios públicos.
