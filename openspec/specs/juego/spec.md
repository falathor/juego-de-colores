# Juego de colores

## Purpose
Juego presencial y en línea en castellano que responde a preguntas con conjuntos de colores.

## Requirements

### Requirement: Tres modos completos
La aplicación SHALL permitir mazo físico predeterminado (marcador opcional de
2–4 equipos), pasa el móvil (2–4 equipos) y en línea (2–8 personas), con 10, 20 o 30 rondas,
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

#### Scenario: Compatibilidad de partidas individuales
- GIVEN una partida individual guardada antes de añadir el modo online
- WHEN se elige continuar
- THEN conserva sus preguntas, puntuación y flujo individual, aunque ya no se
  ofrecen partidas individuales nuevas desde el inicio.

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
revisadas y fecha ISO. SHALL entregar 198 aprobadas, al menos veinticuatro por categoría.

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
  una individual anterior muestra fracción y porcentaje o «Sin rondas puntuables».

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
- THEN se cargan la interfaz y las 198 preguntas aprobadas y se puede completar
  una partida sin errores de recursos.

### Requirement: Catálogo ampliado a 198 preguntas
El catálogo SHALL añadir exactamente cien preguntas aprobadas a la versión
1.1.0, con IDs nuevos, fuentes revisadas y fecha ISO, repartidas entre las ocho
categorías. SHALL conservar sus 99 entradas previas y usar contentVersion 1.2.0.

#### Scenario: Ampliación publicada
- GIVEN el catálogo anterior con 98 aprobadas y un borrador
- WHEN se añade y publica la ampliación
- THEN la web sirve 198 aprobadas y 199 entradas, sin modificar las anteriores.


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

### Requirement: Nombre online personalizable
La aplicación SHALL permitir a cada miembro cambiar su nombre propio en cualquier
fase de la sala, independientemente de si entró por enlace, código o creó la sala.
SHALL aceptar nombres de 1–24 caracteres sin controles, únicos sin distinguir
mayúsculas, y mostrarlos como texto. El cambio SHALL sincronizarse y conservar
identidad, rol, respuestas y puntos; la recarga SHALL recuperar el nombre actualizado.

#### Scenario: Invitado por enlace
- GIVEN un jugador incorporado por enlace con nombre automático
- WHEN guarda un nombre válido desde Cambiar mi nombre
- THEN los demás ven el nombre actualizado y recargar conserva la misma identidad.

#### Scenario: Nombre inválido
- GIVEN una sala con jugadores
- WHEN alguien guarda un nombre vacío, excesivo, con controles o duplicado
- THEN se muestra el aviso compartido y no se modifica ningún jugador.

#### Scenario: Cambio durante una partida
- GIVEN un jugador con respuesta y puntos guardados
- WHEN cambia su nombre
- THEN cambia solo su nombre; conserva su identidad, respuesta, puntos y rol.
