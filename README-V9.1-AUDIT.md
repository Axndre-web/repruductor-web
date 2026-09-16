# NEON PLAYER X V9.1 — AUDITORÍA Y REPARACIÓN

Esta versión parte de V9.0 y conserva el contenido anterior.

## Fallos detectados y reparados

1. **Canal Orb → IA incompleto**
   - V9.0 consultaba `window.__neonOrbLife.getState()`, pero ese método no estaba expuesto por el motor autónomo.
   - Resultado: el contexto enviado al puente podía quedar vacío.
   - V9.1 expone `getState()` con estado, vida, mente y voluntad actuales.

2. **Eventos IA sin efecto sobre la entidad**
   - Los eventos `aiContact` y `aiAdvice*` llegaban al motor, pero no modificaban memoria/estadísticas.
   - V9.1 registra contactos y decisiones IA en la vida/memoria de Orb.

3. **Puente remoto frágil**
   - Una única petición podía fallar por timeout, caída temporal o respuesta HTTP no válida.
   - V9.1 incorpora timeout de 12 s, hasta 2 reintentos y fallback local.
   - Las respuestas vacías o JSON inválido se consideran fallo y activan fallback.

4. **Comunicación entre módulos/pestañas**
   - V9.1 mantiene BroadcastChannel y añade eventos `neon:orb-message` para módulos de la misma página.
   - Añade deduplicación temporal de mensajes.
   - También acepta mensajes `postMessage` del mismo origen.

5. **Orb podía quedarse sin recursos sin producir trabajo local**
   - La decisión `SEARCH_WORK` no tenía una actividad económica fuera de una expedición.
   - Eso podía crear un ciclo sin progreso.
   - V9.1 permite trabajo autónomo local periódico, con coste energético, riesgo y recompensa.

6. **Valores persistidos iguales a cero**
   - Algunos valores se recuperaban con `||`, convirtiendo `0` en el valor por defecto.
   - V9.1 usa comprobación nullish donde corresponde para conservar estados reales como energía 0.

## Comprobaciones realizadas

- Sintaxis JavaScript: OK con `node --check script.js`.
- Sintaxis del service worker: OK con `node --check sw.js`.
- IDs HTML usados por JavaScript: sin referencias inexistentes salvo `localMedia`, que se crea dinámicamente por diseño.
- IDs HTML duplicados: ninguno detectado.
- Se conservaron radio, reproductor local, ecualizadores, Orb, portal, economía, evolución, tienda oculta, checkout y demás módulos existentes.

## Comunicación IA real

GitHub Pages no debe contener claves secretas. Para conectar una IA remota real, el backend debe exponerse mediante:

```js
window.NEON_AI_ENDPOINT = 'https://TU-BACKEND/endpoint';
```

o mediante el contenido de:

```html
<meta name="neon-ai-endpoint" content="https://TU-BACKEND/endpoint">
```

El backend debe aceptar `POST` JSON y responder JSON con `advice`, `message` o `response`. Debe permitir CORS para el dominio que aloja NEON PLAYER X.

Sin endpoint configurado, el sistema **no finge una conexión externa**: usa el motor mental local y mantiene operativo el canal interno.

## Importante

La disponibilidad real de las emisoras depende de sus servidores, URLs de stream, CORS y compatibilidad del navegador. Esta auditoría es estática y no declara que cada stream externo esté funcionando en tiempo real.
