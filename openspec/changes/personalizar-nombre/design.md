## Aceptación
- Todos los jugadores ven su nombre y «Cambiar mi nombre», incluso al entrar por enlace.
- Un cambio válido aparece en todos los dispositivos y se conserva al recargar.
- Solo se modifica el nombre de quien autoriza la petición; no cambian ID, rol,
  respuestas, selección pendiente ni puntos, incluso durante o después de la partida.
- Se rechazan nombres vacíos, con controles, mayores de 24 caracteres y duplicados
  sin distinguir mayúsculas; los errores usan el aviso compartido.
- Los nombres se muestran como texto, sin interpretar HTML.

## Plan
Añadir acción rename autenticada al motor y reutilizar el diálogo y controles
existentes. Publicar primero el Worker y después el frontend en GitHub Pages.

## Pruebas
Motor: validación, autorización, duplicados, inmutabilidad y conservación del estado.
Navegador: invitado por enlace, anfitrión y entrada por código cambian nombres;
sincronización, recarga, cambio durante una ronda y conservación del marcador.

## Supuestos
El nombre se cambia en la sesión de sala existente; no se añaden cuentas ni perfiles.
