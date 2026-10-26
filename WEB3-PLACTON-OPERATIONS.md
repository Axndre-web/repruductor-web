# NEON PLAYER X — Puente Web3 y cuenta Placton

## Qué hace esta integración

- Consulta SOL mediante Solana RPC.
- Enumera cuentas de tokens SPL clásicos y Token-2022 del propietario configurado, incluyendo mint, cuenta asociada, decimales y cantidades en unidades base y legibles.
- Puede registrar pruebas de tareas localmente y, si se habilita explícitamente, anclar el hash mediante una transacción Memo en Solana.
- Puede acuñar NXC solo si el mint existe, la cartera configurada es la autoridad de acuñación, el destino está en la allowlist y se respetan los límites por transacción.
- Antes de escribir, valida la clave contra `SOLANA_WALLET_ADDRESS` y comprueba una reserva SOL mínima para comisiones; la creación de una cuenta SPL nueva requiere además saldo para rent.

## Configuración de firma

Usa exactamente una fuente de clave en el entorno del servidor:

1. `SOLANA_SECRET_KEY`: array JSON de bytes de una clave Solana válida, inyectado por un gestor de secretos; o
2. `SOLANA_KEYPAIR_PATH`: ruta a un archivo JSON de array de bytes, fuera de `public/`.

No pegues claves privadas en el frontend, en `index.html`, en `script.js`, en el repositorio ni en mensajes de chat. La clave heredada `keypair.js` contiene un byte no numérico en su representación original; el código no lo corrige por conjetura. Hasta que se proporcione una clave válida por una de las dos vías anteriores, la firma falla de forma cerrada.

`SOLANA_WALLET_ADDRESS` debe ser exactamente la dirección pública derivada de la clave privada. El programa aborta si no coincide. No es posible derivar de forma fiable la dirección original a partir de una clave malformada.

## Variables para escritura real

Los valores predeterminados siguen desactivados. Tras validar la cartera, el mint, la red y la autoridad, el administrador puede configurar en el entorno del servidor:

- `NEON_ALLOW_SIGNING=true`
- `NEON_CHAIN_WRITE_ENABLED=true`
- `NEON_ALLOW_PROOF_ANCHORING=true` para anclar hashes
- `NEON_AUTO_ANCHOR_TASK_PROOFS=true` para intentar anclar cada prueba nueva
- `NEON_ALLOW_MINTING=true` solo si se desea permitir acuñación NXC
- `NXC_MINT_ADDRESS` con el mint exacto del token
- `NEON_MINT_DESTINATION_ALLOWLIST` y `NEON_MINT_MAX_PER_TX` para limitar destinos y cantidades
- `NEON_MIN_SOL_RESERVE` para reservar SOL después de un margen de coste estimado

No se habilitan escrituras automáticamente al instalar el proyecto: sin una clave válida, un mint verificado y un saldo suficiente, eso podría causar pérdidas o transacciones fallidas. Las operaciones reales son irreversibles. Primero valida en devnet y cambia a mainnet de forma consciente.

## Bitcoin y créditos heredados

Una dirección Bitcoin, sus UTXO y transacciones no pueden leerse desde Solana RPC. Deben consultarse mediante un proveedor Bitcoin independiente y verificable; el módulo de Bitcoin existente no convierte créditos internos en BTC ni demuestra titularidad. Los créditos internos no son activos on-chain a menos que exista un contrato o token real que los represente.

## Interpretación del estado

La ruta `/api/neon-orb/blockchain/solana/status` devuelve el saldo SOL y las cuentas SPL visibles para el propietario en el RPC configurado. Una cuenta de token no implica que tenga liquidez o valor de mercado. La lectura de saldos tampoco prueba control de la clave privada. Las pruebas locales SHA-256 solo se reportan como `onChain: true` cuando se recibe una firma de transacción confirmada.
