## ADDED Requirements

### Requirement: Tres modos completos
La aplicación SHALL permitir mazo físico predeterminado (marcador opcional de
2–4 equipos), pasa el móvil (2–4 equipos) e individual, con 10, 20 o 30 rondas,
20 inicialmente, ocho categorías combinadas con OR y dificultad adicional.

#### Scenario: Mazo sin marcador
- GIVEN una partida física sin equipos
- WHEN se muestra una pregunta
- THEN la solución permanece oculta hasta revelar y se permite continuar sin nombres.

#### Scenario: Turnos privados
- GIVEN una partida digital con equipos
- WHEN un equipo confirma la cantidad exacta requerida
- THEN su selección queda bloqueada y oculta tras una pantalla neutral del siguiente;
  solo se revela al terminar todos. Recargar exige volver a la pantalla neutral.

### Requirement: Respuestas y puntuación
La aplicación SHALL aceptar conjuntos de 1–4 colores distintos de la paleta de
once, sin considerar orden, bloquear cantidades incorrectas y otorgar un punto
por acierto completo, sin penalizaciones ni duplicación por doble acción o recarga.

#### Scenario: Igualdad y límite
- GIVEN una solución rojo y amarillo
- WHEN se eligen ambos en cualquier orden
- THEN se acepta; un conjunto distinto se rechaza y un tercer color no puede seleccionarse.

#### Scenario: Consolidación
- GIVEN varios equipos correctos y una ronda revelada
- WHEN se confirma repetidamente o se restaura
- THEN cada equipo correcto recibe exactamente un punto.

### Requirement: Anulación y duración
La aplicación SHALL permitir anular una pregunta revelada antes de avanzar,
excluir su resultado una sola vez y sustituirla por una pregunta no usada.

#### Scenario: Agotamiento
- GIVEN una ronda anulada y ningún reemplazo
- WHEN se continúa
- THEN termina con el número real de rondas válidas; cero no produce división por cero.

### Requirement: Catálogo revisado y selección
La aplicación SHALL validar IDs y enunciados únicos, categorías, dificultades,
textos, colores y metadatos. Solo SHALL usar preguntas approved con fuentes
revisadas y fecha ISO. SHALL entregar al menos 48, seis por categoría.

#### Scenario: Filtros e historial
- GIVEN filtros que producen menos preguntas que la duración
- WHEN se configura
- THEN se anuncia la duración efectiva; cero desactiva empezar.
- WHEN se inicia
- THEN Fisher–Yates prioriza preguntas nuevas, informa de reutilización y no
  repite ninguna dentro de la partida, incluidas las anuladas.

### Requirement: Persistencia segura
La aplicación SHALL guardar cada transición válida e instantáneas suficientes
para continuar tras cambios de catálogo, validando los datos recuperados.

#### Scenario: Error de almacenamiento
- GIVEN almacenamiento inaccesible o lleno
- WHEN se guarda
- THEN se continúa en memoria y se avisa de que cerrar pierde la partida.

#### Scenario: Datos corruptos
- GIVEN una partida inválida guardada
- WHEN se carga
- THEN se ofrece empezar de nuevo sin borrar otros datos del navegador.

### Requirement: Interfaz y entrega
La aplicación SHALL usar castellano, etiquetas visibles en los once colores,
selección con texto e icono, controles de 44 px, teclado, foco visible, avisos
aria-live y diseño sin desbordamiento a 320 px. Los nombres SHALL ser texto
plano de 1–24 caracteres. SHALL funcionar por HTTP raíz y subcarpeta con rutas
relativas. SHALL documentar ejecución, edición y GitHub Pages sin afirmar despliegue.

#### Scenario: Final
- GIVEN una partida terminada
- WHEN se muestra el resumen
- THEN muestra rondas válidas, marcador y ganadores compartidos en empate;
  individual muestra fracción y porcentaje o «Sin rondas puntuables».
