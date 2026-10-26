# NEON ORB — Control Center unificado y holografía de red

## Cambios

- Añade `UI/unified-control-center.js` y `UI/unified-control-center.css` para un panel adaptable a escritorio, tableta y móvil.
- El Control Center reúne accesos rápidos y estados de API local, agente IA, red, radio, conectores blockchain y módulo arcade.
- La holografía SVG es esquemática: los nodos representan subsistemas lógicos del ecosistema; no son coordenadas geográficas ni una afirmación de ubicación física de servidores.
- Los estados se consultan cada cinco segundos desde `/healthz`, `/api/neon-orb/control/status`, `/api/neon-orb/network/status` y `/api/neon-orb/operations/status`. Si no hay respuesta, se muestra estado no confirmado en vez de inventar disponibilidad.
- El panel de operaciones de red/IA/auditoría se monta dentro del Control Center, conservando su módulo original y los identificadores de la UI.
- Se agrega acceso de navegación a Arcade/tragaperras. Los créditos del módulo siguen siendo virtuales de demostración.
- Las secciones existentes (radio, player, tienda, wallet, temas, control y arcade) permanecen en el documento; el Control Center las coordina mediante accesos sin eliminar la base previa.

## Integración

Los nuevos activos están en `public/UI/` para servirlos desde Express y en `UI/` como fuente del proyecto. `public/index.html` carga el nuevo módulo y reubica `#networkOpsDashboard` dentro del contenedor fijo `#unifiedNetworkOpsHost`, fuera del árbol que se vuelve a renderizar con cada sondeo. Esto evita perder los listeners y el estado del panel operativo al actualizar la telemetría.

No se cambia `PORT`, la configuración blockchain ni `.env`. No se agregan puertos de escucha nuevos. El servidor mantiene su comprobación de endpoints al arrancar.

## Validación

- Ejecutar `npm test` para la suite existente.
- Probar `/healthz` y los endpoints de estado en la misma instancia de servidor.
- Comprobar anchos de escritorio y móvil; con `prefers-reduced-motion` la animación de pulsos queda desactivada.
