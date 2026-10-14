## ADDED Requirements

### Requirement: Catálogo de dos mil preguntas
El catálogo SHALL contener exactamente 2.000 preguntas aprobadas repartidas en
diez categorías de 200 cada una, con al menos 50 preguntas de cada dificultad
por categoría. SHALL añadir Videojuegos y Mitos y leyendas, separar videojuegos
de animación y conservar los IDs anteriores. SHALL incluir personajes de LoL y
variedad de juegos, cultura española más allá de banderas y animales. No SHALL
añadir banderas y su proporción total SHALL ser menor o igual al cinco por ciento.

#### Scenario: Cobertura editorial
- GIVEN el catálogo ampliado
- WHEN se cuentan aprobadas por categoría y dificultad
- THEN hay diez grupos de 200 con presencia suficiente de los tres niveles,
  fuentes, explicaciones y respuestas válidas, sin enunciados repetidos.

#### Scenario: Filtros compartidos
- GIVEN una categoría nueva y una dificultad
- WHEN se inicia una partida presencial o una sala online
- THEN se usan solo preguntas aprobadas compatibles y el mismo catálogo publicado.

### Requirement: Guardado online de catálogos grandes
El servicio SHALL almacenar una instantánea de sala de 2.000 preguntas sin superar
el límite de tamaño de un valor KV. Los bloques y su índice SHALL escribirse en
una transacción y los documentos del formato previo SHALL seguir leyéndose.

#### Scenario: Fallo entre bloques
- GIVEN una sala cuyo JSON requiere varios bloques
- WHEN falla una escritura intermedia
- THEN se revierte la operación completa sin perder el estado anterior ni dejar
  bloques o alarmas de la operación fallida.

#### Scenario: Recuperación compatible
- GIVEN una sala guardada en cualquiera de los dos formatos
- WHEN se reinicia su objeto de almacenamiento
- THEN conserva el mazo, los jugadores, los nombres y la puntuación.

## MODIFIED Requirements

### Requirement: Tres modos completos
La aplicación SHALL permitir mazo físico predeterminado (marcador opcional de
2–4 equipos), pasa el móvil (2–4 equipos) y en línea (2–8 personas), con 10, 20 o 30 rondas,
20 inicialmente, diez categorías combinadas con OR y dificultad adicional.

#### Scenario: Mazo sin marcador
- GIVEN una partida física sin equipos
- WHEN se muestra una pregunta
- THEN la solución permanece oculta hasta revelar y se permite continuar sin nombres.

#### Scenario: Turnos privados
- GIVEN una partida digital con equipos
- WHEN un equipo confirma la cantidad exacta requerida
- THEN su selección queda bloqueada y oculta tras una pantalla neutral del siguiente;
  solo se revela al terminar todos. Recargar exige volver a la pantalla neutral.

#### Scenario: Compatibilidad de partidas individuales
- GIVEN una partida individual guardada antes de añadir el modo online
- WHEN se elige continuar
- THEN conserva sus preguntas, puntuación y flujo individual, aunque ya no se
  ofrecen partidas individuales nuevas desde el inicio.

### Requirement: Catálogo revisado y selección
La aplicación SHALL validar IDs y enunciados únicos, categorías, dificultades,
textos, colores y metadatos. Solo SHALL usar preguntas approved con fuentes
revisadas y fecha ISO. SHALL entregar 2.000 aprobadas, exactamente 200 por categoría,
con al menos 50 de cada dificultad en cada categoría.

#### Scenario: Filtros e historial
- GIVEN filtros que producen menos preguntas que la duración
- WHEN se configura
- THEN se anuncia la duración efectiva; cero desactiva empezar.
- WHEN se inicia
- THEN Fisher–Yates prioriza preguntas nuevas, informa de reutilización y no
  repite ninguna dentro de la partida, incluidas las anuladas.

### Requirement: Publicación en GitHub Pages
El proyecto SHALL publicarse en la cuenta indicada por el usuario con la
visibilidad acordada. GitHub Pages SHALL servir la aplicación desde main y
su raíz, con rutas relativas y sin credenciales del entorno en el repositorio.
La documentación SHALL indicar la URL comprobada y el flujo de actualización.

#### Scenario: Juego disponible online
- GIVEN el proyecto subido y GitHub Pages activado
- WHEN se abre la URL HTTPS de la aplicación
- THEN se cargan la interfaz y las 2.000 preguntas aprobadas y se puede completar
  una partida sin errores de recursos.
