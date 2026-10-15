# Neon Orb — daemon residente y contabilidad económica basada en evidencia

## Qué se integra

- `core/neon-orb-daemon.js`: ciclo residente supervisado dentro del proceso Node.js. Persiste heartbeat, ciclos, errores, estado de descubrimiento y última conciliación.
- `server/economic-accounting.js`: cálculo reproducible en EUR de ingresos verificados, gasto confirmado y resultado neto realizado.
- `server/settlement-verifier.js`: exige una atestación del proveedor que coincida exactamente en proveedor, referencias, importe, divisa y estado de liquidación.
- `server.js`: inicia el daemon con el servidor, expone estado/conciliación y permite un ciclo manual bajo autorización administrativa.

## Endpoints

- `GET /api/neon-orb/daemon`: estado del daemon y resumen económico.
- `POST /api/neon-orb/daemon/tick`: fuerza un ciclo de conciliación; requiere `NEON_ADMIN_TOKEN` en producción.
- `POST /api/neon-orb/daemon/start` y `POST /api/neon-orb/daemon/stop`: control del ciclo residente.
- `GET /api/economy/accounting`: resumen contable basado en evidencia.

## Configuración opcional

- `NEON_DAEMON_INTERVAL_MS=60000`: intervalo del ciclo (mínimo 15 segundos).
- `NEON_DAEMON_DISCOVERY_ENABLED=true`: activa el descubrimiento periódico; requiere feeds configurados en `NEON_OPPORTUNITY_FEEDS`.
- `NEON_ALLOWED_PROVIDER_HOSTS`: lista separada por comas de hosts HTTPS autorizados para verificación y ejecución.
- `NEON_AUTHORIZED_EXECUTION_PROVIDERS`: mapa de proveedores autorizados (`nombre=https://host/ruta`), además de la allowlist de hosts.

El daemon no ejecuta compras, transferencias, firmas ni gastos automáticamente. Descubre, reconcilia y registra; cada operación económica externa sigue pasando por las políticas y rutas de autorización existentes.

## Definiciones contables

- **Ingresos verificados:** activos en EUR del registro económico con verificación positiva.
- **Gasto confirmado:** gasto asociado a una respuesta de ejecución aceptada por el proveedor.
- **Pendiente:** no se suma a ingresos realizados.
- **Neto realizado:** ingresos verificados menos gasto confirmado registrado. No equivale a saldo bancario ni a beneficio fiscal; depende de la integridad y cobertura de las evidencias y de los costes registrados.
- **Oportunidad:** estimación potencial; nunca se presenta como ingreso cobrado.

Para registrar un ingreso externo, se requieren dos comprobaciones independientes: prueba del trabajo/entregable y atestación del proveedor de que el pago está liquidado. El endpoint de liquidación debe devolver JSON con `verified: true`, `status` igual a `SETTLED`, `COMPLETED`, `PAID` o `CONFIRMED` (o `settled: true`), y los mismos valores exactos de `provider`, `providerRef`, `settlementRef`, `amountEUR` y `currency: "EUR"` que se solicitaron.

## Pruebas

Ejecutar `npm test`. Las pruebas nuevas cubren el daemon, el cálculo contable y la verificación estricta de liquidaciones. Las pruebas estáticas de radio preexistentes pueden fallar si el código de radio no implementa las rutas/protecciones que esperan; no son parte de esta integración económica.


## Descubrimiento de oportunidades laborales externas (V4)

Se añade `server/public-work-sources.js` con conectores de solo lectura para los feeds públicos de Arbeitnow y Remotive, más un catálogo de fuentes de trabajo/recompensas y sus requisitos. Endpoints:

- `GET /api/neon-orb/work-sources`: catálogo, enlaces oficiales y nivel real de integración.
- `GET /api/neon-orb/work-opportunities?q=javascript&remote=true&limit=30`: descubre ofertas públicas con título, empresa, descripción resumida, enlace original, fuente y fecha.

**Límites deliberados:** estas fuentes publican vacantes, no garantizan tareas pagadas ni cobros automáticos. Las ofertas se etiquetan `LEAD_ONLY_REQUIRES_HUMAN_REVIEW`; no se añaden al ledger, no crean ingresos, no solicitan trabajos, no aceptan contratos, no ejecutan código de terceros ni realizan pruebas de seguridad. Remotive exige atribución y enlace a la oferta original; Arbeitnow exige enlazar de vuelta. Toloka y HackerOne requieren cuentas/condiciones propias; las APIs disponibles no constituyen una API universal para que un bot cobre por trabajos. Upwork restringe la automatización no autorizada.

La fase de cobro real necesita cuentas y proveedores elegidos por el titular, autorización expresa, contratos/términos aplicables, datos fiscales/identidad cuando proceda y pruebas de pago del proveedor. El sistema nunca interpreta un listado o salario anunciado como ingreso realizado.
