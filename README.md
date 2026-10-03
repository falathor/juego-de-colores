# ¿De qué color?

Juego de preguntas en castellano. Todas las respuestas son conjuntos
de colores. Funciona con cartas físicas, pasando un único móvil entre equipos,
o en línea desde varios dispositivos. HTML, CSS y JavaScript nativo, sin librerías
de navegador ni cuentas para jugar. La web se sirve en GitHub Pages y las salas
se sincronizan mediante Cloudflare Workers y Durable Objects.

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
- **Jugar en línea**: escribe tu nombre (opcional), crea una sala y configura
  sus filtros. Comparte el código de **cuatro dígitos**, incluidos los ceros
  iniciales, o el enlace: este incorpora directamente al jugador. La sala admite
  **2–8 personas**, cada una con su dispositivo. El anfitrión participa e inicia
  cuando están todos, revela las soluciones y avanza las rondas. Las respuestas
  confirmadas quedan bloqueadas y ocultas a los demás hasta revelar. El anfitrión
  puede confirmar cerrar una ronda incompleta: los ausentes reciben cero puntos.

En línea, pulsa **Volver a la sala** después de recargar. La misma sesión se
recupera sin añadir otro jugador. La sincronización consulta el servicio cada
dos segundos; ante una interrupción reintenta manteniendo tu identidad. Las
salas caducan **seis horas después de crearlas** y no admiten jugadores nuevos
una vez iniciada la partida. Salir como anfitrión cierra la sala para todos;
salir como invitado durante la partida conserva tu sesión para poder volver.
Si el navegador bloquea el guardado, mantén abierta la página.

Las partidas individuales guardadas antes de esta actualización siguen siendo
recuperables; el inicio ofrece el modo en línea para las partidas nuevas.

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

`data/questions.es.json` contiene **198 aprobadas**: veinticuatro en cine y
animación y veinticinco en cada una de las otras seis categorías, más un
borrador del pistacho excluido por la variación de su color. Todas las aprobadas
tienen fuente consultada y fecha de revisión del 3 de octubre de 2026. Algunas
preguntas se han acotado respecto del apéndice para precisar versiones, edad,
partes del objeto o presentación del símbolo. La sustituta `comida-007` trata
del candy corn tradicional; no se ha reutilizado el ID de la pregunta descartada.

La versión 1.1.0 añade 50 preguntas y conserva las 49 entradas anteriores.
La versión 1.2.0 añade otras **100 preguntas**, entre doce y trece por categoría,
sin alterar las 99 entradas de la versión anterior. Las fuentes y fechas de
revisión están registradas en cada pregunta.
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
  "id": "cine-025",
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
node --test tests/online.test.mjs
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

### Servicio de partidas

La URL pública del Worker se configura en `js/online-config.js`. El servicio
actual es `https://colors-online-falathor.colors-online-service.workers.dev`.
No contiene credenciales. Para desarrollar el backend desde `backend/`:

```sh
npm ci
npx wrangler dev --port 8787
```

Para probar contra el servicio local, cambia temporalmente `ONLINE_API` a
`http://127.0.0.1:8787` y abre la web en `http://localhost:8000/`. Restablece
la URL publicada antes de subir el frontend. `backend/wrangler.jsonc` limita
los orígenes permitidos a GitHub Pages y los servidores locales documentados.

Para publicar el backend, desde `backend/`:

```sh
npx wrangler login
npx wrangler deploy
```

Publica y comprueba primero el backend, después la web. Wrangler y su archivo
de bloqueo son dependencias de desarrollo; `node_modules/`, `.wrangler/`,
`.dev.vars*` y archivos de credenciales están excluidos de Git. No añadas claves
a `online-config.js` ni a los enlaces de invitación.

La prueba multijugador usa tres contextos de Chrome independientes y un API
local o publicado. El API local tiene almacenamiento de desarrollo separado;
las pruebas unitarias de persistencia usan exclusivamente un almacén ficticio.
Con el backend y el servidor estático en marcha:

```sh
node tests/online-browser.mjs /ruta/a/playwright/index.mjs http://localhost:8000/ http://127.0.0.1:8787
```

Los nombres, respuestas y progreso se guardan temporalmente en Cloudflare.
Cada sala tiene un plazo fijo de seis horas y una alarma borra sus datos al
caducar. Las claves de sesión se guardan en el navegador; el servidor conserva
solo su hash. No hay chat, cuentas de jugadores ni registro de respuestas en
la observabilidad del Worker. El código corto permite entrar a cualquiera que
lo conozca mientras la sala está en espera; no funciona como una contraseña.

### Web estática

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
| `js/online-*.js` | Motor de salas, cliente HTTP, interfaz y URL pública del servicio |
| `backend/` | Worker, Durable Objects y configuración de despliegue |
| `data/questions.es.json` | Preguntas editables y referencias |
| `tests/` | Ejecutor de lógica y pruebas opcionales de navegador |
| `tools/serve.mjs` | Servidor local opcional con Node |
| `openspec/` | Requisitos, decisiones y tareas de esta entrega |

## Límites

- El modo en línea requiere conexión y admite hasta ocho jugadores por sala.
  Comparte su código o enlace para entrar en la misma partida. No transfiere el
  rol de anfitrión: si se desconecta, puede volver desde su sesión guardada.
- El servicio está sujeto a las cuotas de Cloudflare; el límite de acceso es
  cinco salas creadas por diez minutos y cuarenta entradas por minuto, por IP.
- La privacidad de turnos es casual y las respuestas del catálogo son públicas.
- Necesita red para cargar recursos. No incluye service worker ni promete uso
  sin conexión después de cerrar o recargar.
- No se certifica coincidencia exacta de los tonos con una edición de cartas.
- Sin cronómetro, cartas de ataque, editor, favoritos ni banco de 160 preguntas.
- Safari en iOS y Chrome en Android necesitan comprobación en dispositivos reales.

Proyecto independiente inspirado en juegos de preguntas con colores.
Sin afiliación con Mercurio ni Big Potato. No incluye textos ni ilustraciones
del mazo comercial.
