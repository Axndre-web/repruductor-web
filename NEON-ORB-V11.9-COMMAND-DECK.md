# Neon Orb V11.9 — Command Deck y reparación de integración de interfaz

## Objetivo

Esta entrega mejora la interfaz de observación de Neon Orb y repara rutas de recursos del frontend sin reemplazar su runtime, memoria, daemon, ledger, gobernadores ni integraciones económicas existentes.

## Cambios

- Nuevo panel holográfico y responsive en `public/UI/neon-orb-command-deck.js`.
- Métricas conectadas a `/api/neon-orb/status`, `/api/neon-orb/daemon` y `/api/neon-orb/work-sources`.
- Buscador de ofertas públicas mediante `/api/neon-orb/work-opportunities`; cada tarjeta enlaza a la publicación original.
- Ingresos, costes y neto proceden de la contabilidad del servidor. Las oportunidades no se contabilizan como ingresos.
- El minado aparece como `NO VERIFICADO` hasta que exista una fuente real de telemetría autenticada. No se generan cifras ficticias de hashrate, shares ni recompensas.
- Se copian los módulos de dashboard y sus dependencias locales a `public/UI` y `public/core`, que es donde el servidor estático realmente los sirve.
- Se repara el proxy de radio con una lista fija de 12 fuentes HTTPS, redirecciones limitadas y comprobación de hosts permitidos. No acepta URLs arbitrarias.
- El inicio de radio espera el evento real de reproducción con timeout acotado. El ecualizador no intenta procesar audio de radio externo mediante `MediaElementAudioSource`, evitando fallos por restricciones de origen cruzado.

## Verificación

Ejecutado: `node --test tests/*.test.mjs`.

Resultado de esta entrega: **23 pruebas aprobadas, 0 fallidas**. También se verificó la sintaxis de `server.js`, `public/script.js` y el nuevo módulo del command deck.

## Límites explícitos

- La interfaz no demuestra que exista minado activo. Para ello debe conectarse un pool/nodo real y validarse su telemetría.
- Las ofertas públicas son pistas laborales, no contratos, tareas aceptadas ni ingresos.
- No se ha ejecutado una prueba real de streaming de las doce emisoras desde este entorno; el proxy queda cubierto por comprobaciones estáticas, allowlist y timeout, pero la disponibilidad de cada estación depende de sus servidores.
- No se modifican los saldos, claves privadas ni las credenciales existentes en esta fase.
