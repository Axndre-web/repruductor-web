# NEON ORB — refinamiento holográfico del Control Center

## Objetivo
Reducir texto repetido y elevar la topología holográfica a elemento visual principal sin eliminar los módulos existentes ni cambiar los endpoints.

## Cambios
- Cabecera compacta con estado de enlace y última sincronización.
- Tres indicadores esenciales (núcleo, red y agente), evitando repetir el mismo estado en varias tarjetas visibles.
- Mapa holográfico ampliado con rejilla, órbitas, enlaces y barrido animado sutil.
- Accesos de navegación compactos para agente, red, wallets, radio, arcade y temas.
- Diagnóstico detallado dentro de un bloque desplegable, cerrado inicialmente; conserva el estado abierto durante las actualizaciones periódicas.
- Etiquetas y estados de los nodos siguen procediendo de los endpoints locales existentes.
- En móvil, el mapa y las acciones se adaptan al ancho disponible; se respeta `prefers-reduced-motion`.

## Integridad
Se mantienen los endpoints de estado y el sondeo de cinco segundos. Los archivos fuente y servidos de JavaScript/CSS deben permanecer idénticos. No se modifica `.env` ni se eliminan módulos del proyecto.

## Verificación
Ejecutar `npm test`. La topología sigue siendo esquemática y no representa coordenadas geográficas reales.
