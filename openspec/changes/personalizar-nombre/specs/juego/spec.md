## ADDED Requirements

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
