# Plan de trabajo por fases: Emergencias, viajes y comunicación

## Propósito y forma de trabajo

Este documento conserva contexto de las fases previas y detalla tareas ejecutables para las Fases 3 y 5–7. La Fase 4 se omite del plan por indicación del usuario, que la considera completada. Separa código existente de integración pendiente y propuestas aún no aprobadas. Los responsables pueden avanzar en paralelo solo cuando el contrato y las dependencias estén claros; no se declara una fase terminada hasta cumplir su criterio de salida.

Los roles son funcionales y pueden reemplazarse por nombres reales:

| Rol | Responsabilidad principal | Propiedad para evitar conflictos |
|---|---|---|
| **Desarrollador 1: Backend e integración** | MVC backend, autorización, contratos API, servicio de email y realtime. | Escribe controladores/rutas asignados; revisa seguridad de endpoints. |
| **Desarrollador 2: Frontend** | Experiencia de usuario, integración de API, estados de carga/error y pruebas de flujo UI. | Escribe componentes y páginas frontend, incluyendo constantes y tipos de API. |
| **Desarrollador 3: Datos y consultas** | Scripts Oracle, restricciones, índices, consultas de favoritos/viajes y pruebas SQL. | Es dueño de cambios en `scripts/` y de consultas de lectura de conductores/viajes. |

Cada área tiene un solo responsable de escritura. Los demás contribuyen mediante revisión, pruebas y contratos, no editando simultáneamente los mismos archivos.

## Reglas de eficiencia e integración

- Mantener el estilo del repositorio: controladores por módulo, rutas Express separadas, SQL con binds, respuestas mediante los helpers existentes, cliente API centralizado en frontend y scripts Oracle incrementales.
- No modificar el DDL inicial destructivo para agregar funcionalidades. Las fases 3 y 5 reutilizan estructuras existentes; para Fases 6–7 revisar primero el esquema y crear migraciones incrementales no destructivas solo si hacen falta.
- Antes de trabajar en paralelo, acordar por escrito nombres de campos, formato JSON, códigos HTTP, estados de dominio y responsabilidades de autorización. Evitar que frontend deduzca permisos o estados que corresponden al servidor.
- Mantener PRs pequeños por funcionalidad y capa. Cada PR debe incluir descripción, prueba ejecutada y pasos de migración. El responsable de cada área revisa cambios ajenos; el autor no aprueba su propio PR.
- No ejecutar migraciones contra la misma base compartida a la vez. El Desarrollador 3 coordina una única aplicación de cada script en el entorno de integración y confirma el resultado al equipo.
- Integrar primero contratos y migración; después API; luego UI. En local, cada desarrollador puede usar mocks conforme al contrato acordado mientras espera dependencias.
- **Alcance real de Emergencias v1:** no persiste alertas ni resultados, no tiene historial, cola ni reintentos duraderos. Envía un correo individual por contacto activo y devuelve el resultado por destinatario. La idempotencia y el límite de frecuencia actuales son en memoria y no garantizan deduplicación entre réplicas.
- No registrar en logs tokens, credenciales, correos de contactos, mensajes sensibles ni coordenadas precisas. Usar datos de prueba ficticios.
- Reunión breve diaria: estado, siguiente entrega y bloqueo. Los bloqueos de contrato o migración se resuelven antes de continuar implementaciones dependientes.

## Fase 1: Contratos y preparación compartida

**Objetivo:** Dejar una interfaz estable de datos/API para que backend, frontend y base de datos se implementen en paralelo sin retrabajo.

- **Desarrollador 1:** ~~Define contratos HTTP, autorización y modelo de estados. Especifica que la identidad del usuario se obtiene del JWT y que el servidor valida la participación en la ruta. Los contratos vigentes y sus reglas quedan consolidados en la sección «Estado, contratos y validación consolidados» de este documento.~~
- **Desarrollador 2:** Define los estados de pantalla, formularios y datos mínimos requeridos para cada vista. Prepara tipos TypeScript a partir de los contratos aprobados; todavía puede trabajar con fixtures locales.
- **Desarrollador 3:** ~~Revisa claves y relaciones Oracle actuales (`USUARIO`, `USUARIO_PERFIL`, `RUTA`, `SOLICITUD_CUPO`, `HISTORIAL_VIAJE`, `ESTADO_RUTA`) y prepara las migraciones incrementales, restricciones e índices de contactos y favoritos.~~
- **Entregables compartidos:** Contrato API aprobado, diccionario de columnas, propietario de cada script y lista de casos de autorización/privacidad.
- **Criterio de salida:** El equipo confirma que los identificadores de conductor serán `ID_UPE`, que la identidad del usuario será su documento autenticado y que las rutas solo generan alertas cuando están `EN_CURSO`.

## Fase 2: Contactos de emergencia

**Objetivo:** Permitir que una persona autenticada gestione sus contactos antes de habilitar el botón de emergencia.

- **Desarrollador 1, backend:** ~~Implementa `contacto-emergencia.controller.js` y `contacto-emergencia.routes.js`: listar, crear, editar, activar/desactivar y eliminar. Restringe cada operación al propietario obtenido del JWT.~~
- **Desarrollador 2, frontend:** ~~Implementa la sección reutilizable de contactos en configuración de pasajero y conductor: alta, edición, baja, activación, validación visible y estados de carga, vacío y error.~~
- **Desarrollador 3, base de datos:** ~~Prepara los scripts para crear `CONTACTO_EMERGENCIA` con `ID_CEM`, `DOCUMENTO_USU_CEM`, `NOMBRE_CEM`, `RELACION_CEM`, `CORREO_CEM` y `FECHA_CREACION_CEM`, además de su secuencia, FK a `USUARIO`, unicidad de correo por usuario e índice de consulta. Agrega `ACTIVO_CEM` mediante una migración incremental, con default `'S'` para los registros existentes y restricción para aceptar solo `'S'`/`'N'`. La migración 12 fue ejecutada y la columna fue verificada en Oracle.~~
- **Endpoints:** ~~`GET/POST /api/usuario/contactos-emergencia`, `PATCH /api/usuario/contactos-emergencia/:id` (incluye `activo: true|false`) y `DELETE /api/usuario/contactos-emergencia/:id`.~~
- **Contrato y reglas implementadas:** ~~Email normalizado y validado, longitudes limitadas, correo único por propietario incluso en contactos inactivos y máximo de cinco contactos activos. Crear siempre activos; al reactivar, rechazar si se excede el límite. Contrato actualizado para que los destinatarios de emergencia sean solo los contactos activos.~~
- **Validación local completada:** ~~Lint y typecheck focalizados en los módulos modificados, diagnósticos de los archivos tocados y comprobaciones de validación del backend.~~
- **Pendiente para cerrar fase:** Probar en integración el flujo UI/API con backend y Oracle activos; verificar CRUD, aislamiento entre dos usuarios, activación/reactivación y límite de cinco contactos activos. El typecheck global del frontend también requiere corregir el error de sintaxis preexistente en `frontend/src/components/app-sidebar.tsx`.
- **Criterio de salida:** Implementación de backend y UI disponible; fase pendiente de cierre hasta que pasen las pruebas de API/UI en integración y se verifique que un usuario no puede leer o cambiar contactos ajenos.

## Fase 3: Botón y envío de alerta de emergencia

**Estado actual comprobado en el repositorio:** ~~Existe el endpoint `POST /api/routes/:id/emergencias`, protegido por `authMiddleware` y montado bajo `/api/routes`. El controlador, el servicio de email, el botón frontend y sus puntos de integración están presentes.~~ El catálogo `TIPO_EMERGENCIA` y sus cuatro registros activos fueron creados y confirmados en Oracle por el usuario. El menú obtiene las opciones desde `GET /api/routes/tipos-emergencia`; el usuario confirmó que, después de ejecutar `COMMIT`, estas aparecieron. El endpoint de alerta valida el ID activo, comprueba ruta/participación/contactos, y entrega el nombre del tipo al servicio de email. El usuario reportó una prueba exitosa de envío de alerta por correo antes de integrar el catálogo; **falta confirmar en una prueba extremo a extremo que el tipo seleccionado aparece en el correo**. No se han reportado pruebas de todos los casos de aceptación de esta fase.

**Objetivo y resultado esperado:** Durante una ruta `EN_CURSO`, el conductor propietario o un pasajero con solicitud `ACEPTADA` y cupo `RESERVADO` puede confirmar una alerta. Se intenta enviar un email individual a cada contacto de emergencia activo del emisor. La ubicación es opcional. La interfaz informa el resultado de los intentos y no presenta el sistema como servicio oficial ni garantiza entrega o lectura.

**Prerrequisitos y dependencias**
- ~~Están disponibles la tabla y el CRUD de contactos de emergencia.~~ Para pruebas pendientes, usar cuentas dedicadas y Gmail API configurada; no probar con contactos reales.
- El flujo reutiliza la ruta, solicitud, cupo y contacto existentes; no depende de tabla de alertas.
- ~~Backend y frontend comparten el contrato para cargar tipos y enviar alertas.~~ Para probar fallos del proveedor, definir una estrategia de simulación Gmail/API sin notificar contactos reales.

**Crear o modificar**
- **Datos:** ~~No crear tablas de alertas ni historial en v1.~~ La tabla de catálogo `TIPO_EMERGENCIA` y sus cuatro tipos fueron creados en Oracle. ~~La base ya cuenta con `CONTACTO_EMERGENCIA.ACTIVO_CEM`.~~ No se requiere persistir el historial de alertas en el alcance v1.
- **Backend existente:** ~~`backend/controllers/emergencia.controller.js`, `backend/routes/route.routes.js`, `backend/services/email.service.js` y el montaje `/api/routes` en `backend/index.js`.~~ Además, `backend/controllers/tipo-emergencia.controller.js` expone el catálogo activo. La ruta de catálogo y el envío de alertas reutilizan `/api/routes`; no crear endpoints alternativos.
- **Frontend existente:** ~~`frontend/src/components/dashboard/emergency-alert-button.tsx`, integrado en el dashboard, muestra el menú y envía `tipoEmergenciaId`; `frontend/src/lib/api-constants.ts` apunta al endpoint de catálogo.~~ El menú ya mostró las opciones después de confirmar los INSERT en Oracle.
- **Pruebas:** no se encontraron archivos `*.test.*` o `*.spec.*` en backend/frontend ni scripts de test en sus manifiestos. Antes de automatizar, acordar runner y estrategia para Oracle/Gmail API; hasta entonces, registrar ejecuciones de aceptación reproducibles con fixtures.
- **Documentación:** mantener contrato, checklist de pruebas y límites operativos aquí; no documentar correo real, credenciales ni coordenadas de personas.

**Programar (pasos de implementación y verificación)**
1. Preparar usuarios, rutas y contactos ficticios para conductor dueño, pasajero aceptado/reservado, solicitud pendiente y usuario ajeno.
2. ~~Implementado: JWT obligatorio, identidad tomada del usuario autenticado, autorización de participante/ruta `EN_CURSO` y exigencia de contactos activos.~~ Pendiente: ejecutar casos de autorización en integración.
3. ~~Implementado: validación de `tipoEmergenciaId` y ubicación opcional con coordenadas finitas y dentro de rango.~~ Pendiente: probar GPS denegado/timeout desde UI y confirmar alerta sin ubicación.
4. ~~Implementado: UUID `Idempotency-Key`, huella con ruta/tipo/ubicación, idempotencia de 10 minutos por instancia y límite de 30 segundos por usuario/ruta.~~ Pendiente: verificar repetición, conflicto y límite en ejecución.
5. ~~Implementado: envío individual, resultados por destinatario y escape de contenido HTML; el usuario reportó que el envío básico de alerta por correo funciona.~~ Pendiente: comprobar que el tipo seleccionado aparece en el email y probar errores parciales/totales y privacidad con datos de prueba.
6. ~~Implementado: confirmación en UI, bloqueo durante envío, mensajes de resultado y menú que carga tipos activos del catálogo.~~ Pendiente: verificar estados de fallo en UI y que los mensajes no prometan entrega o lectura final.

**Integrar**
1. ~~El endpoint del catálogo y el endpoint de emergencia consultan Oracle; el menú cargó después de confirmar los INSERT y el usuario reportó una prueba exitosa del envío básico por Gmail API.~~ Pendiente: comprobar por HTTP el contrato completo y enviar una prueba que verifique el tipo seleccionado en el email.
2. ~~El botón reutiliza el cliente API autenticado y está integrado en el flujo de emergencia de los participantes.~~ Pendiente: ejecutar pruebas con dos identidades, ruta `EN_CURSO` y destinatarios de prueba.
3. No desplegar otra migración para esta fase. Completar pruebas con Oracle y correos de prueba; no usar contactos reales para probar las opciones.

**Pruebas de aceptación**
- ~~Implementado: control de participación y estado de ruta.~~ Pendiente de prueba integrada: conductor dueño y pasajero aceptado/reservado permitidos; solicitud pendiente, ajeno y cupo no reservado rechazados.
- ~~Implementado: validación de tipo activo y coordenadas.~~ Pendiente de prueba integrada: ruta no válida, JWT ausente, ID/tipo inválido y coordenadas mal formadas sin envío.
- ~~Implementado: selección de contactos activos del emisor.~~ Pendiente de comprobar con contactos de prueba activos, inactivos y de otro usuario.
- ~~Implementado: idempotencia y rate limit.~~ Pendiente de probar repetición, clave conflictiva, límite, GPS denegado y fallos parciales/totales del proveedor.
- ~~Implementado: destinatarios individuales y escape HTML.~~ Pendiente de comprobar privacidad, precisión de la ubicación y que el correo recibido incluya el tipo seleccionado.

**Criterio de salida**
- ~~Implementación de catálogo, carga del menú, validación de tipo activo y paso del nombre al email. El usuario confirmó que el menú cargó tras `COMMIT` y que el envío básico por correo tuvo éxito.~~
- Fase pendiente de cierre hasta confirmar en una prueba que el tipo seleccionado aparece en el email y ejecutar los casos de aceptación restantes con cuentas y contactos de prueba; no enviar alertas de prueba a contactos reales.
- ~~Registrar explícitamente que la idempotencia (10 min) y el límite (30 s) son por proceso/memoria, y que la aceptación de envío por Gmail API no prueba lectura ni entrega final.~~
- Este cierre desbloquea la regresión de rutas/contactos; no es prerrequisito técnico para Fase 5.

**Riesgos y decisiones abiertas**
- Si se requiere idempotencia o rate limit entre réplicas/reinicios, diseñar persistencia/almacenamiento distribuido en una fase separada; no describir las garantías actuales como globales.
- El tiempo de espera de GPS de navegador es 5 s y puede variar por dispositivo. No convertir la geolocalización en requisito para alertar.

## Fase 4: Gestión de conductores favoritos — fuera del alcance solicitado

Esta fase se omite del plan ejecutable a petición del usuario, quien la indica como completada. El repositorio contiene el controlador, las rutas, la página y scripts asociados; esta revisión no vuelve a ejecutar pruebas de integración ni verifica el estado actual de Oracle. La Fase 5 parte de que Favoritos está disponible.

## Fase 5: Detalle, viajes y solicitud desde favoritos

**Estado actual:** La implementación incluye `GET /api/conductores/:idUpe` y `GET /api/conductores/:idUpe/viajes`, autenticados por router y montados en `backend/index.js`; el detalle, filtros, paginación y CTA están integrados en `frontend/src/components/favorite-drivers.tsx` desde `/dashboard/passenger/favoritos`. La solicitud reutiliza `POST /api/routes/:id/solicitudes`, que obtiene el precio desde la ruta en Oracle y no confía en el importe enviado por el cliente. El usuario confirmó en esta revisión que los viajes funcionan perfectamente desde Favoritos y que la Fase 5 funciona. Esto confirma el flujo funcional reportado, pero no aporta por sí solo evidencia de todos los casos de aceptación que siguen abajo; no se repitieron pruebas HTTP/Oracle ni se verificó una segunda página real en esta revisión.

**Objetivo y resultado esperado:** Desde un favorito el pasajero consulta un perfil de conductor y sus rutas paginadas, con información pública mínima; puede solicitar cupo solo para una ruta `ACTIVA` con disponibilidad. La solicitud se procesa por el endpoint actual y el precio canónico lo determina el servidor.

**Prerrequisitos y dependencias**
- Fase 4 debe estar disponible, según el alcance indicado por el usuario; sesión válida con perfil pasajero.
- Backend/Oracle de integración y usuarios con ruta activa futura, ruta llena, ruta cerrada y al menos 21 resultados para validar paginación.
- El frontend puede probar presentación con fixtures del contrato; reservas reales solo con identidades/rutas dedicadas y permiso para modificar la base.

**Crear o modificar**
- **Datos:** no se identificó requisito de migración. Las consultas usan `USUARIO_PERFIL`, `PERFIL`, `USUARIO`, `ESTADO_USUARIO`, `RUTA` y `ESTADO_RUTA`; datos de prueba deben prepararse en esquema aislado.
- **Backend existente:** `backend/controllers/conductores.controller.js`, `backend/routes/conductores.routes.js`, su montaje en `backend/index.js`; solicitud existente en `backend/controllers/route.controller.js` y `backend/routes/route.routes.js`.
- **Frontend existente:** `frontend/src/components/favorite-drivers.tsx`, `frontend/src/app/dashboard/passenger/favoritos/page.tsx` y URLs en `frontend/src/lib/api-constants.ts`.
- **Pruebas:** no hay runner/test manifest visible. Definir si se incorporan pruebas HTTP/componentes; en cualquier caso preparar checklist con respuestas anonimizadas de integración.
- **Documentación:** conservar ejemplos de respuesta sin documentos, correos, teléfonos, IDs de pasajeros ni tokens reales.

**Programar (pasos de implementación y verificación)**
1. Perfil: enviar JWT y un `idUpe` entero positivo; validar perfil `CONDUCTOR`; esperar `404` si no existe. Respuesta esperada: `idUpe`, nombre, foto pública nullable, calificación, estado y viajes completados; no incluir documento, correo ni teléfono.
2. Viajes: defecto `estado=ACTIVA`, `limite=20`; aceptar solo `ACTIVA`, `EN_CURSO`, `COMPLETADA`; límite 1–50; cursor opaco y estable por fecha/ID. Comprobar que una página con más resultados devuelve `nextCursor` y la última no.
3. Privacidad: las coordenadas visibles son generalizadas (consulta actual redondea a dos decimales). Para `COMPLETADA`, responder solo ruta, estado, fecha y origen/destino generalizados; no serializar cupos ni precio, ni datos de participantes/pagos.
4. UI: desde favorito abrir detalle y volver a la lista; presentar carga, error/perfil inexistente, filtro sin resultados y estado vacío. Cambiar filtro reinicia cursor; “Siguiente” solo si existe `nextCursor`; “Anterior” vuelve al cursor previo.
5. Solicitud: mostrar el CTA únicamente para ruta `ACTIVA` con cupos; pedir confirmación, usar método de pago soportado y llamar `POST /api/routes/:id/solicitudes`. El body actual de UI también envía `amount`; no usarlo como fuente de verdad ni confiar en el precio del cliente. Confirmar en backend que se calcula desde `RUTA.PRECIO_CUPO_RUT`.
6. Presentar en UI éxito y errores de ruta cerrada/sin cupos, duplicado, solicitud propia o perfil sin rol pasajero; no borrar filtros/lista tras fallo.

**Integrar**
1. Validar primero respuestas de perfil/viajes por HTTP con JWT; comprobar filtros, cursor y serialización antes de enlazar UI.
2. Conectar la página de Favoritos y probar con respuesta real; usar fixtures solo para pruebas visuales.
3. Probar solicitud en entorno aislado: comparar importe mostrado con precio de base, pero modificar datos solo con cuentas dedicadas. Ejecutar regresión de listado, alta/baja de Favoritos, búsqueda y solicitudes.

**Pruebas de aceptación**
- Sin token: `401`; ID mal formado: `400`; perfil inexistente/no conductor: `404`; filtro/límite/cursor inválido: `400`.
- Para cada estado, campos y privacidad coinciden con el contrato; estado `COMPLETADA` no incluye cupos ni precio.
- Con al menos 21 rutas, navegar dos páginas sin duplicados ni saltos; con cero resultados, mostrar estado vacío.
- Solicitud válida crea una sola solicitud con importe calculado en servidor; duplicada, propia, ruta sin cupos/cerrada y usuario sin perfil pasajero se rechazan con error claro.
- En navegador: carga, error, filtro, anterior/siguiente, regreso a Favoritos y ancho mínimo de 360 px.

**Criterio de salida**
- Contrato autenticado y privacidad verificados; paginación real de más de una página probada; solicitud válida y todos los rechazos comprobados con datos aislados; regresión de Favoritos pasa.
- No dar por cerrada la fase basándose solo en la presencia de código o una prueba de vista sin backend.

**Pendiente para el cierre formal (no se identificó una funcionalidad principal ausente en el código revisado):**
- Con datos dedicados, comprobar por HTTP los casos de autenticación/ID/perfil/estado/límite/cursor inválidos y verificar que el perfil y cada estado de viaje solo serializan los campos permitidos.
- Confirmar paginación real con más de 20 rutas: avanzar y volver sin duplicados ni saltos, y comprobar el filtro vacío y reinicio de cursor al cambiar el estado.
- Probar en aislamiento una solicitud válida y los rechazos por ruta propia, sin cupos, cerrada, duplicada y usuario sin perfil pasajero; verificar que el importe persistido es el precio de `RUTA`, no el enviado por UI.
- Ejecutar regresión de Favoritos, búsqueda/solicitudes y revisar navegador a 360 px. Resolver o registrar la decisión de si coordenadas redondeadas a dos decimales son suficiente generalización para el producto.
- Guardar evidencia breve del entorno, datos dedicados y resultados sin incluir identificadores personales ni secretos. No es necesario agregar migraciones para la Fase 5 según el esquema revisado.

**Riesgos y decisiones abiertas**
- Los endpoints de perfil/viajes requieren autenticación pese a que la respuesta es “pública”; conservar esta decisión mientras no se apruebe un cambio de acceso.
- Definir si precisión de coordenadas a dos decimales satisface “ubicación generalizada” para el contexto del producto.
- La segunda página y una reserva real requieren datos de integración específicos; no improvisar sobre datos compartidos.

## Fase 6: Seguimiento en tiempo real y compartir ubicación

**Estado actual comprobado en el repositorio:** No se encontraron módulos, rutas, tablas o dependencias de Socket.IO/WebSocket ni tablas `RUTA_COMPARTIDA` en el alcance inspeccionado. `backend/index.js` inicia Express con `app.listen`; se debe adaptar si el transporte elegido necesita un servidor HTTP compartido. La fase está pendiente de diseño e implementación, no iniciada.

**Objetivo y resultado esperado:** Un conductor o pasajero participante de una ruta `EN_CURSO` comparte ubicación actual con uno o más contactos propios elegidos, con consentimiento explícito, lectura restringida, revocación y vencimiento. Guardar solo posición vigente, nunca una trayectoria.

**Prerrequisitos y dependencias**
- Definir las decisiones abiertas al final del documento: si el contacto necesita cuenta, invitación segura, duración máxima, revocación, frecuencia, precisión, retención y despliegue.
- Revisar relaciones Oracle reales para demostrar participación activa (dueño o solicitud aceptada/cupo reservado); no basarse en datos del cliente.
- La fase puede diseñar contrato, UI y migración en paralelo después de aprobar decisiones. La implementación en producción queda bloqueada hasta escoger y probar transporte y autorización.

**Crear o modificar**
- **Datos:** no existen tablas verificadas para este flujo. Como propuesta, crear migración Oracle incremental para seguimiento (ruta, participante, estado, fecha de expiración y última posición) y relación de destinatarios con los contactos seleccionados y marca de revocación. Agregar claves foráneas, unicidad por seguimiento/contacto e índices por ruta/expiración. Si se usan enlaces, persistir solo hash del token, nunca el token utilizable. Acordar qué se elimina al vencer/cerrar; no copiar este esquema sin contrastar tipos/FK existentes.
- **Backend:** propuesta de nuevos módulos separados para sesiones de ubicación, autorización y transporte realtime; modificar `backend/index.js` para compartir servidor HTTP si el paquete elegido lo requiere. Las rutas/eventos y nombres de tablas aún no están aprobados; no inventar contrato definitivo.
- **Frontend:** propuesta de acción en vistas de viajes activos del conductor y pasajero, selector de contactos, permiso GPS, pantalla de estado y vista de destinatario si se permite enlace/cuenta. No hay pantalla/ruta destino de compartición existente verificada.
- **Dependencias:** `backend/package.json` no incluye Socket.IO y tampoco se verificó cliente realtime en `frontend/package.json`; selección requiere validar compatibilidad de despliegue antes de agregarlas.
- **Pruebas/documentación:** crear contrato de eventos/API, modelo de amenazas breve, política de consentimiento/retención y casos de prueba; seleccionar herramientas solo tras decidir transporte.

**Programar (pasos de implementación y verificación)**
1. Cerrar sesión con ruta, emisor y destinatarios obtenidos/verificados desde JWT y Oracle; el cliente no establece identidad ni propiedad. Autorizar dueño o pasajero con membresía vigente y ruta `EN_CURSO`.
2. Exigir selección de contacto perteneciente al usuario autenticado; rechazar contacto ajeno, inactivo o vacío. Generar autorización para el destinatario conforme al modelo decidido (cuenta autenticada o enlace de un solo uso).
3. Validar latitud/longitud, registrar timestamp de servidor y aplicar cadencia máxima/frecuencia acordada. Rechazar coordenadas fuera de rango y emisión fuera de sesión; no almacenar historial.
4. Entregar exclusivamente a los destinatarios autorizados. Al reconectar, revalidar autorización y devolver como máximo la última posición vigente, nunca una sala global.
5. Implementar “detener” y revocación individual; al cerrar/cancelar ruta o vencer la sesión, bloquear publicación/lectura y ejecutar purga conforme a política acordada.
6. UI: explicar qué se comparte y con quién antes de pedir permiso; manejar GPS denegado/no disponible, desconexión, posición antigua, reconexión, sesión expirada y parada/revocación visibles.

**Integrar**
1. Prototipar autenticación realtime y autorización con un cliente de prueba, antes de construir pantallas finales. Validar que token y handshake no se registran.
2. Aplicar migración incremental solo en base aislada; verificar FK, índices, expiración, revocación y tarea de purga. Documentar rollback/recuperación antes de un entorno compartido.
3. Integrar backend, luego UI de emisor y destinatario; usar navegador con HTTPS/localhost para permiso de geolocalización.
4. Ejecutar prueba de dos participantes autorizados y una identidad no autorizada; no usar contactos reales ni coordenadas precisas reales.

**Pruebas de aceptación**
- Conductor dueño y pasajero aceptado/reservado en ruta `EN_CURSO` comparten; ajeno, pasajero pendiente/cancelado y ruta no activa son rechazados.
- Contacto propio autorizado ve ubicación reciente; token/cuenta inválidos, revocados o vencidos no leen ni se reconectan.
- Contacto de otro usuario/inactivo no puede ser seleccionado; un participante no puede acceder a la compartición de otro participante sin invitación.
- GPS denegado no inicia publicación; coordenadas inválidas y frecuencia superior al límite se rechazan; desconexión se representa como datos atrasados.
- Tras revocación, cierre de ruta o expiración, la lectura/publicación cesa y la posición se elimina dentro del plazo de purga especificado.
- Inspección de logs/rooms confirma que no hay token, coordenada precisa ni difusión a usuarios no autorizados.

**Criterio de salida**
- Contrato y política aprobados; autorización, revocación, expiración, recuperación de conexión y purga demostradas en integración; el destinatario solo recibe la última posición actual autorizada.
- No activar en producción hasta probar transporte en el despliegue objetivo, incluidas múltiples instancias si ese será el entorno.

**Riesgos y decisiones abiertas**
- Contactos actuales tienen nombre/relación/correo, no necesariamente cuenta. Definir mecanismo de identidad del destinatario antes del esquema.
- Enlaces a ubicación son credenciales: requieren un solo uso o revocación efectiva, expiración corta, hash en reposo, no aparecer en logs/referrer y canal de entrega acordado.
- La compartición depende de permisos del navegador, conectividad, HTTPS y proceso cliente activo; no prometer rastreo garantizado ni respuesta de emergencia.

## Fase 7: Chat grupal temporal por viaje

**Estado actual comprobado en el repositorio:** No se encontraron módulos, rutas, tablas ni dependencias realtime/chat en el código inspeccionado. Es una fase no implementada. La propuesta depende del transporte y autenticación aprobados en Fase 6.

**Objetivo y resultado esperado:** Conductor y pasajeros con participación vigente en la misma ruta se comunican en un canal grupal privado durante el viaje. Mensajes son texto, tienen autor/hora, se pueden borrar por su autor y se purgan según una política temporal explícita.

**Prerrequisitos y dependencias**
- Cerrar Fase 6 en lo relativo a transporte realtime, autenticación, reconexión, manejo de salas y ciclo de vida de ruta.
- Resolver la política de retención/purga y confirmar con producto si chat se habilita antes del inicio o solo en `EN_CURSO`.
- Confirmar la consulta de membresía vigente y sus estados/relaciones Oracle existentes.

**Crear o modificar**
- **Datos:** crear migración Oracle incremental propuesta para mensajes con ID, ID de ruta, emisor, cuerpo de texto, timestamp del servidor y fecha de expiración; FK a ruta/usuario e índices por ruta/fecha y expiración. No guardar tokens realtime ni datos de ubicación. Esquema/nombres aún por aprobar.
- **Backend:** agregar módulos propuestos de membresía, autorización, mensajes y purga que reutilicen transporte Fase 6; no existe contrato HTTP/evento actual para chat. Todas las operaciones validan pertenencia vigente, no solo al conectar.
- **Frontend:** agregar chat al detalle del viaje para participantes, lista y compositor de mensajes; estados conectando, conectado, reconectando, envío fallido, vacío y sesión cerrada. La ubicación exacta del detalle en el producto debe acordarse porque no hay una pantalla de chat existente.
- **Pruebas/documentación:** contrato de eventos, límites de mensaje/frecuencia, comportamiento de reconexión, borrado y política de retención; no se encontraron archivos automatizados de prueba ni runner declarado.

**Programar (pasos de implementación y verificación)**
1. Resolver ID de ruta y documento de usuario desde sesión autenticada; autorizar conductor propietario y pasajeros con solicitud aceptada/cupo vigente. Denegar solicitudes pendientes, rechazadas, canceladas y usuarios ajenos.
2. Al entrar, revalidar estado de ruta y membresía; unir exclusivamente a sala identificada por ruta tras autorización. Revalidar autorización en envío, carga de historial y borrado.
3. Validar texto no vacío tras trim, longitud máxima acordada, tamaño de payload y frecuencia por usuario/ruta. Renderizar como texto plano; no ejecutar HTML/Markdown activo.
4. Asignar autor y hora en backend. Implementar identificador de cliente/deduplicación para evitar mensajes duplicados al reconectar y orden estable servidor-secuencia/hora+ID.
5. Permitir borrado propio y reflejarlo a miembros autorizados. No añadir borrado/moderación de mensajes ajenos sin decisión funcional y auditoría.
6. Cerrar sala y rechazar operaciones tras estado final/cancelación. Ejecutar purga automática según la retención aprobada; la expiración de filas no equivale a borrado si no hay proceso que la ejecute.
7. Frontend: mostrar autor/hora, error de red, estado de reconexión, mensajes nuevos sin recargar y control de borrar solo propios; nunca exponer chat en perfil/búsqueda pública.

**Integrar**
1. Validar transporte/auth de Fase 6 y membresía con pruebas de dos usuarios autorizados y un tercero no miembro.
2. Aplicar migración en Oracle aislado; demostrar orden, índices, borrado y purga mediante job/proceso operativo real.
3. Integrar UI participante después de backend; verificar sesión expirada, cambio de estado y reconexión sin reenvío duplicado.
4. No habilitar en producción hasta verificar escala/afinidad de sesiones entre instancias y proceso de purga en el despliegue objetivo.

**Pruebas de aceptación**
- Conductor y pasajero aceptado/reservado pueden leer/enviar en la ruta permitida; ajeno, pendiente, rechazado, cancelado o usuario sin JWT no puede conectar, leer ni enviar.
- Ruta elegible permite chat solo en la ventana acordada; ruta finalizada/cancelada rechaza nuevas operaciones.
- Vacío, mensaje en blanco, longitud excedida, payload grande, ráfaga y HTML/XSS se manejan sin caída ni ejecución.
- Reconexión no duplica mensajes; autor/timestamp/orden son del servidor; un usuario solo borra su propio mensaje.
- Mensajes desaparecen dentro del TTL acordado; no quedan token de socket o ubicación en la tabla ni en logs.
- Navegador muestra conexión, reconexión, fallo, vacío y cierre; vista no participante no contiene historial.

**Criterio de salida**
- Pruebas de membresía, contenido, límites, deduplicación, cierre de sala, borrado propio, autorización de reconexión y retención/purga pasan en entorno integrado.
- El proceso de expiración está programado, observable y documentado; no basta con guardar `fecha_expiracion`.

**Riesgos y decisiones abiertas**
- La duración planteada históricamente (hasta 24 horas) no es una decisión final. Definir si se purga al cierre inmediato o en un plazo no mayor de 24 horas.
- Acordar si mensajes editados se excluyen (recomendado para primera versión) y si se necesita reporte/moderación, antes de exponer borrado administrativo.
- Realtime requiere estrategia de escalado, autorización en cada evento y purga operativa; sala privada por sí sola no es control de acceso.

## Ejecución y dependencias

### Secuencia general de implementación e integración

1. **Comprobar entrada:** validar rama/entorno, configuración segura y contratos vigentes; usar cuentas y datos ficticios dedicados. Registrar qué es código presente y qué requiere integración, sin asumir que un archivo existente está desplegado.
2. **Cerrar decisiones y contrato:** backend, frontend y datos acuerdan autorización, formato de entrada/salida, errores, estados y privacidad. Toda propuesta de endpoint, evento o esquema de Fases 6–7 se marca como propuesta hasta aprobación.
3. **Preparar base aislada:** revisar DDL vigente; crear migración incremental solo si es necesaria; probar aplicación, restricciones, reinicio y rollback/recuperación antes de cualquier esquema compartido. No ejecutar migraciones concurrentes.
4. **Implementar backend:** consultas parametrizadas, identidad obtenida del JWT, autorización en cada operación/evento, errores explícitos y pruebas con Oracle/servicios simulados.
5. **Implementar frontend en paralelo con fixtures:** no bloquear componentes por la API si el contrato está congelado; incluir carga, vacío, error, éxito, cancelación y reconexión cuando aplique.
6. **Integrar por entorno:** migración → backend → frontend → navegador/HTTP → aceptación con datos dedicados. Simular Gmail API y realtime; no generar correos, reservas ni comparticiones con datos reales.
7. **Ejecutar regresión y documentar:** comprobar el criterio de salida y los flujos previos afectados; anotar comandos, entorno, resultado y limitaciones. No declarar una fase cerrada por inspección de código solamente.

### Matriz de dependencias y paralelismo

| Fase incluida | Backend | Frontend | Datos/Oracle | Dependencia y puerta de salida |
|---|---|---|---|---|
| 3. Emergencia | ~~Endpoint, membresía, validación de tipo, envío por email e idempotencia implementados~~; pruebas integradas pendientes | ~~Menú de tipos desde catálogo, confirmación, GPS opcional y resultado por intento implementados~~; aceptación pendiente | ~~Catálogo `TIPO_EMERGENCIA` creado; reutiliza ruta, solicitud, cupo y contactos~~; sin tabla de historial v1 | Fase pendiente de confirmar tipo en correo y ejecutar casos de aceptación; no bloquea Fase 5. |
| 4. Favoritos | Fuera de alcance de este plan; se considera completada por indicación del usuario | — | — | Fase 5 parte de Favoritos disponible; pruebas previas no se repiten aquí. |
| 5. Detalle/viajes | Endpoints de perfil/viajes y solicitud existente; el servidor calcula el precio | Detalle, filtros, paginación y CTA conectados desde Favoritos; usuario confirma que viajes funciona | Sin migración identificada | Funcionalidad reportada operativa; para cierre formal faltan evidencias de privacidad/autorización, más de una página real, solicitud/rechazos y regresión. |
| 6. Compartir ubicación | Definir auth/realtime, membresía, revocación y expiración | Consentimiento, GPS, emisor/destinatario | Migración propuesta para estado/última posición y destinatarios | Contratos/UI/esquema pueden avanzar en paralelo tras decidir política; no publicar hasta superar seguridad y purga. |
| 7. Chat por viaje | Sala privada, autorización por evento, mensajes y deduplicación | Chat y estados de conexión | Mensajes temporales e índice/purga propuestos | Depende de transporte y ciclo de vida aprobados en Fase 6; la política de retención bloquea producción. |

Para evitar conflictos, asignar un solo responsable de edición por capa: **backend/API**, **frontend/UI**, **Oracle/migraciones**. Los contratos los aprueban en conjunto antes de implementación. Se pueden revisar mutuamente mediante PR, pero no editar simultáneamente los mismos archivos. Fases 6 y 7 admiten trabajo de diseño paralelo, no despliegue independiente del mecanismo de autorización.

## Puertas de calidad antes de cerrar cada fase

- **Pruebas disponibles:** al revisar los manifiestos no se encontraron scripts de test declarados ni archivos `*.test.*`/`*.spec.*` en backend/frontend. Antes de exigir automatización, elegir runner y estrategia de Oracle/realtime; mientras tanto, usar checklist de aceptación reproducible y conservar evidencia sin secretos.
- **Datos:** migración incremental aplicada en base aislada, restricciones e índices comprobados y procedimiento de recuperación/rollback documentado.
- **Backend:** identidad y permisos comprobados para titular/no titular, SQL parametrizado, errores con códigos observables; ninguna operación confía en ID de usuario/contacto/participante enviado por cliente.
- **Frontend:** estados de carga, vacío, error y éxito; controles bloqueados mientras hay envío; teclado/etiquetas accesibles; vistas verificadas en ancho de 360 px.
- **Integración:** pruebas con JWT ausente, dos usuarios, estados no permitidos, datos faltantes y concurrencia relevante; ejecutar regresión de rutas/solicitudes.
- **Emergencias:** Gmail API simulada o entorno de prueba con éxito/timeout/fallo parcial/fallo total; comprobar resultado agregado/individual, tipo incluido en el correo, idempotencia y límite. No afirmar persistencia, historial o reintento duradero.
- **Ubicación:** consentimiento, destinatario autorizado, revocación, reconexión y expiración/purga; no guardar trayectoria.
- **Chat:** membresía por conexión y evento, texto plano, tamaño/frecuencia, deduplicación, cierre y purga.
- **Entrega:** registrar pasos de migración/configuración/despliegue, resultados, limitaciones y responsable de la operación de limpieza.

## Estado, contratos y validación consolidados

Esta sección reúne contratos y riesgos. Para las fases 3 y 5, la etiqueta “existe en el repositorio” significa que se inspeccionó código fuente en esta revisión; no implica que esté desplegado, que Oracle tenga datos compatibles ni que hayan pasado pruebas de integración. Para Fase 4 se respeta la indicación del usuario de considerarla terminada, sin afirmar que se volvió a probar.

### Estado comprobado en esta revisión

- La ruta Express de emergencias, controlador/servicio de email, botón y puntos de montaje están presentes. El usuario reportó que el catálogo se mostró tras confirmar sus INSERT y que el envío básico de alerta por correo funciona; aún no confirmó un correo recibido que incluya el tipo seleccionado.
- El usuario confirmó en esta revisión que los viajes funcionan perfectamente desde Favoritos y que la Fase 5 funciona. La inspección confirma endpoints autenticados, filtros/cursor, ocultamiento de precio/cupos en completados y CTA conectado a la solicitud existente; el servidor deriva el importe de la ruta. No se ejecutaron aquí pruebas HTTP/Oracle que demuestren paginación real, privacidad y todos los rechazos, por lo que siguen como evidencia de cierre y no como funcionalidad faltante conocida.
- Los scripts inspeccionados son incrementales para contactos/favoritos; no se encontró esquema de ubicación/chat ni Socket.IO/WebSocket en los directorios inspeccionados/manifiestos consultados.
- El usuario indicó que la Fase 4 está completada. La existencia de archivos/scripts se verificó, pero no se repitió integración en Oracle.

### Contratos y reglas que deben conservarse

- **Autorización e identidad:** los endpoints son autenticados salvo que un contrato nuevo indique lo contrario. El propietario se obtiene del JWT (`req.user.documento`), y el perfil de conductor se identifica por `ID_UPE`. Nunca confiar en propietario, participante, destinatarios ni identidad enviados por el cliente. Usar SQL parametrizado; no incluir JWT, documentos, correos, mensajes sensibles ni coordenadas precisas en logs.
- **Contactos de emergencia:** `/api/usuario/contactos-emergencia` permite listar, crear, editar/activar y eliminar solo registros del usuario autenticado. Nombre, relación y correo son obligatorios; normalizar correo a minúscula; máximo cinco contactos activos por usuario; el correo es único por propietario incluso si el contacto está inactivo. Solo los activos reciben alertas.
- **Emergencias:** `GET /api/routes/tipos-emergencia` devuelve tipos activos de `TIPO_EMERGENCIA`; el menú envía `tipoEmergenciaId`. `POST /api/routes/:id/emergencias` permite alertar al conductor dueño o pasajero con solicitud `ACEPTADA` y cupo `RESERVADO` solo cuando la ruta está `EN_CURSO`. `ubicacion` es opcional; latitud y longitud deben enviarse juntas y estar dentro de rango. El backend valida que el tipo esté activo, obtiene su nombre en Oracle y lo pasa al email individual de cada contacto activo; no retorna correos ni detalles internos del proveedor. El usuario confirmó carga del catálogo y reportó que el envío básico de alerta funciona; falta confirmar el email con el tipo seleccionado. No hay persistencia ni historial v1. Idempotencia de 10 minutos y rate limit de 30 segundos dependen de memoria/proceso.
- **Favoritos:** la implementación descrita en Fase 4 usa `GET /api/usuario/conductores-favoritos`, `GET /api/usuario/conductores-favoritos/candidatos`, `POST /api/usuario/conductores-favoritos` para altas múltiples y `DELETE /api/usuario/conductores-favoritos/:idUpe`. La lista y las escrituras pertenecen al usuario autenticado; no se permiten auto-favoritos ni perfiles que no sean conductores. La propuesta antigua de `POST .../:idUpe` no coincide con el contrato de alta múltiple y no debe usarse como referencia de la implementación.
- **Detalle y viajes:** `GET /api/conductores/:idUpe` y `GET /api/conductores/:idUpe/viajes?estado=&limite=20&cursor=` requieren autenticación. Estados `ACTIVA`, `EN_CURSO`, `COMPLETADA`; límite default 20, máximo 50, paginación cursor. El código actual redondea ubicaciones a dos decimales; los viajes completados no serializan cupos ni precio. No exponer documentos, correos, teléfonos, pasajeros ni pagos.
- **Solicitudes desde Favoritos:** reutilizar `POST /api/routes/:id/solicitudes`; validar en servidor perfil pasajero, participación, estado de ruta, cupos y duplicados. El precio se calcula desde `RUTA.PRECIO_CUPO_RUT`, nunca desde un monto confiado al cliente.
- **Fases 6–7:** nombres de tablas, API y eventos realtime no están aprobados ni existen en el código verificado; las propuestas de sus secciones no son contratos implementados.

### Pruebas de regresión que siguen siendo útiles

Usar cuentas y datos ficticios/dedicados; no copiar al plan los usuarios, documentos, correos, credenciales ni matrículas de los documentos históricos.

1. Fase 3: permisos, transiciones de ruta, coordenadas opcionales, idempotencia, frecuencia, timeout/fallos de Gmail API y privacidad del correo.
2. Fase 5: completar evidencia de autenticación, serialización pública, filtros/cursor con más de una página, solicitud elegible y rechazos; regresión de Favoritos/búsqueda/solicitudes. El usuario confirma el flujo de viajes desde Favoritos operativo.
3. Fase 6: consentimiento, vínculo entre contacto y dueño, participante/no participante, token/cuenta inválidos, revocación, reconexión, límites, cierre y purga.
4. Fase 7: miembro/no miembro, contenido/límites, duplicados, borrado propio/ajeno, cierre del viaje y retención/purga.
5. Regresión integral: roles, vehículos/rutas/solicitudes, navegación, estados UI y pantallas desde 360 px; cambiar datos compartidos solo con cuentas dedicadas.

### Requisitos del PPI y decisiones abiertas

- El documento PPI3 mantiene como requisito funcional un **chat entre usuarios** y alertas de plataforma para solicitudes, aceptaciones, rechazos y cancelaciones. El alcance actualizado de este plan concreta el chat como grupal y temporal, limitado a participantes del mismo viaje.
- El proyecto se mantiene enfocado en el carpooling de la comunidad universitaria; las cuatro mejoras de seguridad/comunicación priorizadas son S.O.S., conductores favoritos, chat temporal por viaje y seguimiento/compartición de ubicación.
- El PPI3 fija como objetivo de rendimiento que el 95% de las notificaciones de plataforma se muestren en menos de cinco segundos y que el estado de solicitudes activas se actualice sin recargar la página. Son criterios heredados por verificar; no se consideran medidos ni cumplidos por esta consolidación.
- El objetivo del proyecto también contempla notificar al usuario cuando un conductor favorito inicia un viaje. Esta capacidad no aparece en las fases verificadas: antes de implementarla hay que definir si el evento es publicar la ruta o pasarla a `EN_CURSO`, el canal de notificación y las preferencias/consentimiento del usuario.
- **Bloqueantes antes de implementar Fase 6:** ¿destinatario de ubicación debe tener cuenta o puede usar enlace de un solo uso? ¿qué duración máxima tendrá la compartición? ¿qué cadencia/precisión y antigüedad máxima se aceptan? ¿cómo revoca el dueño y cómo se cierra al finalizar ruta? ¿qué transporte es compatible con el despliegue y con varias instancias? ¿qué proceso operativo ejecuta purga y alerta errores?
- **Bloqueantes antes de implementar Fase 7:** ¿chat solo `EN_CURSO` o también antes de iniciar? ¿purga al cierre o dentro de 24 h? ¿qué longitud máxima y límite por usuario? ¿se permite edición? ¿hay moderación/reporte administrativo? ¿cómo opera reconexión/deduplicación en el despliegue seleccionado?
- **Contrato transversal:** confirmar estados/relaciones Oracle reales para pasajero y cupo; documentar errores HTTP/eventos para identidad sin permiso, sesión expirada, ruta cerrada, contacto revocado y datos vencidos.
- El alcance de notificaciones cuando un conductor favorito inicia un viaje no está en Fases 3, 5, 6 o 7: definir si el disparador es publicación de ruta o inicio (`EN_CURSO`), canal y consentimiento antes de planificarla.
- Decidir antes de añadir automatización de tests el runner y cómo sustituir/mockear Oracle, SMTP y transporte realtime. Los manifiestos inspeccionados no declaran runner de pruebas.
- La guía didáctica de la asignatura revisada no aporta requisitos de producto que deban trasladarse al plan.
