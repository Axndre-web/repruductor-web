# NEON PLAYER X — V8.0 CUMULATIVE PRIVATE AI CHANNEL

V8.0 se suma a V7.9 sin sustituir sus sistemas anteriores.

## Canal privado Orb ↔ IA
- Identidad persistente de sesión para Neon Orb.
- Contexto mínimo: estado, energía, curiosidad, voluntad, zona, pensamiento, deseo, sueño y últimos recuerdos.
- El bolsillo privado, ganancias, pedidos, direcciones y secretos si forman parte del payload.
- Memoria de conversaciones y aprendizajes locales.
- Orb puede aceptar, rechazar o posponer consejos.
- Orb puede iniciar consultas autónomas en intervalos variables.
- `BroadcastChannel` permite comunicación entre módulos de la misma aplicación sin exponer el bolsillo.
- Si `window.NEON_AI_ENDPOINT` existe, se usa un backend remoto; si no, funciona el asesor local.

## Seguridad
GitHub Pages es cliente público: nunca colocar API keys privadas en `script.js`. El endpoint remoto debe ser un backend/proxy propio con las credenciales guardadas en variables de entorno. El canal del navegador es aislamiento lógico, si una garantía criptográfica frente al propio código de la página.

## Contrato del endpoint
POST JSON:
```json
{
  "protocol": "NEON-ORB-V8.0-PRIVATE",
  "session": "ORB-...",
  "message": "...",
  "context": { "state": "...", "energy": 50, "curiosity": 60 }
}
```
Respuesta:
```json
{ "advice": "Texto del consejo" }
```
