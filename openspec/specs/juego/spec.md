# Juego de colores

## Purpose
Juego presencial en castellano que responde a preguntas con conjuntos de colores.

## Requirements

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
revisadas y fecha ISO. SHALL entregar 98 aprobadas, al menos doce por categoría.

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

### Requirement: Catálogo ampliado a 98 preguntas
El catálogo SHALL contener las 48 preguntas aprobadas anteriores y exactamente
50 nuevas aprobadas, repartidas en las ocho categorías, con IDs nuevos, fuentes
consultadas y fecha ISO. SHALL conservar el borrador previo y aumentar contentVersion.

#### Scenario: Actualización de contenido
- GIVEN el catálogo 1.0.0 con 48 aprobadas y un borrador
- WHEN se incorpora la ampliación
- THEN hay 98 aprobadas, 99 entradas totales y las entradas previas no cambian.

### Requirement: Tarjetas de solución centradas
La solución SHALL mostrar una tarjeta grande por color con fondo de la paleta,
nombre en negrita centrado horizontal y verticalmente, texto con contraste
mínimo de 4,5:1 y borde visible para blanco. El grupo SHALL centrarse y envolver
entre una y cuatro tarjetas sin desbordar a 320 px, en todos los modos.

#### Scenario: Revelación de varios colores
- GIVEN una pregunta con entre uno y cuatro colores
- WHEN se revela la solución
- THEN aparecen todas las tarjetas centradas, con el nombre en el centro;
  cada tarjeta mide al menos 140 × 170 px si el espacio disponible lo permite.
- WHEN la solución aún no se ha revelado
- THEN no aparece ninguna tarjeta de solución.

### Requirement: Publicación en GitHub Pages
El proyecto SHALL publicarse en la cuenta indicada por el usuario con la
visibilidad acordada. GitHub Pages SHALL servir la aplicación desde main y
su raíz, con rutas relativas y sin credenciales del entorno en el repositorio.
La documentación SHALL indicar la URL comprobada y el flujo de actualización.

#### Scenario: Juego disponible online
- GIVEN el proyecto subido y GitHub Pages activado
- WHEN se abre la URL HTTPS de la aplicación
- THEN se cargan la interfaz y las 98 preguntas aprobadas y se puede completar
  una partida sin errores de recursos.
