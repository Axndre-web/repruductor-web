# NEON PLAYER X — V7.5 CUMULATIVE AUTONOMOUS ORB

Extensión acumulativa sobre V7.1.

## Añadido en V7.5
- Portal gravitacional `blackHoleCanvas` fijo y responsivo.
- Física de atracción, wander, fricción y decisiones autónomas.
- Estados `HOME`, `ATTRACTED` y `EXPLORING_NET`.
- Viajes aleatorios de 10–25 segundos.
- `MemoryEngine` con APIs públicas reales y fallback local.
- `VirtualEconomyEngine` para trabajo sintético durante el viaje.
- `NeonOrbPrivatePocket` aislado en una clave propia de `localStorage` y codificado con Base64/UTF-8.
- Integración con interacciones y reproducción de radio.

## Privacidad
El bolsillo no se muestra en la interfaz. La codificación Base64 es ofuscación, no cifrado criptográfico; cualquier JavaScript que se ejecute en esta página puede acceder a `localStorage`.

## Compatibilidad
- GitHub Pages / navegador moderno.
- No requiere backend.
- Las APIs externas pueden fallar por red/CORS; existe fallback local.
