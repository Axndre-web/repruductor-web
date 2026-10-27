# NEON PLAYER X — publicación estática

La carpeta `github-pages-sync/` contiene el frontend listo para GitHub Pages. Copia su contenido a la raíz de la fuente de publicación configurada. Se conservan los archivos originales del proyecto completo.

Incluye estilos responsive y recuperación visual para el mapa holográfico y la máquina arcade de créditos virtuales. La recuperación no sustituye los módulos originales: actúa únicamente si no se han renderizado.

GitHub Pages solo sirve contenido estático. El backend NEON ORB y sus endpoints `/api/*` requieren un host Node.js por separado. No publiques `.env` ni secretos.
