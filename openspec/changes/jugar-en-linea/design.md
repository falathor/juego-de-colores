## Arquitectura
GitHub Pages sirve la interfaz. Un Worker con un Durable Object SQLite por sala
gestiona el estado autoritativo y guarda un único documento por transición.
La interfaz consulta cambios cada dos segundos y tras cada acción; HTTP permite
reintentos y reconexión sin añadir librerías al navegador.
Una puerta de acceso limita creaciones y entradas por origen de conexión.
Los códigos se asignan aleatoriamente con reserva atómica y nunca sobrescriben salas.

## Aceptación
- La portada ofrece cartas, pasa el móvil y Jugar en línea; no inicia individuales nuevas.
- Crear devuelve un código de cuatro dígitos (incluidos ceros iniciales), único entre salas activas.
- El enlace ?sala=1234 incorpora directamente al visitante, con nombre automático si hace falta.
- Entre 2 y 8 jugadores responden desde sus dispositivos a la misma ronda y pregunta.
- El anfitrión configura categorías, dificultad y 10/20/30 rondas; inicia y avanza.
- Cada jugador confirma exactamente el número requerido; su respuesta queda bloqueada.
- Antes de revelar, las vistas solo incluyen la respuesta propia y quién ha confirmado.
- Revelar requiere todas las respuestas, salvo cierre de ronda explícito del anfitrión;
  las ausencias cuentan cero. Aciertos completos suman uno y nunca se duplican.
- Anular revierte solo esa ronda y busca sustituta sin repetir preguntas.
- La sesión vuelve al mismo jugador tras recargar; errores de red no borran su identidad.
- No se admiten jugadores nuevos tras iniciar, salvo recuperación de una identidad existente.
- Salas caducan a las seis horas. El anfitrión puede cerrar la sala; salir requiere confirmación.
- Fallos de conexión o código, sala llena/cerrada y falta de servicio se anuncian por el aviso compartido.
- Los modos presenciales, tarjetas centradas y partidas individuales guardadas siguen funcionando.
- Publicar solo con backend activado y una partida entre navegadores independientes verificada.

## Implementación
Motor online puro independiente reutiliza catálogo y comparación de conjuntos.
Worker valida autorización de miembro/anfitrión y número de ronda en cada acción.
Sesión por código con token aleatorio en el navegador; nunca viaja en URL de invitación.
Respuestas ajenas, soluciones y futuras preguntas no se envían antes de revelar.
El cliente conserva borrador local durante consultas y evita peticiones simultáneas.
La integración usa los controles, paleta, avisos y tokens visuales existentes.

## Pruebas
Node: roles, concurrencia/idempotencia, privacidad, códigos, filtros, anulación,
caducidad, capacidad, recuperación y rechazos de entradas malformadas.
Wrangler local: API con identidades distintas, reservas, autenticación y CORS.
Chrome: dos contextos independientes, código/enlace, respuesta oculta, recarga,
sincronización, marcador, final y móvil. Regresiones presenciales y OpenSpec.

## Límites y dependencias
Necesita activar Cloudflare con una cuenta del usuario; se usa el plan gratuito,
sujeto a sus cuotas, sin activar planes de pago. El código es una invitación corta,
no una contraseña: quien lo conoce puede entrar mientras la sala esté abierta.
El catálogo público permite consultar soluciones fuera del juego: no se promete
protección contra trampas. Nombres, respuestas y progreso se guardan temporalmente
en el servicio; tokens y borradores se guardan en el navegador. Sin chat ni cuentas de jugadores.
