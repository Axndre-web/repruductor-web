# Seguridad de secretos e identidad NEON ORB

**No existe un mecanismo seguro para que el agente custodie una frase semilla y actúe con libertad irrestricta.** Esta distribución no habilita esa conducta.

- API keys y token admin: `.env` local, permisos mínimos, nunca en frontend.
- Seed phrase/private key: no se introduce en el proyecto ni se envía al modelo.
- Identidad: el perfil de trabajo es un borrador local; no equivale a identidad verificada ni autoriza suplantación.
- Wallet: solo lectura para telemetría; transacciones mediante wallet externa y confirmación humana.
- Operaciones sensibles: pausadas por defecto (`NEON_ALLOW_SPENDING=false`, `NEON_ALLOW_SIGNING=false`, `NEON_ALLOW_WITHDRAWALS=false`).
- Exposición de red: mantener `HOST=127.0.0.1` y `NEON_ALLOW_LAN_ACCESS=false`. No abrir el puerto 3000 a internet.
