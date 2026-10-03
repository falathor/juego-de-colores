# ¿De qué color?

Juego presencial de preguntas en castellano. Todas las respuestas son conjuntos
de colores. Funciona con cartas físicas, pasando un único móvil entre equipos,
o en solitario. HTML, CSS y JavaScript nativo; **sin dependencias de ejecución,
compilación, cuentas ni servidor de aplicación**.

**Jugar online:** [falathor.github.io/juego-de-colores](https://falathor.github.io/juego-de-colores/).
Repositorio público: [falathor/juego-de-colores](https://github.com/falathor/juego-de-colores).

## Ejecutar en local

Desde la carpeta del proyecto, con Node.js 22 o posterior:

```sh
node tools/serve.mjs 8000
```

Abre **http://localhost:8000/**. También puedes usar cualquier servidor estático
o, si tienes Python instalado, `python -m http.server 8000` (activa primero el
entorno virtual local si existe). Para detener el servidor, pulsa Ctrl+C.
No abras `index.html` con doble clic: los módulos y el JSON necesitan HTTP.

Para simular una URL de GitHub Pages bajo subcarpeta:

```sh
node tools/serve.mjs 8001 /juego-de-colores
```

Abre **http://localhost:8001/juego-de-colores/**.

## Jugar

- **Jugar con cartas**: elige categorías, dificultad y 10, 20 o 30 preguntas.
  Usa tus cartas físicas, revela la solución y continúa. El marcador de 2–4
  equipos es opcional; marca los aciertos y confirma cada ronda una vez.
- **Pasa el móvil**: configura 2–4 equipos. Leed juntos cada pregunta y pasad
  el dispositivo. Cada equipo abre su turno, elige y confirma. La pantalla
  neutral oculta las selecciones; la solución aparece cuando todos responden.
- **Individual**: selecciona exactamente los colores indicados y confirma.
  El resumen muestra aciertos sobre rondas válidas y porcentaje.

El orden no importa. Un acierto completo suma un punto; no hay puntos parciales
ni penalizaciones. Puede ganar más de un equipo. La puntuación es una variante
propia, no el reglamento oficial de un juego comercial.

Si la pregunta es discutible, usa **Anular pregunta** después de revelar y
antes de avanzar. Retira únicamente los puntos de esa ronda, una sola vez.
La aplicación intenta sustituirla sin repetir ninguna pregunta. Si se agota el
catálogo filtrado, muestra el número real de rondas válidas jugadas.

El guardado es automático. Tras recargar, pulsa **Continuar partida**. Un turno
digital en curso se recupera detrás de una pantalla neutral. En **Ajustes**,
el borrado de partida y el del historial son acciones separadas y confirmadas.
Si guardar falla, puedes continuar en memoria mientras mantengas la página
abierta; el aviso indica esta limitación. Los datos corruptos pueden descartarse
sin borrar el historial ni los datos de otras aplicaciones.

## Catálogo y revisión editorial

`data/questions.es.json` contiene **98 aprobadas**: trece en España y series,
doce en cada una de las otras seis categorías, más un
borrador del pistacho excluido por la variación de su color. Todas las aprobadas
tienen fuente consultada y fecha de revisión del 3 de octubre de 2026. Algunas
preguntas se han acotado respecto del apéndice para precisar versiones, edad,
partes del objeto o presentación del símbolo. La sustituta `comida-007` trata
del candy corn tradicional; no se ha reutilizado el ID de la pregunta descartada.

La versión 1.1.0 añade 50 preguntas y conserva las 49 entradas anteriores.
Al revelar, cada color aparece en una tarjeta grande centrada, con su nombre
en negrita en el centro y texto claro u oscuro según el contraste. Si hay varios
colores, las tarjetas se centran y pasan a nuevas filas cuando hace falta.

Las referencias se guardan por pregunta y se pueden consultar después de
revelar. Se ha contrastado la respuesta y redactado una explicación original.
Se usan fuentes institucionales, de los titulares de los personajes, editoriales
y enciclopedias; estas últimas pueden cambiar y requieren mantenimiento. La
revisión estructural automatizada **no sustituye la comprobación factual**.
El catálogo inicial tiene predominio de nivel fácil; admite fácil, medio y
difícil, pero no promete una distribución uniforme.

### Añadir una pregunta

1. Edita el JSON manteniendo `schemaVersion: 1` y `locale: "es-ES"`.
2. Añade un ID nuevo, permanente; nunca recicles el de una pregunta retirada.
3. Redacta un enunciado inequívoco y una explicación específica, sin destripes
   ni pistas que revelen el color. Acota versión, parte o estado cuando haga falta.
4. Introduce de uno a cuatro colores distintos de la paleta. No añadas dorado,
   plateado, turquesa o beige ni los conviertas silenciosamente en otros colores.
5. Empieza como `draft`, con `sources: []` y `reviewedAt: null`.
6. Consulta las fuentes, comprueba colores y posibles variantes; registra sus
   títulos y URLs reales. Solo entonces cambia a `approved` y añade fecha ISO.
7. Incrementa `contentVersion` y ejecuta las pruebas. Una partida guardada conserva
   su propia instantánea, por lo que actualizar el catálogo no cambia sus preguntas.

Ejemplo deliberadamente en borrador:

```json
{
  "id": "cine-014",
  "category": "cine",
  "difficulty": "medio",
  "prompt": "En la película de 1939 El mago de Oz, ¿de qué color es el camino de ladrillos?",
  "answerColors": ["amarillo"],
  "explanation": "La pregunta se refiere al camino de ladrillos de esa adaptación.",
  "tags": ["cine", "clasicos"],
  "status": "draft",
  "sources": [],
  "reviewedAt": null
}
```

Categorías: `espana`, `series`, `cine`, `animacion`, `deportes`, `naturaleza`,
`comida`, `cotidiano`. Dificultades: `facil`, `medio`, `dificil`.
Colores: `rojo`, `naranja`, `amarillo`, `verde`, `azul`, `morado`, `rosa`,
`marron`, `negro`, `blanco`, `gris`. Etiquetas y muestras están en `js/catalog.js`.
El número requerido siempre se deriva de `answerColors.length`.

## Pruebas

Con Node.js 22 o posterior, sin instalar paquetes:

```sh
node tests/run.mjs
```

O abre **http://localhost:8000/tests/** con el servidor en marcha. El ejecutor
comprueba conjuntos, límites, los tres modos, puntuación, doble acción,
anulación, agotamiento, filtros, historial, restauración y fallos de guardado,
además de validar el catálogo real. Los datos ficticios de las pruebas no forman
parte del catálogo jugable.

También hay una prueba opcional de navegador, `tests/browser-smoke.mjs`, que usa
una instalación **externa** de Playwright y Chrome. No es una dependencia del
proyecto. Con los servidores de raíz (8000) y subcarpeta (8001) en marcha:

```sh
node tests/browser-smoke.mjs /ruta/absoluta/a/playwright/index.mjs
```

Genera capturas e informe en `artifacts/`, excluido de Git. Los resultados de
la entrega y los límites de validación se registran en `VALIDACION.md`.

Para comprobar un despliegue remoto, añade su URL completa con barra final:

```sh
node tests/browser-smoke.mjs /ruta/absoluta/a/playwright/index.mjs https://USUARIO.github.io/juego-de-colores/
```

## Publicar en GitHub Pages

1. Crea un repositorio, por ejemplo `juego-de-colores`. Para el flujo habitual,
   usa un repositorio público o comprueba la disponibilidad de Pages en tu plan.
2. Sube `index.html`, `styles.css`, `favicon.svg`, `.nojekyll`, y las carpetas
   `js/` y `data/` a la raíz de la rama `main`. Puedes incluir también las pruebas,
   documentación y OpenSpec. No subas `artifacts/`, credenciales ni paquetes.
3. En **Settings → Pages**, selecciona **Deploy from a branch**.
4. Elige **main** y **/(root)** y guarda.
5. Espera al despliegue y abre la URL mostrada por GitHub, normalmente
   `https://USUARIO.github.io/juego-de-colores/`.
6. Comprueba los tres modos, la recarga y la carga de CSS, JavaScript y JSON desde
   esa URL. No hace falta cambiar rutas: todos los recursos usan rutas relativas.

Guías oficiales: [qué es GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
y [configurar la publicación](https://docs.github.com/en/pages/quickstart).
La publicación está activa en la cuenta **falathor**, desde la raíz de **main**.
Cada subida a esa rama actualiza automáticamente la web. Para publicar cambios
desde esta carpeta, después de revisarlos y ejecutar las pruebas:

```sh
git add -- ARCHIVOS_MODIFICADOS
git commit -m "Descripción del cambio" -m "Detalle y validación del cambio"
git push origin main
```

Sustituye `ARCHIVOS_MODIFICADOS` por los archivos que quieras incluir. Comprueba
el despliegue en la pestaña **Actions** del repositorio y recarga la web cuando
termine. Las partidas guardadas mantienen sus preguntas; para usar un catálogo
actualizado, empieza una nueva partida.

## Organización

| Archivo | Función |
| --- | --- |
| `index.html`, `styles.css`, `favicon.svg` | Documento, interfaz adaptable e icono |
| `js/app.js` | Coordinación de vistas, avisos y guardado |
| `js/game.js` | Transiciones, selección, puntuación y restauración |
| `js/ui.js` | DOM seguro, foco, controles y diálogos |
| `js/storage.js` | Persistencia local y alternativa en memoria |
| `js/catalog.js` | Paleta, categorías, carga y validación |
| `data/questions.es.json` | Preguntas editables y referencias |
| `tests/` | Ejecutor de lógica y pruebas opcionales de navegador |
| `tools/serve.mjs` | Servidor local opcional con Node |
| `openspec/` | Requisitos, decisiones y tareas de esta entrega |

## Límites

- Una pantalla compartida; abrir la URL en otros dispositivos crea sesiones
  independientes. No hay salas ni sincronización.
- La privacidad de turnos es casual y las respuestas del catálogo son públicas.
- Necesita red para cargar recursos. No incluye service worker ni promete uso
  sin conexión después de cerrar o recargar.
- No se certifica coincidencia exacta de los tonos con una edición de cartas.
- Sin cronómetro, cartas de ataque, editor, favoritos ni banco de 160 preguntas.
- Safari en iOS y Chrome en Android necesitan comprobación en dispositivos reales.

Proyecto independiente inspirado en juegos de preguntas con colores.
Sin afiliación con Mercurio ni Big Potato. No incluye textos ni ilustraciones
del mazo comercial.
