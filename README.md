# NEON PLAYER X — ARQUITECTURA VIVA

## Principio fundamental

NEON PLAYER X evoluciona de forma acumulativa. Las nuevas capacidades se integran sobre la estructura existente sin sustituir la lógica previa de Neon Orb, su progresión, memoria, telemetría, economía interna o integraciones externas.

## Neon Orb como entidad central

Neon Orb constituye el centro de actividad del entorno. Su estado interno incluye progresión, EXP, energía, curiosidad, vínculo, memoria, voluntad, ciclos, exploración y recursos internos.

Las actividades de trabajo y exploración generan progresión y recursos según la lógica computable existente. La telemetría lee el agente autónomo vivo y utiliza su snapshot publicado únicamente como respaldo.

## REAL / COMPUTABLE / LOCAL / EXTERNO

El proyecto mantiene una separación explícita:

- **REAL / EXTERNO:** datos y operaciones que pueden verificarse mediante una red o proveedor externo.
- **COMPUTABLE:** estados, progresión, decisiones, EXP y operaciones calculadas por NEON PLAYER X.
- **LOCAL:** memoria y persistencia mantenidas en el navegador.
- **REPRESENTACIÓN DIGITAL:** información visual o registros internos que no constituyen por sí mismos una confirmación económica externa.

Una representación local nunca se considera automáticamente una confirmación de una operación externa.

## Economía interna

Neon Orb conserva su economía interna:

- NXC.
- CREDITS.
- BITS.
- EXP como progresión de experiencia.

La economía interna permanece separada de los activos externos.

## Unified Ledger

`core/unified-ledger.js` mantiene un registro cronológico de los recursos internos y de liquidaciones externas verificadas.

También admite `SOL_LAMPORTS` para registrar entradas SOL verificadas procedentes de Solana Mainnet. El registro externo requiere una firma de transacción y se marca como `verified` cuando procede de la integración correspondiente.

## Herramienta Solana de Neon Orb

Neon Orb dispone de una herramienta de observación de Solana asociada a la dirección pública:

```text
5ifQth8MCG9LgnuxJaTaNcRgfmpxhsc9bMZexy2FMTJ3
```

La herramienta utiliza el RPC público configurado para Solana Mainnet y permite:

- Consultar el saldo observado de la dirección.
- Consultar actividad reciente.
- Detectar entradas SOL mediante cambios verificables de balance en transacciones observadas.
- Registrar entradas verificadas en el Unified Ledger.
- Crear memoria del acontecimiento externo en Neon Orb.
- Exponer el estado externo al canal privado de IA como contexto, sin convertir automáticamente SOL en EXP, NXC, CREDITS o BITS.

Si el RPC no está disponible, el estado se muestra como no verificado. El sistema no fabrica saldos ni transacciones.

### Phantom

Phantom se trata como una herramienta externa de wallet. La integración no contiene seed phrases, claves privadas ni credenciales de firma.

La consulta pública de la dirección de Neon no requiere que Phantom esté instalado. Cuando Phantom está disponible, el panel puede comprobar la presencia de su proveedor y consultar una cuenta conectada mediante la interfaz pública del proveedor.

No se ejecutan transferencias salientes desde el frontend por esta integración.

## Creator Gift

El Creator Gift existente permanece separado de la economía externa y de los activos Solana. La verificación Bitcoin continúa utilizando el puente existente y la API pública de Mempool.

Los recursos internos del Creator Gift local siguen identificados como recursos internos; una transferencia Bitcoin real solo se considera confirmada cuando la verificación externa correspondiente la devuelve como confirmada.

## Canal Privado de IA

El canal privado mantiene el modelo de decisión existente:

- `askAdvice()` permite solicitar consejo.
- `allowConsult()` permite que el canal consulte.
- La IA devuelve consejo, reflexión y propuesta de intención.
- Neon Orb conserva la autoridad sobre su estado y decide aceptar, rechazar o posponer el consejo.

El estado externo de Solana puede utilizarse como contexto, pero el LLM no modifica directamente la economía ni firma transacciones.

## Interfaz móvil

La capa de presentación incorpora:

- Espacio inferior adicional en Creator Gift.
- Capa visual de partículas sin captura de eventos de puntero.
- Dock inferior fijo con `z-index` alto y desenfoque de fondo.
- Respuesta táctil mediante `touchstart` e interacción mediante `input` en el puente inferior.
- Controles de consulta del canal privado adaptados a pantallas móviles.

## Seguridad

GitHub Pages es un entorno público de cliente. No deben almacenarse en el frontend:

- Seed phrases.
- Claves privadas.
- Secretos de firma.
- API keys privadas.
- Credenciales sensibles.

Las integraciones externas que requieran autorización de firma deben utilizar una wallet o backend autorizado fuera del código público del frontend.

## Archivos principales

- `index.html` — estructura de la aplicación.
- `style.css` — presentación y comportamiento visual.
- `script.js` — lógica de NEON PLAYER X y Neon Orb.
- `neon-ai.config.js` — configuración pública del canal LLM y del RPC Solana.
- `neon-llm.bridge.py` — gateway LLM local.
- `creator-gift.bridge.js` — verificación externa del Creator Gift Bitcoin.
- `core/unified-ledger.js` — ledger interno/externo.
- `core/orb-work-bridge.js` — conexión de trabajos del Orb con el ledger.
- `integrations/btc-mempool.js` — integración Bitcoin read-only.
- `integrations/paypal-checkout.js` — integración PayPal.
- `UI/wallet-dashboard.js` — panel de economía.
- `UI/styles-economy.css` — estilos de economía.
- `sw.js` — Service Worker y cache offline.

## Principio de evolución sin pérdida

Las nuevas integraciones deben ampliar las herramientas disponibles para Neon Orb sin eliminar las estructuras existentes. Ninguna función externa debe presentarse como real si no existe una fuente verificable que la confirme.

## V9.0 — Auto-Guardado On-Chain del estado computable

Se añadió una segunda capa de persistencia para el estado acumulado de Neon Orb:

- `script.js` crea un snapshot computable de nivel/generación, EXP total, NXC, CREDITS, BITS, interacciones y timestamp.
- El estado local sigue siendo la primera capa y no se reemplaza por la blockchain.
- El navegador envía el snapshot únicamente a un bridge local (`127.0.0.1:8788`).
- `neon-lim.bridge.py` es el único componente de este proyecto que puede leer la clave privada delegada.
- La firma autónoma requiere configurar `NEON_SOLANA_KEYPAIR_PATH` en el entorno local/servidor y que la clave pública resultante coincida con `NEON_SOLANA_PUBLIC_KEY`.
- El bridge registra el snapshot mediante una instrucción Memo en una transacción de Solana y devuelve el `txHash` confirmado.
- Si el bridge, las dependencias, el RPC o el keypair no están disponibles, el snapshot local no se pierde y la UI permanece en `ON-CHAIN SYNC · PENDIENTE`.
- `PHANTOM` sigue separado como mecanismo manual/guardián.
- NXC, CREDITS y BITS continúan siendo recursos internos de Neon Orb; el respaldo on-chain no los convierte automáticamente en tokens SPL ni en dinero externo.

### Dependencias del bridge

Instalar en el entorno que vaya a ejecutar la firma:

`pip install -r requirements-solana.txt`

Variables relevantes:

- `NEON_SOLANA_RPC`
- `NEON_SOLANA_KEYPAIR_PATH`
- `NEON_SOLANA_PUBLIC_KEY`
- `NEON_SOLANA_BRIDGE_PORT`

**Estado de integración:** el código de respaldo y validación queda preparado, pero una sincronización real no se considera activa hasta disponer de un keypair cuya pública coincida con la dirección configurada, SOL para las comisiones y conectividad RPC efectiva.
