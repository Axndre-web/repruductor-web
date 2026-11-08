# Ampliación de Radio Station Grid — NEON PLAYER X

Se conservó la estructura existente y se amplió la matriz de 12 a 14 emisoras.

- **HOT 97 · MTV NORTH**: Norteamérica (Nueva York), Hip Hop, R&B y cultura urbana. Stream AAC de HOT 97.
- **MÚSICA URBANA · MTV SOUTH**: Sudamérica (Perú), rap, hip hop y música urbana latina. Stream MP3.

La etiqueta MTV NORTH/SOUTH identifica las dos nuevas zonas musicales dentro de la experiencia NEON; no implica afiliación, licencia ni emisión oficial de MTV.

Integración realizada en las copias de `script.js` (raíz, `public` y `github-pages-sync`), HTML de la matriz, proxy seguro `/api/radio/stream/:id` y bus de control sincronizado (`server/radio-control.js`). Se mantienen las 12 emisoras originales.

La reproducción depende de la disponibilidad y permisos geográficos de cada proveedor. El navegador puede exigir una interacción del usuario para iniciar audio; el reproductor conserva su mecanismo de reintento y fallback.
