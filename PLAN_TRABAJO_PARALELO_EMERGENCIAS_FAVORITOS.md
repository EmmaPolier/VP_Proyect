# Plan de trabajo paralelo: Emergencias y conductores favoritos

## Propósito y forma de trabajo

Implementar las dos funcionalidades siguiendo el orden de fases del roadmap: primero contratos y modelo, luego contactos, emergencias, favoritos y finalmente detalle/viajes. Los tres desarrolladores pueden avanzar en paralelo dentro de cada fase, pero las integraciones respetan las dependencias indicadas. No se inicia una fase dependiente hasta cumplir su criterio de salida.

Los roles son funcionales y pueden reemplazarse por nombres reales:

| Rol | Responsabilidad principal | Propiedad para evitar conflictos |
|---|---|---|
| **Desarrollador 1: Backend e integración** | MVC backend, autorización, contratos API, servicio de email/worker e integración final. | Escribe controladores/rutas de emergencias y contactos; revisa seguridad de endpoints. |
| **Desarrollador 2: Frontend** | Experiencia de usuario, integración de API, estados de carga/error y pruebas de flujo UI. | Escribe componentes y páginas frontend, incluyendo constantes y tipos de API. |
| **Desarrollador 3: Datos y consultas** | Scripts Oracle, restricciones, índices, consultas de favoritos/viajes y pruebas SQL. | Es dueño de cambios en `scripts/` y de consultas de lectura de conductores/viajes. |

Cada área tiene un solo responsable de escritura. Los demás contribuyen mediante revisión, pruebas y contratos, no editando simultáneamente los mismos archivos.

## Reglas de eficiencia e integración

- Mantener el estilo del repositorio: controladores por módulo, rutas Express separadas, SQL con binds, respuestas mediante los helpers existentes, cliente API centralizado en frontend y scripts Oracle incrementales.
- No modificar el DDL inicial destructivo para agregar funcionalidades. Crear migraciones nuevas, ordenadas y no destructivas: una para contactos/emergencias y otra para favoritos, o scripts separados si el despliegue requiere independencia.
- Antes de trabajar en paralelo, acordar por escrito nombres de campos, formato JSON, códigos HTTP, estados de dominio y responsabilidades de autorización. Evitar que frontend deduzca permisos o estados que corresponden al servidor.
- Mantener PRs pequeños por funcionalidad y capa. Cada PR debe incluir descripción, prueba ejecutada y pasos de migración. El responsable de cada área revisa cambios ajenos; el autor no aprueba su propio PR.
- No ejecutar migraciones contra la misma base compartida a la vez. El Desarrollador 3 coordina una única aplicación de cada script en el entorno de integración y confirma el resultado al equipo.
- Integrar primero contratos y migración; después API; luego UI. En local, cada desarrollador puede usar mocks conforme al contrato acordado mientras espera dependencias.
- Las alertas se registran antes de intentar enviar correo. El envío debe ser asíncrono, reintentable y trazable por destinatario; un fallo del proveedor no debe borrar la emergencia.
- No registrar en logs tokens, credenciales, correos de contactos, mensajes sensibles ni coordenadas precisas. Usar datos de prueba ficticios.
- Reunión breve diaria: estado, siguiente entrega y bloqueo. Los bloqueos de contrato o migración se resuelven antes de continuar implementaciones dependientes.

## Fase 1: Contratos y preparación compartida

**Objetivo:** Dejar una interfaz estable de datos/API para que backend, frontend y base de datos se implementen en paralelo sin retrabajo.

- **Desarrollador 1:** ~~Define contratos HTTP, autorización y modelo de estados. Especifica que la identidad del usuario se obtiene del JWT y que el servidor valida la participación en la ruta. Documenta respuestas y errores esperados (contrato documentado en `CONTRATO_API_FASE_1_EMERGENCIAS_FAVORITOS.md`).~~
- **Desarrollador 2:** Define los estados de pantalla, formularios y datos mínimos requeridos para cada vista. Prepara tipos TypeScript a partir de los contratos aprobados; todavía puede trabajar con fixtures locales.
- **Desarrollador 3:** ~~Revisa claves y relaciones Oracle actuales (`USUARIO`, `USUARIO_PERFIL`, `RUTA`, `SOLICITUD_CUPO`, `HISTORIAL_VIAJE`, `ESTADO_RUTA`) y prepara las migraciones incrementales, restricciones e índices de contactos y favoritos.~~
- **Entregables compartidos:** Contrato API aprobado, diccionario de columnas, propietario de cada script y lista de casos de autorización/privacidad.
- **Criterio de salida:** El equipo confirma que los identificadores de conductor serán `ID_UPE`, que la identidad del usuario será su documento autenticado y que las rutas solo generan alertas cuando están `EN_CURSO`.

## Fase 2: Contactos de emergencia

**Objetivo:** Permitir que una persona autenticada gestione sus contactos antes de habilitar el botón de emergencia.

- **Desarrollador 1, backend:** Implementa `contacto-emergencia.controller.js` y `contacto-emergencia.routes.js`: listar, crear, editar, activar/desactivar y eliminar. Restringe cada operación al propietario obtenido del JWT.
- **Desarrollador 2, frontend:** Implementa la sección de contactos en configuración/perfil: alta, edición, baja, activación, validación visible y estados de carga, vacío y error.
- **Desarrollador 3, base de datos:** ~~Prepara los scripts para crear `CONTACTO_EMERGENCIA` con `ID_CEM`, `DOCUMENTO_USU_CEM`, `NOMBRE_CEM`, `RELACION_CEM`, `CORREO_CEM` y `FECHA_CREACION_CEM`, además de su secuencia, FK a `USUARIO`, unicidad de correo por usuario e índice de consulta.~~
- **Endpoints:** `GET/POST /api/usuario/contactos-emergencia`, `PATCH /api/usuario/contactos-emergencia/:id`, `DELETE /api/usuario/contactos-emergencia/:id`.
- **Validaciones y pruebas:** Email normalizado y validado, longitudes limitadas, duplicados y máximo de contactos activos controlados. Verificar aislamiento entre usuarios y probar CRUD, autorización y errores de validación.
- **Criterio de salida:** El usuario autenticado puede mantener contactos y nunca leer o cambiar contactos de otra cuenta. Migración y pruebas de API/UI pasan en integración.

## Fase 3: Botón y registro de emergencia

**Objetivo:** Registrar una alerta durante una ruta en curso y notificar a cada contacto con trazabilidad.

- **Desarrollador 1, backend:** Implementa `emergencia.controller.js`, `emergencia.routes.js` y `emergencia.service.js`. Verifica que el usuario sea el conductor o un pasajero con solicitud aceptada/cupo reservado, valida `EN_CURSO`, aplica rate limit e idempotencia, registra la emergencia y encola notificaciones. Amplía `email.service.js` con una plantilla segura; implementa worker/reintentos y estados por destinatario. Usar el mecanismo de trabajo asíncrono disponible en el proyecto; si no existe cola, acordar una tabla outbox y un proceso de polling Oracle con bloqueo de filas, sin enviar todos los correos dentro de la petición HTTP.
- **Desarrollador 2, frontend:** Agrega botón de emergencia en ruta activa/dashboard de viaje, confirmación explícita, solicitud de geolocalización, envío de mensaje opcional y confirmación del registro. Si no hay permiso GPS, no bloquea la alerta y explica que se enviará sin posición actual.
- **Desarrollador 3, base de datos:** Añade `EMERGENCIA_RUTA`: `ID_EME`, `ID_RUT_EME`, `DOCUMENTO_USU_EME`, `ROL_USUARIO_EME`, `LATITUD_EME`, `LONGITUD_EME`, `UBICACION_TEXTO_EME`, `MENSAJE_EME`, `ESTADO_ENVIO_EME`, `CLAVE_IDEMPOTENCIA_EME`, `FECHA_CREACION_EME`; y `NOTIFICACION_EMERGENCIA`: `ID_NEM`, `ID_EME_NEM`, `ID_CEM_NEM`, `CORREO_DESTINO_NEM`, `ESTADO_NEM`, `INTENTOS_NEM`, `ULTIMO_ERROR_NEM`, `FECHA_CREACION_NEM`, `FECHA_ENVIO_NEM`. Añade secuencias, FKs, unicidad de idempotencia y de emergencia/destinatario, e índices para pendientes y consultas históricas. El correo destinatario conserva una copia histórica para auditoría.
- **Endpoints:** `POST /api/routes/:id/emergencias`, `GET /api/usuario/emergencias?limite=&cursor=`, `GET /api/routes/:id/emergencias/mine`.
- **Validaciones y pruebas:** Coordenadas opcionales pero conjuntas y dentro de rango; texto limitado y escapado al generar HTML; se exige al menos un contacto activo. Probar no participante, ruta fuera de curso, duplicado idempotente, fallo de email, reintentos, permisos GPS denegados y entrega separada por contacto.
- **Criterio de salida:** La emergencia queda consultable aunque el correo falle; ningún usuario ajeno puede activar o leer una alerta; cada destinatario tiene estado verificable y los reintentos no duplican el evento.

## Fase 4: Gestión de conductores favoritos

**Objetivo:** Guardar, eliminar y consultar conductores favoritos de forma privada e idempotente.

- **Desarrollador 1, backend/revisión:** Revisa autorización, formato de respuesta y consistencia de errores; confirma que el documento autenticado determina el propietario y que las operaciones no aceptan un propietario arbitrario del cliente.
- **Desarrollador 2, frontend:** Agrega acción de marcar/quitar favorito en vistas de conductores y una sección de lista con estados vacío, carga y error. Evita solicitudes repetidas mientras una acción está pendiente.
- **Desarrollador 3, datos y backend:** ~~Prepara los scripts para crear `FAVORITO_CONDUCTOR` con `ID_FCO`, `DOCUMENTO_USU_FCO`, `ID_UPE_CONDUCTOR_FCO`, `FECHA_CREACION_FCO`, secuencia, FKs, unicidad usuario-conductor e índice por conductor.~~ Implementa `favorito-conductor.controller.js` y rutas CRUD/listado.
- **Endpoints:** `GET /api/usuario/conductores-favoritos`, `POST /api/usuario/conductores-favoritos/:idUpe`, `DELETE /api/usuario/conductores-favoritos/:idUpe`.
- **Validaciones y pruebas:** El objetivo debe ser un perfil `CONDUCTOR`, no el usuario actual; rechazar identificadores inexistentes y perfiles de otro tipo. Probar idempotencia, aislamiento y lista tras recarga.
- **Criterio de salida:** La relación usuario-conductor es única en Oracle; agregar o quitar un favorito no afecta a otros usuarios y la lista muestra solo información pública autorizada.

## Fase 5: Detalle, viajes y solicitud desde favoritos

**Objetivo:** Mostrar información útil del conductor y permitir solicitar un viaje directamente desde sus rutas disponibles.

- **Desarrollador 1, backend:** Implementa o coordina `GET /api/conductores/:idUpe` y `GET /api/conductores/:idUpe/viajes?estado=&limite=&cursor=`. Devuelve estado del usuario, nombre/foto pública, calificación y rutas permitidas. Verifica filtros de privacidad y contrato de paginación.
- **Desarrollador 2, frontend:** Construye detalle del conductor desde favoritos, secciones de viajes activos/en curso e historial, filtros/paginación y navegación a solicitud. Reutiliza el flujo y formulario existentes, mostrando confirmación antes de enviar.
- **Desarrollador 3, consultas y revisión de datos:** Implementa consultas sobre `USUARIO`, `ESTADO_USUARIO`, `USUARIO_PERFIL`, `RUTA`, `ESTADO_RUTA`, `HISTORIAL_VIAJE` y `CALIFICACION`; valida índices y evita consultas N+1. Confirma la fuente de verdad para viajes finalizados.
- **Solicitud:** Reutilizar `POST /api/routes/:id/solicitudes`, no crear un segundo flujo de reserva. El servidor sigue validando perfil pasajero, ruta `ACTIVA`, cupos, solicitud duplicada, identidad del conductor y método de pago.
- **Validaciones y pruebas:** No revelar pasajeros, documentos, pagos ni ubicaciones precisas históricas. Probar páginas vacías, cursores, filtros de estado, conductor inexistente, rutas completadas/sin cupo y solicitud del propio conductor.
- **Criterio de salida:** El usuario puede pasar de favorito a detalle y solicitar una ruta válida con las reglas ya existentes; historial y activos se presentan sin exponer datos privados.

## Matriz de dependencias y paralelismo

| Fase | Desarrollador 1 | Desarrollador 2 | Desarrollador 3 | Bloqueo para la siguiente fase |
|---|---|---|---|---|
| 1. Contratos | Contrato API y permisos | Flujos UI y tipos | Diseño de esquema | Contratos y modelo aprobados |
| 2. Contactos | API y autorización | Gestión de contactos UI | Tabla y restricciones | Migración + CRUD integrado |
| 3. Emergencia | API, email y worker | Botón y estados UI | Tablas, índices y secuencias | Registro, notificación y reintentos probados |
| 4. Favoritos | Revisión de seguridad | Lista/acciones UI | Tabla y API de favoritos | CRUD integrado e idempotente |
| 5. Detalle y viajes | API y autorización | Detalle/solicitud UI | Consultas y rendimiento | Flujo integral y privacidad aprobados |

La fase puede tener trabajo paralelo, pero la integración se realiza en este orden: migración en entorno de prueba, backend, frontend, regresión y aprobación. Las tareas de UI pueden comenzar con fixtures antes de que la API esté lista, siempre que el contrato de la Fase 1 no cambie.

## Puertas de calidad antes de cerrar cada fase

- **Datos:** Script incremental aplicado en base de prueba, restricciones e índices comprobados y rollback documentado cuando sea viable.
- **Backend:** Autenticación/autorización probadas, SQL parametrizado, errores consistentes y ninguna operación crítica depende de campos de identidad enviados por el cliente.
- **Frontend:** Manejo de carga, vacío, éxito y error; controles bloqueados durante envíos; accesibilidad básica para botón de emergencia y confirmaciones.
- **Integración:** Pruebas de endpoints con usuario propietario, usuario ajeno, estados inválidos y datos faltantes. Ejecutar regresión de rutas/solicitudes existentes.
- **Emergencias:** Simular email exitoso, timeout y fallo; comprobar historial y reintentos. No considerar la petición completada solamente porque el frontend recibió HTTP 200: distinguir alerta registrada de notificación entregada.
- **Entrega:** Actualizar contratos/documentación y dejar pasos reproducibles para desplegar migración, backend y frontend en el orden correcto.
