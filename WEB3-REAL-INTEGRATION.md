# NEON PLAYER X / NEON ORB — Integración Web3 real

## Incluido

- Consulta real del RPC Solana (`getVersion`, `getSlot`, `getBalance`) en `GET /api/neon-orb/blockchain/solana/status`.
- Registro local de recibos de tareas con SHA-256, append-only, en `data/onchain-task-proofs.jsonl`.
- Anclaje opcional del hash mediante Memo Program en Solana. Cada transacción consume SOL y requiere que la clave corresponda a `SOLANA_WALLET_ADDRESS`.
- Acuñación SPL opcional para NXC cuando existe una dirección de mint real, el firmante es la autoridad de acuñación, el destino está en allowlist y se respetan límites.
- Endpoints de escritura protegidos por `NEON_ADMIN_TOKEN`, con controles adicionales por variable de entorno.

## Endpoints

- `GET /api/neon-orb/blockchain/solana/status` — consulta de solo lectura.
- `POST /api/neon-orb/blockchain/task-proofs` — registra `{ "taskId": "...", "result": { ... } }` en el ledger local.
- `GET /api/neon-orb/blockchain/task-proofs` — listado administrativo del ledger local.
- `POST /api/neon-orb/blockchain/task-proofs/:hash/anchor` — escribe el hash en cadena si está habilitado.
- `POST /api/neon-orb/blockchain/nxc/mint` — acuña tokens SPL si se cumplen todas las políticas.

Las rutas administrativas requieren `Authorization: Bearer <NEON_ADMIN_TOKEN>`.

## Puesta en marcha

1. Ejecuta `npm install` para instalar `@solana/web3.js` y `@solana/spl-token`.
2. Configura `SOLANA_RPC_ENDPOINT`, `SOLANA_NETWORK` y `SOLANA_WALLET_ADDRESS`. El endpoint RPC debe ser HTTPS salvo que sea localhost.
3. `keypair.js` conserva literalmente el material heredado, pero su primer elemento contiene el texto malformado `1S16`; no se ha adivinado ni sustituido ningún byte. Por eso no puede firmar tal como está. Para activar firmas, recupera la clave correcta de una copia fiable y proporciónala mediante `SOLANA_SECRET_KEY` como un array JSON de 64 bytes, guardado en un gestor de secretos; el sistema valida que la clave pública derivada coincida exactamente con `SOLANA_WALLET_ADDRESS`.
4. Por defecto, `NEON_CHAIN_WRITE_ENABLED`, `NEON_ALLOW_PROOF_ANCHORING` y `NEON_ALLOW_MINTING` están en `false`. La consulta RPC no necesita firma.
5. Para anclaje, revisa saldo de SOL y habilita `NEON_CHAIN_WRITE_ENABLED=true` y `NEON_ALLOW_PROOF_ANCHORING=true` solo en el entorno deseado.
6. Para acuñación, configura `NXC_MINT_ADDRESS`, `NEON_MINT_DESTINATION_ALLOWLIST` (direcciones separadas por coma) y `NEON_MINT_MAX_PER_TX` (unidades completas del token); confirma en la cadena que la clave configurada sea la autoridad del mint. Después de una revisión separada, habilita `NEON_ALLOW_MINTING=true` y `NEON_CHAIN_WRITE_ENABLED=true`.

## Límites deliberados

- El registro de una tarea no equivale a una prueba de trabajo aceptada por un tercero. Solo se ancla el hash de los datos que el servidor recibió.
- Este módulo no crea automáticamente un token, no despliega contratos, no crea un pool DEX, no garantiza liquidez/precio y no convierte BITS/CREDITS en activos canjeables.
- No se realizan pagos, swaps, retiros ni acuñaciones autónomas por defecto. Las operaciones irreversibles requieren una llamada administrativa autenticada y políticas explícitas.
- El estado `configured` no significa que el RPC esté disponible, que el mint sea legítimo o que haya mercado. Usa la respuesta de status y un explorador para verificar cada firma.
- La clave privada nunca se devuelve por API ni se copia a `public/`.
