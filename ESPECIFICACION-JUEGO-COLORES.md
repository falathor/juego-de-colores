# Especificación para OpenSec: juego de preguntas con respuestas de colores

## 1. Encargo para el agente de desarrollo

Construye una aplicación web ligera, completa y jugable, en castellano de España, inspirada en la mecánica de preguntas con respuestas de colores de **Colour Brain**, de Big Potato, distribuido por Mercurio. Nombre provisional de la aplicación: **¿De qué color?**

El objetivo es jugar con amigos o familiares desde el navegador de un móvil, una tableta o un ordenador. Debe servir tanto como mazo de preguntas adicional para quienes ya tienen las cartas físicas como para jugar sin ellas, utilizando botones de colores.

Entrega código funcional, contenido inicial, instrucciones de uso y una guía para publicarlo en GitHub Pages. Prioriza sencillez, carga rápida, legibilidad y facilidad para añadir preguntas. No entregues únicamente una maqueta.

Este documento es una especificación portable para la herramienta que el usuario denomina «OpenSec». No presupone comandos, versiones ni una estructura propia de esa herramienta. Si el entorno utiliza un flujo de especificaciones como OpenSpec, adapta este contenido a sus convenciones existentes sin cambiar el alcance.

### Decisiones cerradas

| Aspecto | Decisión |
| --- | --- |
| Tecnología | HTML semántico, CSS y JavaScript nativo con módulos ES |
| Dependencias de ejecución | Ninguna |
| Compilación | No necesaria |
| Alojamiento previsto | GitHub Pages |
| Datos de preguntas | JSON local versionado en el repositorio |
| Persistencia | `localStorage`, con funcionamiento en memoria si falla |
| Idioma | Castellano de España, `lang="es"` |
| Público | Familiar, orientación aproximada a mayores de 12 años |
| Dispositivos | Móvil, tableta y escritorio; diseño móvil primero |
| Juego inicial | Presencial, en una pantalla compartida o pasando un dispositivo |
| Cuentas y servidor | No necesarios |
| Contenido | Preguntas originales, con revisión editorial |

No introducir React, Next.js, Vue, Tailwind, Bootstrap, una base de datos, contenedores ni un gestor de paquetes para esta primera versión. Si hay una necesidad real que lo impida, justificarla antes de ampliar la arquitectura.

## 2. Alcance y relación con el juego de referencia

La ficha oficial de Mercurio describe una mecánica en la que se responde a preguntas utilizando una o varias de las once cartas de colores. Ese concepto es la referencia de este proyecto [1].

La aplicación tendrá identidad visual propia y preguntas redactadas para ella. No copiar el mazo comercial, sus ilustraciones ni su presentación gráfica. Incluir en «Acerca de» una nota breve: «Proyecto independiente inspirado en juegos de preguntas con colores. Sin afiliación con Mercurio ni Big Potato».

**No presentar las reglas de este documento como el reglamento oficial.** La puntuación digital será una variante sencilla. Quien quiera seguir el reglamento de su caja podrá usar la aplicación como mazo y llevar la puntuación fuera de ella.

Acceder a la misma URL desde varios dispositivos abre sesiones independientes. **La primera versión no sincroniza partidas entre móviles**, ni promete salas con códigos. Esa función exigiría una arquitectura adicional y queda fuera de este encargo.

## 3. Modos de juego obligatorios

### A. Mazo para cartas físicas

Es el modo predeterminado y debe poder iniciarse en pocos pasos.

1. Elegir categorías, dificultad y duración: 10, 20 o 30 preguntas; valor inicial de 20.
2. Mostrar una pregunta y cuántos colores distintos requiere.
3. Los participantes eligen sus cartas físicas sin introducir respuestas en la aplicación.
4. Pulsar «Ver respuesta» para revelar los colores y una explicación breve.
5. Pulsar «Siguiente pregunta».

Ofrecer un marcador opcional para 2–4 equipos. Si se activa, después de revelar se marca qué equipos han acertado y se confirma una única vez la ronda. Cada equipo señalado suma un punto. Si no se activa, la aplicación funciona únicamente como mazo, sin pedir nombres.

### B. Pasa el móvil

Permite jugar sin cartas físicas, con 2–4 equipos en un único dispositivo.

1. Configurar nombres, categorías, dificultad y número de preguntas.
2. Mostrar la pregunta común.
3. Presentar una pantalla neutral: «Turno de Equipo 1 — Empezar respuesta».
4. El equipo ve de nuevo la pregunta, selecciona los colores y pulsa «Confirmar».
5. Ocultar inmediatamente su selección y mostrar la pantalla neutral del siguiente equipo.
6. Cuando todos hayan confirmado, ofrecer «Ver respuestas».
7. Mostrar solución, elecciones de cada equipo, aciertos y marcador.
8. Continuar con la siguiente pregunta.

No dejar selecciones anteriores visibles durante el cambio de equipo. El historial de navegación de la aplicación no debe permitir volver a editar una respuesta confirmada. Esta privacidad es para un juego casual; no constituye un sistema antitrampas.

### C. Individual

El jugador responde tocando colores y descubre la solución tras confirmar. Mostrar aciertos sobre preguntas contestadas y resumen final. Reutilizar los mismos componentes y reglas del modo B.

## 4. Reglas de la variante digital

- Cada pregunta tiene una solución formada por un conjunto de **1 a 4 colores distintos**.
- Mostrar siempre la cantidad requerida: «Elige 2 colores», por ejemplo.
- El orden de selección no importa; un color no puede seleccionarse dos veces.
- Para confirmar, la cantidad seleccionada debe coincidir con la requerida.
- No permitir seleccionar más colores de los necesarios; explicar el límite con un mensaje breve.
- La respuesta solo es correcta si coincide todo el conjunto. No hay puntos parciales.
- Cada respuesta correcta suma **1 punto**. Los errores suman 0; no restan.
- Si todos aciertan, todos suman. Si nadie acierta, nadie suma.
- La aplicación aplica la puntuación una sola vez por ronda, aunque haya doble toque o recarga.
- Gana quien más puntos tenga al finalizar las preguntas configuradas.
- Si hay empate, mostrar victoria compartida. No añadir desempates automáticos.
- No incluir cronómetro, cartas de ataque, robos ni bonificaciones en esta versión.
- Una partida no repite preguntas. Las preguntas anuladas también se consideran vistas.

### Preguntas discutibles

Después de revelar, permitir «Anular pregunta» antes de continuar. Anular elimina cualquier punto de esa ronda y registra la pregunta como anulada. No consume una ronda puntuable: intentar sustituirla por otra no utilizada del conjunto filtrado. Si no quedan preguntas, finalizar indicando cuántas rondas válidas se jugaron. La acción debe ser idempotente y no poder restar puntos dos veces.

## 5. Paleta de juego

Utilizar esta paleta de once colores como convención interna. Los códigos hexadecimales son decisiones de interfaz, no una reproducción certificada de las cartas impresas. Antes de anunciar compatibilidad exacta con una edición física, contrastar las denominaciones con esa edición.

| ID estable | Etiqueta visible | Muestra CSS |
| --- | --- | --- |
| `rojo` | Rojo | `#D62828` |
| `naranja` | Naranja | `#F28C28` |
| `amarillo` | Amarillo | `#F2D13D` |
| `verde` | Verde | `#27804B` |
| `azul` | Azul | `#2563EB` |
| `morado` | Morado | `#7C3AED` |
| `rosa` | Rosa | `#EC7DA7` |
| `marron` | Marrón | `#855536` |
| `negro` | Negro | `#202124` |
| `blanco` | Blanco | `#FFFFFF` |
| `gris` | Gris | `#8A8F98` |

Las etiquetas siempre deben ser visibles. «Azul claro» y «azul oscuro» se normalizan a `azul`; «violeta» y «púrpura», a `morado`. No introducir respuestas como dorado, plateado, turquesa o beige: reformular o excluir la pregunta si necesita esos matices. No convertir silenciosamente dorado en amarillo ni plateado en gris.

## 6. Contenido y categorías

### Categorías iniciales

| ID | Nombre | Orientación |
| --- | --- | --- |
| `espana` | España y tradiciones | Banderas, fiestas y referencias culturales españolas |
| `series` | Series conocidas | Series populares en España, sin destripes |
| `cine` | Cine | Elementos visuales reconocibles de películas |
| `animacion` | Animación y videojuegos | Personajes y objetos de versiones identificables |
| `deportes` | Deportes | Equipaciones tradicionales, señales y elementos del juego |
| `naturaleza` | Naturaleza | Animales y fenómenos con colores inequívocos |
| `comida` | Comida y bebida | Ingredientes y productos con un estado definido |
| `cotidiano` | Cultura general y vida cotidiana | Señales, objetos y símbolos reconocibles |

Incluir tres niveles: fácil, medio y difícil. La dificultad se refiere a cuánto cuesta recordar el dato, no a una redacción confusa. Dejar «Todas» seleccionado inicialmente.

### Reglas editoriales

1. Redactar en castellano natural, con interrogación de apertura y sin traducciones literales extrañas.
2. Preguntar siempre por un color o conjunto de colores de algo concreto.
3. Especificar personaje, parte del objeto, versión, estado o contexto cuando cambien la respuesta.
4. Evitar «¿De qué color es la ropa de X?» si el personaje usa distintos atuendos.
5. Para banderas, indicar si se excluyen escudos u otros detalles. Para camisetas, excluir escudo, patrocinadores y ribetes si procede.
6. Para alimentos y animales, evitar colores dependientes de variedades, madurez, iluminación o ejemplares, salvo que se acote el caso.
7. No incluir pistas que den la respuesta por accidente ni imágenes del objeto preguntado.
8. Evitar referencias demasiado locales sin contexto, destripes, datos de actualidad y equipaciones de una temporada sin identificarla.
9. Añadir una explicación breve y específica. No repetir simplemente «porque es rojo».
10. Guardar la referencia utilizada para revisar cada pregunta y la fecha de revisión. No inventar URLs ni marcar como comprobado algo que no se ha revisado.
11. Las preguntas dudosas permanecen en estado `draft` y no entran en partidas.
12. No generar preguntas mediante una API de IA durante el juego. El catálogo debe estar preparado y revisado antes de publicar.

### Volumen

El apéndice incluye **48 propuestas originales**, seis por categoría. Son una base editorial, no un catálogo documentalmente verificado. Revisarlas y convertir las válidas a JSON. Sustituir cualquier propuesta ambigua para que la versión inicial tenga al menos 48 preguntas aprobadas y representación de las ocho categorías.

Después de tener una aplicación jugable, ampliar progresivamente hasta unas 160 preguntas, con variedad de dificultad y de respuestas de uno, dos y tres colores. No bloquear el primer lanzamiento ni rellenar con preguntas dudosas por alcanzar esa cifra. Cuatro colores es un máximo admitido, no una cuota obligatoria.

## 7. Formato de datos

Archivo `data/questions.es.json`. Los IDs son permanentes y nunca se reciclan. El idioma se declara en el documento. Ejemplo estructural deliberadamente en borrador:

```json
{
  "schemaVersion": 1,
  "contentVersion": "1.0.0",
  "locale": "es-ES",
  "questions": [
    {
      "id": "espana-001",
      "category": "espana",
      "difficulty": "facil",
      "prompt": "Sin contar el escudo, ¿qué dos colores tienen las franjas de la bandera de España?",
      "answerColors": ["rojo", "amarillo"],
      "explanation": "Tiene dos franjas rojas y una amarilla central; se cuentan los colores distintos, no el número de franjas.",
      "tags": ["banderas", "espana"],
      "status": "draft",
      "sources": [],
      "reviewedAt": null
    }
  ]
}
```

Cada fuente revisada tendrá `title` y `url`. `reviewedAt` será una fecha ISO `AAAA-MM-DD`. Solo las preguntas `approved`, con al menos una fuente contrastada y fecha de revisión, pueden entrar en el catálogo jugable.

Derivar el número de colores de `answerColors.length`; no almacenar un segundo contador que pueda quedar desactualizado. Separar el catálogo de colores y categorías de las preguntas.

Validar IDs únicos, categorías y dificultades permitidas, textos no vacíos, 1–4 colores válidos sin duplicados y metadatos de revisión en preguntas aprobadas. Detectar enunciados duplicados tras normalizar espacios y mayúsculas. Una validación estructural correcta no sustituye la revisión factual.

## 8. Selección de preguntas y duración

Filtrar primero por aprobación, categorías y dificultad. Mezclar el resultado una vez con Fisher–Yates y guardar el orden de IDs dentro de la partida. No utilizar `sort(() => Math.random() - 0.5)`.

Si los filtros dejan menos preguntas que la duración elegida, informar antes de empezar: «Hay 12 preguntas disponibles con estos filtros. La partida tendrá 12 rondas». Si no hay ninguna, desactivar «Empezar» y ofrecer quitar filtros.

Mantener un historial local de preguntas vistas para priorizar las nuevas en futuras partidas. Si no hay suficientes nuevas, permitir reutilizar preguntas de partidas anteriores con un aviso, nunca repetir dentro de la partida actual. Ofrecer «Borrar historial de preguntas vistas» en ajustes, separado del borrado de una partida.

Las categorías seleccionadas se combinan con OR; la dificultad se aplica además como filtro. No prometer distribución uniforme si el catálogo no la permite.

## 9. Pantallas e interfaz

### Inicio

Título, frase «Todas las respuestas son colores» y botones «Jugar con cartas», «Pasa el móvil» y «Individual». Mostrar «Continuar partida» si existe una sesión válida. Incluir accesos discretos a instrucciones y ajustes.

### Configuración

Modos y filtros claros, categorías multiselección, dificultad y duración. Pedir equipos solo cuando el modo los necesite. Valores iniciales: todas las categorías, todas las dificultades, 20 preguntas y dos equipos en «Pasa el móvil».

### Pregunta

Mostrar progreso, categoría, enunciado y número de colores. Dar protagonismo al texto y al botón principal. En modo con cartas, no mostrar botones de selección digital. En modo digital, mostrar las once opciones como una cuadrícula de botones grandes.

### Solución y marcador

Presentar los colores correctos con sus nombres, explicación y resultado de cada equipo cuando proceda. Distinguir acierto y error con iconos y texto, no solo verde y rojo. Ofrecer anular antes de avanzar. No revelar datos de otra ronda.

### Final

Mostrar puntuación, ganador o empate, número real de preguntas válidas y botones «Volver a jugar» y «Inicio». En individual, mostrar fracción y porcentaje de aciertos; si no hay rondas válidas, mostrar «Sin rondas puntuables» sin dividir por cero.

### Dirección visual

- Apariencia alegre y limpia, con fondo claro neutro, tarjetas amplias y colores reservados principalmente para las respuestas.
- Tipografía del sistema; no descargar fuentes ni imágenes para decorar.
- En móvil, una columna y cuadrícula de colores de tres columnas; las dos últimas opciones pueden ocupar la última fila.
- En escritorio, limitar el ancho del contenido para facilitar la lectura desde una mesa.
- Evitar carruseles, paneles laterales innecesarios, animaciones continuas y menús profundos.
- No usar nombres de tecnologías, estados JSON ni datos de depuración en el flujo del jugador.

## 10. Accesibilidad y adaptación

- Sin desplazamiento horizontal a partir de 320 px de ancho.
- Controles táctiles de al menos 44 × 44 px y separación suficiente.
- Usar botones reales, foco visible, navegación con teclado y `aria-pressed` en opciones seleccionables.
- Cada tarjeta de color incluye muestra, etiqueta y marca de selección. La etiqueta puede ir sobre una superficie neutra para garantizar legibilidad.
- El blanco debe tener borde visible. No confiar en que una persona distinga todos los colores.
- Anunciar cambios importantes de estado con una región `aria-live` discreta.
- Llevar el foco al título de la pantalla al cambiar de vista, sin saltos inesperados durante la selección.
- Respetar `prefers-reduced-motion`, zoom al 200 % y áreas seguras del móvil.
- Comprobar contraste de texto y controles; no asumir que los valores de la paleta ya cumplen todos los contrastes.
- Probar al menos Safari en iOS, Chrome en Android y un navegador de escritorio. Si no se dispone de esos dispositivos, indicar exactamente qué se ha comprobado.

## 11. Arquitectura mínima

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Documento inicial y punto de montaje semántico |
| `styles.css` | Diseño adaptable y estados visuales |
| `js/app.js` | Inicio, eventos y coordinación de pantallas |
| `js/game.js` | Estado de partida, turnos, validación de respuestas y puntuación |
| `js/ui.js` | Renderizado y gestión de foco |
| `js/storage.js` | Guardado, carga y recuperación ante errores |
| `js/catalog.js` | Colores, categorías y carga/validación del catálogo |
| `data/questions.es.json` | Banco de preguntas |
| `tests/index.html` | Comprobaciones de lógica ejecutables desde el navegador |
| `tests/game.test.js` | Casos de puntuación, conjuntos y transiciones |
| `.nojekyll` | Publicación del contenido estático sin procesamiento Jekyll |
| `README.md` | Uso, ejecución local, edición de preguntas y publicación |

No hace falta un enrutador. Gestionar las vistas dentro de `index.html`, sin rutas que necesiten reescrituras del servidor. Usar rutas relativas para recursos, de modo que funcione bajo `https://USUARIO.github.io/REPOSITORIO/`.

Mantener la lógica de puntuación separada del DOM. No crear una arquitectura de componentes compleja para cinco pantallas. Como presupuesto orientativo, mantener HTML, CSS y JavaScript propios por debajo de 100 KB sin comprimir y el catálogo inicial por debajo de 100 KB. Informar del tamaño real al entregar.

## 12. Estado y persistencia

Guardar versión de esquema y contenido, ID de partida, modo, filtros, equipos, orden de preguntas, índice actual, fase, equipo activo, respuestas confirmadas y resultados por ronda. Calcular el marcador a partir de resultados consolidados para evitar duplicaciones. Guardar una instantánea de las preguntas de la partida o una estrategia equivalente que permita continuar sin cambios si se actualiza el catálogo.

Transiciones explícitas: configuración → pregunta → captura de respuestas, si corresponde → revelación → resultado confirmado → siguiente ronda o final. La anulación es un estado de ronda, no una resta libre al marcador.

Persistir después de cada transición válida. Si se recarga durante un turno, recuperar detrás de una pantalla neutral antes de volver a mostrar la selección. Restaurar una ronda ya puntuada no vuelve a otorgar puntos.

Si `localStorage` falla o está lleno, permitir seguir en memoria y avisar: «No se puede guardar en este navegador. La partida continuará mientras no cierres la página». Si los datos guardados están corruptos, ofrecer iniciar de nuevo. No borrar automáticamente otros datos del navegador.

Los nombres de equipos son texto plano, de 1–24 caracteres. Renderizarlos con `textContent`; aplicar el mismo criterio a los enunciados. No utilizar `eval` ni HTML procedente del catálogo. No incluir claves, secretos, analítica ni conexiones a servicios externos en el cliente.

El banco de respuestas será público al tratarse de una web estática. Ocultarlo visualmente durante una ronda basta para este uso casual.

## 13. Pruebas y criterios de aceptación

La entrega se considera terminada cuando se verifiquen estos casos:

- [ ] Se abre desde móvil y escritorio sin instalar aplicaciones ni iniciar sesión.
- [ ] Funciona tanto en la raíz de un servidor local como bajo una subcarpeta de GitHub Pages.
- [ ] Los tres modos permiten terminar una partida.
- [ ] En modo físico, la respuesta permanece oculta hasta pulsar «Ver respuesta».
- [ ] En «Pasa el móvil», un equipo no ve la selección anterior y no se revela la solución antes de tiempo.
- [ ] Una solución `rojo + amarillo` acepta ambos órdenes y rechaza cualquier conjunto distinto.
- [ ] Confirmar con una cantidad insuficiente queda bloqueado y no es posible exceder el máximo.
- [ ] Varios equipos pueden sumar en la misma ronda y ninguno pierde puntos por fallar.
- [ ] Doble toque, recarga y restauración no duplican puntos ni turnos.
- [ ] Anular revierte solo esa ronda una vez y gestiona correctamente el agotamiento del mazo.
- [ ] No se repiten preguntas dentro de una partida.
- [ ] Los filtros vacíos o con pocas preguntas muestran un estado comprensible.
- [ ] Hay al menos 48 preguntas aprobadas, revisadas y repartidas entre las ocho categorías.
- [ ] Recargar recupera el estado de la partida; si guardar falla, se puede seguir jugando.
- [ ] No hay errores de consola durante una partida completa.
- [ ] Todos los colores tienen etiqueta, la selección es reconocible sin color y el flujo se maneja con teclado.
- [ ] El README explica cómo añadir una pregunta y publicar el proyecto.

Automatizar los casos de lógica que protegen puntuación, igualdad de conjuntos, anulación y restauración. No añadir una plataforma de pruebas pesada: un pequeño ejecutor de pruebas del navegador es suficiente. Complementarlo con comprobación manual de los flujos visuales.

## 14. Desarrollo y publicación

Para desarrollo, usar un servidor estático. Por ejemplo, si Python está instalado:

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000/`. No usar doble clic sobre `index.html` como procedimiento de ejecución: los módulos y la carga del JSON deben probarse por HTTP.

Para GitHub Pages, la propuesta es un repositorio público y publicación desde una rama [2][3]:

1. Crear un repositorio, por ejemplo `juego-de-colores`.
2. Subir los archivos con `index.html` y `.nojekyll` en la raíz.
3. En **Settings → Pages**, elegir **Deploy from a branch**.
4. Seleccionar `main` y `/(root)` y guardar.
5. Esperar a que GitHub complete la publicación y abrir la URL que indique.
6. Comprobar carga de JavaScript, CSS y JSON, y una partida completa desde esa URL.

GitHub Pages sirve HTML, CSS y JavaScript estáticos; esta arquitectura encaja con ese servicio [2]. No hace falta contratar un servidor de aplicación. Las prestaciones y condiciones de GitHub dependen del plan y deben consultarse al publicar.

El agente debe entregar el proyecto listo para subir. Si tiene acceso autorizado a un repositorio de destino, podrá seguir el flujo de trabajo acordado; este documento por sí solo no identifica una cuenta ni un repositorio existente. No afirmar que la web está publicada sin haber completado y verificado el despliegue.

## 15. Mejoras posteriores, fuera del mínimo inicial

Prioridad sugerida tras validar el uso real:

1. Ampliar el banco a unas 160 preguntas revisadas y equilibrar categorías.
2. Añadir favoritos y un editor local con exportación/importación JSON validada.
3. Añadir modo sin conexión mediante manifiesto y service worker, con estrategia de actualización y pruebas específicas. La primera versión no promete funcionar sin red después de cerrar o recargar.
4. Evaluar salas sincronizadas únicamente si se solicita jugar desde un móvil por equipo; esa decisión requiere almacenamiento o comunicación compartida y otro diseño técnico.

## 16. Orden de trabajo solicitado al agente

1. Inspeccionar el proyecto disponible y respetar sus instrucciones aplicables.
2. Crear la estructura estática y una partida completa con unas pocas preguntas revisadas.
3. Implementar los tres modos reutilizando lógica y componentes.
4. Incorporar filtros, persistencia, anulación y estados de error.
5. Revisar e incorporar el banco inicial y su validador.
6. Comprobar lógica, accesibilidad básica, móvil y rutas de despliegue.
7. Entregar los archivos y el README con pasos exactos para GitHub Pages.

Tomar las decisiones rutinarias usando los valores de este documento. Al terminar, resumir lo construido, cómo ejecutarlo, qué se ha probado y cualquier limitación pendiente. No declarar como realizados los criterios no comprobados.

## Apéndice A. 48 propuestas de preguntas originales

**Estado editorial: propuestas pendientes de verificación antes de incorporarlas como `approved`.** Las respuestas se expresan con la paleta interna. No son transcripciones del mazo comercial. La dificultad es orientativa y puede ajustarse tras jugar.

### España y tradiciones

| ID | Pregunta | Respuesta | Nivel |
| --- | --- | --- | --- |
| espana-001 | Sin contar el escudo, ¿qué dos colores tienen las franjas de la bandera de España? | Rojo, amarillo | Fácil |
| espana-002 | Sin contar el escudo, ¿qué dos colores tienen las franjas de la bandera de Andalucía? | Verde, blanco | Fácil |
| espana-003 | ¿De qué color es el fondo de la bandera de la Comunidad de Madrid? | Rojo | Medio |
| espana-004 | En la vestimenta tradicional de San Fermín, ¿de qué color es el pañuelo que se lleva al cuello? | Rojo | Fácil |
| espana-005 | ¿De qué color es la silueta del Toro de Osborne que se ve junto a muchas carreteras españolas? | Negro | Fácil |
| espana-006 | En la señalización habitual del Camino de Santiago, ¿de qué color son las flechas pintadas que orientan a los peregrinos? | Amarillo | Medio |

### Series conocidas

| ID | Pregunta | Respuesta | Nivel |
| --- | --- | --- | --- |
| series-001 | En Los Simpson, ¿de qué color es el pelo de Marge? | Azul | Fácil |
| series-002 | En Los Simpson, ¿de qué color es la piel de Homer? | Amarillo | Fácil |
| series-003 | En La casa de papel, ¿de qué color son los monos del grupo de atracadores? | Rojo | Fácil |
| series-004 | En Breaking Bad, ¿de qué color es la metanfetamina característica que elabora Walter White? | Azul | Medio |
| series-005 | En Friends, ¿de qué color es el marco que rodea la mirilla de la puerta del piso de Mónica? | Amarillo | Difícil |
| series-006 | En Doctor Who, ¿de qué color es el exterior de la TARDIS con forma de cabina de policía? | Azul | Medio |

### Cine

| ID | Pregunta | Respuesta | Nivel |
| --- | --- | --- | --- |
| cine-001 | En Shrek, ¿de qué color es la piel del ogro protagonista? | Verde | Fácil |
| cine-002 | En Star Wars, ¿de qué color es la hoja del sable de luz de Darth Vader? | Rojo | Fácil |
| cine-003 | En Matrix, ¿qué dos colores tienen las pastillas entre las que Morfeo ofrece elegir a Neo? | Rojo, azul | Medio |
| cine-004 | En El mago de Oz de 1939, ¿de qué color son los zapatos mágicos de Dorothy? | Rojo | Medio |
| cine-005 | En Del revés (Inside Out), ¿de qué color es la piel de Tristeza? | Azul | Fácil |
| cine-006 | En Buscando a Nemo, ¿qué dos colores tienen las franjas principales del cuerpo de Nemo, sin contar los finos bordes oscuros? | Naranja, blanco | Medio |

### Animación y videojuegos

| ID | Pregunta | Respuesta | Nivel |
| --- | --- | --- | --- |
| animacion-001 | En Pokémon, ¿de qué color son las mejillas de Pikachu? | Rojo | Fácil |
| animacion-002 | En Super Mario, ¿de qué color es la gorra habitual de Luigi? | Verde | Fácil |
| animacion-003 | En Sonic the Hedgehog, ¿de qué color es el pelaje de Sonic? | Azul | Fácil |
| animacion-004 | En Doraemon, ¿de qué color es el bolsillo situado en su barriga? | Blanco | Medio |
| animacion-005 | En Bob Esponja, ¿de qué color es el cuerpo de Patricio Estrella? | Rosa | Fácil |
| animacion-006 | En Pac-Man, ¿de qué color es el protagonista del juego clásico? | Amarillo | Fácil |

### Deportes

| ID | Pregunta | Respuesta | Nivel |
| --- | --- | --- | --- |
| deportes-001 | ¿De qué color es principalmente la camiseta tradicional de la primera equipación del Real Madrid, sin contar escudo, patrocinio ni ribetes? | Blanco | Fácil |
| deportes-002 | ¿Qué dos colores alternan las franjas tradicionales de la camiseta del Atlético de Madrid, sin contar escudo ni patrocinio? | Rojo, blanco | Fácil |
| deportes-003 | ¿Qué dos colores forman el patrón de cuadros de la bandera que señala el final de una carrera de Fórmula 1? | Negro, blanco | Fácil |
| deportes-004 | En fútbol, ¿de qué color es la tarjeta que el árbitro muestra para indicar una expulsión? | Rojo | Fácil |
| deportes-005 | En el Tour de Francia, ¿de qué color es el maillot del líder de la clasificación general? | Amarillo | Medio |
| deportes-006 | En una mesa de billar americano con numeración estándar, ¿de qué color es la bola 8, sin contar el círculo del número? | Negro | Medio |

### Naturaleza

| ID | Pregunta | Respuesta | Nivel |
| --- | --- | --- | --- |
| naturaleza-001 | ¿Qué dos colores predominan en el pelaje de un panda gigante adulto de coloración habitual? | Negro, blanco | Fácil |
| naturaleza-002 | ¿Qué dos colores forman las rayas de una cebra de coloración habitual? | Negro, blanco | Fácil |
| naturaleza-003 | En una mariquita de siete puntos, ¿de qué color son los puntos de los élitros? | Negro | Medio |
| naturaleza-004 | En un mirlo común macho adulto, ¿de qué color es el plumaje? | Negro | Medio |
| naturaleza-005 | En una margarita común de pétalos blancos, ¿de qué color es el disco central? | Amarillo | Fácil |
| naturaleza-006 | En el arcoíris, ¿qué color aparece entre el verde y el naranja? | Amarillo | Medio |

### Comida y bebida

| ID | Pregunta | Respuesta | Nivel |
| --- | --- | --- | --- |
| comida-001 | ¿De qué color es el polvo de té matcha? | Verde | Medio |
| comida-002 | En un huevo de gallina cocido, ¿de qué color es la clara? | Blanco | Fácil |
| comida-003 | ¿De qué color es la tinta de calamar que se utiliza como ingrediente en cocina? | Negro | Fácil |
| comida-004 | ¿De qué color es normalmente el interior de un pistacho pelado, sin contar la piel exterior? | Verde | Fácil |
| comida-005 | ¿Qué dos colores se alternan en el bastón de caramelo navideño de diseño clásico? | Rojo, blanco | Fácil |
| comida-006 | ¿De qué color son las hebras secas de azafrán que se utilizan en cocina? | Rojo | Medio |

### Cultura general y vida cotidiana

| ID | Pregunta | Respuesta | Nivel |
| --- | --- | --- | --- |
| cotidiano-001 | En España, ¿qué tres colores muestran las luces de un semáforo habitual para vehículos, contando el ámbar como amarillo? | Rojo, amarillo, verde | Fácil |
| cotidiano-002 | En el código habitual de recogida selectiva en España, ¿de qué color es el contenedor destinado a papel y cartón? | Azul | Fácil |
| cotidiano-003 | En España, ¿qué dos colores tienen el fondo y las letras de una señal de STOP estándar? | Rojo, blanco | Fácil |
| cotidiano-004 | En el logotipo de YouTube formado por un botón y un triángulo, ¿de qué color es el triángulo de reproducción? | Blanco | Fácil |
| cotidiano-005 | ¿De qué color es el corazón del traje de corazones en una baraja francesa estándar? | Rojo | Fácil |
| cotidiano-006 | ¿Qué tres colores tienen las franjas de la bandera de Francia? | Azul, blanco, rojo | Fácil |

Antes de publicar, revisar claridad, variantes y dificultad con los criterios editoriales de este documento. Estas propuestas sirven también para calibrar el nivel fácil; la ampliación del catálogo debe añadir retos de memoria visual y más preguntas de varios colores. No confundir amplitud temática con dificultad equilibrada.

## Apéndice B. Fuentes de la especificación

Consultadas el 3 de octubre de 2026. Estas fuentes sustentan la mecánica general y la elección del alojamiento; **no verifican por sí mismas las respuestas del apéndice A**.

1. [Mercurio: ficha oficial de Colour Brain](https://mercurio.com.es/party-games/colour-brain/). Referencia del concepto de responder con una o varias cartas de colores.
2. [GitHub Docs: What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). Servicio de publicación estática y tipos de URL.
3. [GitHub Docs: Quickstart for GitHub Pages](https://docs.github.com/en/pages/quickstart). Configuración de publicación desde una rama.

**Instrucción final al agente:** implementa primero una versión pequeña y plenamente jugable. Mantén el banco de preguntas editable sin tocar la lógica. Si debes elegir entre más funciones y una experiencia rápida y clara en un móvil, prioriza la segunda.
