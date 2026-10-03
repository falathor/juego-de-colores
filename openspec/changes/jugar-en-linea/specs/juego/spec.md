## MODIFIED Requirements

### Requirement: Tres modos completos
La aplicación SHALL permitir mazo físico predeterminado (marcador opcional de
2–4 equipos), pasa el móvil (2–4 equipos) y en línea (2–8 personas), con 10, 20
o 30 rondas, 20 inicialmente, ocho categorías combinadas con OR y dificultad adicional.

#### Scenario: Compatibilidad de modos
- GIVEN el inicio actualizado y una partida individual anterior guardada
- WHEN se muestra el inicio
- THEN se ofrecen cartas, pasa el móvil y en línea; se permite recuperar la
  individual anterior sin ofrecer nuevas partidas individuales.

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

## ADDED Requirements

### Requirement: Partidas compartidas online
La aplicación SHALL ofrecer Jugar en línea en lugar de iniciar partidas
individuales nuevas, manteniendo modos presenciales y recuperación de individuales
guardadas. SHALL permitir salas de 2–8 jugadores por código de cuatro dígitos o
enlace ?sala=1234, con anfitrión que configura, inicia, revela y avanza.

#### Scenario: Invitación y recuperación
- GIVEN una sala abierta
- WHEN otro dispositivo introduce su código o abre su enlace
- THEN se incorpora y comparte la misma partida; recargar conserva su identidad.

### Requirement: Estado y respuestas online autorizados
El servicio SHALL validar roles, colores y ronda, guardar transiciones atómicas,
ocultar respuestas ajenas y soluciones antes de revelar, impedir confirmaciones
modificadas y dobles puntuaciones, y permitir anulación sin repetición.

#### Scenario: Confirmaciones simultáneas
- GIVEN dos jugadores en la misma ronda
- WHEN confirman sus respuestas y el anfitrión revela
- THEN ambas se conservan, cada acierto suma exactamente uno y todos ven el resultado.

#### Scenario: Cierre de ronda con ausencias
- GIVEN jugadores que todavía no han confirmado
- WHEN el anfitrión confirma cerrar la ronda
- THEN se revela y las respuestas ausentes no suman puntos.

### Requirement: Ciclo de vida online
Las salas SHALL caducar a las seis horas, limitar capacidad y peticiones de acceso,
rechazar incorporaciones tras iniciar y recuperar miembros existentes. Los errores
SHALL usar los avisos compartidos. La publicación SHALL comprobar varios dispositivos.

#### Scenario: Error o desconexión
- GIVEN una sesión online y una interrupción de red
- WHEN se recupera la conexión
- THEN se consulta el estado actual sin crear otro jugador ni duplicar puntos.
