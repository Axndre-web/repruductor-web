# NEON PLAYER X V8.8 — RADIO ENGINE

Actualización acumulativa sobre la base del proyecto existente.

- Auto Recovery entre fuentes de cada emisora.
- Timeout de conexión de 9 s.
- Detección de MP3 / AAC / M3U8-HLS por fuente.
- Reconexión al recuperar Internet.
- OFFLINE LOCAL mediante el Media Dock existente.
- Diagnóstico de fuentes y estado individual: LISTA / CONECTANDO / DIRECTO / SIN STREAM.
- Sin `crossOrigin="anonymous"` en `#radioAudio`.
- Catálogo remoto opcional mediante `window.NEON_RADIO_CATALOG`; las fuentes locales siempre permanecen.
- Se conservan las 12 emisoras y las capas previas de Neon Orb, EXP, memoria, evolución, economía y canal IA.
- V8.7 Living World se conserva e integra en esta versión.

Nota: la reproducción HLS depende de que el navegador soporte M3U8 de forma nativa; la arquitectura identifica el formato y puede probar fuentes alternativas. No se añade una dependencia obligatoria para no romper el modo offline.
