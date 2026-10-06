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

- **Desarrollador 1, backend:** ~~Implementa `contacto-emergencia.controller.js` y `contacto-emergencia.routes.js`: listar, crear, editar, activar/desactivar y eliminar. Restringe cada operación al propietario obtenido del JWT.~~
- **Desarrollador 2, frontend:** ~~Implementa la sección reutilizable de contactos en configuración de pasajero y conductor: alta, edición, baja, activación, validación visible y estados de carga, vacío y error.~~
- **Desarrollador 3, base de datos:** ~~Prepara los scripts para crear `CONTACTO_EMERGENCIA` con `ID_CEM`, `DOCUMENTO_USU_CEM`, `NOMBRE_CEM`, `RELACION_CEM`, `CORREO_CEM` y `FECHA_CREACION_CEM`, además de su secuencia, FK a `USUARIO`, unicidad de correo por usuario e índice de consulta. Agrega `ACTIVO_CEM` mediante una migración incremental, con default `'S'` para los registros existentes y restricción para aceptar solo `'S'`/`'N'`. La migración 12 fue ejecutada y la columna fue verificada en Oracle.~~
- **Endpoints:** ~~`GET/POST /api/usuario/contactos-emergencia`, `PATCH /api/usuario/contactos-emergencia/:id` (incluye `activo: true|false`) y `DELETE /api/usuario/contactos-emergencia/:id`.~~
- **Contrato y reglas implementadas:** ~~Email normalizado y validado, longitudes limitadas, correo único por propietario incluso en contactos inactivos y máximo de cinco contactos activos. Crear siempre activos; al reactivar, rechazar si se excede el límite. Contrato actualizado para que los destinatarios de emergencia sean solo los contactos activos.~~
- **Validación local completada:** ~~Lint y typecheck focalizados en los módulos modificados, diagnósticos de los archivos tocados y comprobaciones de validación del backend.~~
- **Pendiente para cerrar fase:** Probar en integración el flujo UI/API con backend y Oracle activos; verificar CRUD, aislamiento entre dos usuarios, activación/reactivación y límite de cinco contactos activos. El typecheck global del frontend también requiere corregir el error de sintaxis preexistente en `frontend/src/components/app-sidebar.tsx`.
- **Criterio de salida:** Implementación de backend y UI disponible; fase pendiente de cierre hasta que pasen las pruebas de API/UI en integración y se verifique que un usuario no puede leer o cambiar contactos ajenos.

## Fase 3: Botón y registro de emergencia

**Objetivo:** Registrar una alerta durante una ruta en curso y notificar a cada contacto con trazabilidad.

- **Alcance acordado con el contrato API:** Esta primera versión no persiste alertas, no incluye historial y no crea tablas ni worker/outbox. Envía un correo individual por contacto activo y devuelve el estado agregado y el resultado por contacto. La aceptación del proveedor no garantiza que el destinatario lo haya leído.
- **Desarrollador 1, backend:** Verifica participación de conductor o pasajero con solicitud aceptada y cupo reservado; solo permite alertas en `EN_CURSO`; valida coordenadas opcionales, exige contactos activos y envía correos individuales con plantilla HTML escapada. Aplica `Idempotency-Key` por diez minutos y un límite de una activación cada 30 segundos por usuario/ruta.
- **Desarrollador 2, frontend:** Agrega confirmación explícita y solicitud de geolocalización opcional en las rutas en curso. La denegación o indisponibilidad del GPS no bloquea el envío; muestra el resultado agregado y cuántos correos fallaron. El conductor necesita una transición autorizada `ACTIVA` → `EN_CURSO` para habilitar la alerta.
- **Desarrollador 3, datos:** No hay migración para esta entrega; se reutilizan `CONTACTO_EMERGENCIA`, `RUTA`, `SOLICITUD_CUPO` y `CUPO_RUTA`.
- **Endpoints:** `POST /api/routes/:id/iniciar` para que el conductor dueño pase una ruta de `ACTIVA` a `EN_CURSO`; `POST /api/routes/:id/emergencias` para enviar la alerta. No se ofrecen endpoints de historial.
- **Limitación operativa:** La idempotencia y el rate limit se guardan en memoria; no se comparten entre instancias y se pierden al reiniciar el backend. Si el despliegue requiere réplicas, migrar a almacenamiento compartido antes de escalar.
- **Validaciones y pruebas:** Probar no participante, ruta inexistente/fuera de curso, duplicado con misma clave, conflicto de clave, rate limit, GPS denegado, cero contactos activos, envío parcial y fallo SMTP.
- **Criterio de salida:** Solo participantes en una ruta en curso pueden activar la alerta; GPS ausente no la bloquea; cada contacto recibe un correo separado y el frontend distingue `ENVIADO` de `ERROR`.

## Fase 4: Gestión de conductores favoritos

**Objetivo:** Guardar, eliminar y consultar conductores favoritos de forma privada e idempotente.

- **Desarrollador 1, backend/revisión:** ~~Implementa `favorito.controller.js` y `favorito.routes.js`, montados bajo `/api/usuario/conductores-favoritos`. La identidad y el rol pasajero se obtienen del JWT; la lista y las modificaciones quedan limitadas al usuario autenticado.~~ El alta repetida tiene respuesta de éxito idempotente en la implementación local; falta verificarla contra Oracle.
- **Desarrollador 2, frontend:** ~~Implementa la página `/dashboard/passenger/favoritos`, la lista de favoritos y candidatos con estados de carga, vacío y error, selección y alta múltiple, y eliminación con confirmación. Añade la página al menú dinámico del pasajero, con el marco de sidebar/header y un icono propio.~~
- **Desarrollador 3, datos y backend:** ~~Crea `FAVORITO_CONDUCTOR` y `SEQ_FAVORITO_CONDUCTOR`, sus claves foráneas, unicidad usuario-conductor e índice por conductor en los scripts 9, 10 y 11; los módulos se ejecutaron correctamente según el registro recibido. Añade la entrada de menú para el perfil pasajero mediante `13script_Menu_Conductores_Favoritos.sql`; el usuario confirmó que aparece y navega.~~
- **Endpoints implementados:** `GET /api/usuario/conductores-favoritos`, `GET /api/usuario/conductores-favoritos/candidatos`, `POST /api/usuario/conductores-favoritos` con body `{ idsUpeConductor: number[] }`, `DELETE /api/usuario/conductores-favoritos/:idUpe`.
- **Validaciones implementadas:** ~~Requiere pasajero autenticado; obtiene el propietario del JWT; limita altas a perfiles de conductor relacionados con viajes aceptados y cupos válidos; rechaza auto-favoritos e IDs inválidos; limita altas múltiples a 50 y restringe bajas al propietario.~~
- **Pendiente de integración:** El usuario confirmó que ve la vista y puede agregar un conductor. Probar en backend y Oracle las lecturas, candidatos, baja, aislamiento entre usuarios, recarga de la lista y alta repetida.
- **Criterio de salida:** Pendiente hasta que pasen las pruebas de integración y la operación de alta repetida se comporte de forma idempotente; la relación usuario-conductor debe seguir siendo única en Oracle y no exponer datos privados.

## Fase 5: Detalle, viajes y solicitud desde favoritos

**Objetivo:** Mostrar información útil del conductor y permitir solicitar un viaje directamente desde sus rutas disponibles.

- **Estado de entrada:** El usuario confirmó que Favoritos, contactos y el flujo de emergencia actual funcionan en la prueba manual. Las pruebas negativas y de privacidad continúan siendo parte de la verificación de aceptación; no bloquean el diseño de esta fase.

### Orden de ejecución

1. **Cerrar el contrato y consultas backend — implementado localmente**
   - Implementar `GET /api/conductores/:idUpe` y `GET /api/conductores/:idUpe/viajes?estado=ACTIVA&limite=20&cursor=`.
   - Validar que `idUpe` sea entero positivo y corresponda a un perfil `CONDUCTOR`.
   - Perfil público: `idUpe`, nombre visible, foto pública si existe, calificación, estado de cuenta y total de viajes completados. No incluir documento, correo, teléfono ni identificadores de pasajeros.
   - Viajes: estados permitidos `ACTIVA`, `EN_CURSO` y `COMPLETADA`; límite por defecto 20 y máximo 50; cursor opaco con orden estable por fecha e ID. Rechazar filtros/límites inválidos con error claro.
   - Viajes actuales pueden mostrar salida/destino generalizados, fecha, cupos disponibles y precio. Viajes completados no muestran coordenadas precisas, pasajeros ni pagos.
   - Usar consultas parametrizadas y agregaciones/subconsultas para evitar N+1. El conteo usa rutas con estado `COMPLETADA`, que es la fuente actual de cierre en `route.controller.js`.
   - Implementación en `backend/controllers/conductores.controller.js` y `backend/routes/conductores.routes.js`; montaje en `backend/index.js`. Las lecturas se probaron contra Oracle con JWT y cinco perfiles de conductor; solo se serializaron los campos públicos acordados.

2. **Construir el detalle del conductor en Favoritos — implementado localmente**
   - Hacer clic en un favorito para abrir su detalle sin perder el contexto de navegación.
   - Mostrar estados de carga, error, perfil inexistente y perfil sin viajes.
   - Añadir filtros por estado y paginación con `nextCursor`; no solicitar todos los viajes de una vez.
   - Mantener la lista de favoritos y sus operaciones actuales sin regresiones.
   - La pantalla se integró en `frontend/src/components/favorite-drivers.tsx`; falta validación manual de navegación, filtros y paginación en navegador.

3. **Conectar las solicitudes al flujo existente — implementado localmente**
   - Ofrecer “Solicitar cupo” únicamente en rutas `ACTIVA` que aún tengan cupos.
   - Confirmar acción y, si el flujo actual lo requiere, recoger método de pago usando los mismos tipos/validaciones existentes.
   - Reutilizar `POST /api/routes/:id/solicitudes`; no crear una ruta alternativa desde Favoritos.
   - Mostrar éxito, solicitud duplicada, ruta sin cupos, ruta cerrada y otros errores devueltos por la API.
   - La acción usa `POST /api/routes/:id/solicitudes`. El endpoint de reserva toma el precio canónico de `RUTA.PRECIO_CUPO_RUT` en vez de confiar en el precio enviado por el cliente. No se creó una solicitud real porque no había una ruta futura disponible para una prueba no destructiva.

4. **Pruebas y cierre — pendiente**
   - Backend verificado: endpoint sin JWT (`401`), ID inválido, estados inválidos, límites fuera de rango, cursor inválido; endpoints autenticados consultados contra Oracle. Se validaron los campos permitidos del perfil, los tres filtros de estado y la ausencia de datos privados/cupo/precio en viajes completados. No había datos suficientes para una segunda página real.
   - Pendiente backend: ejercitar una reserva válida y sus rechazos (duplicada/propia/sin cupos) con una ruta y usuarios dedicados de integración; confirmar con la UI el precio mostrado frente al precio calculado por servidor.
   - UI: perfil sin viajes, lista vacía, carga/error, cambio de filtro, siguiente página y navegación de regreso a Favoritos.
   - Solicitudes: ruta disponible, sin cupos, completada, duplicada, conductor que solicita su propia ruta y usuario sin perfil pasajero.
   - Regresión pendiente: validar en navegador el listado, alta y baja de Favoritos; búsqueda de rutas y creación/aceptación de solicitudes ya existentes.

### Responsables y dependencias

- **Desarrollador 1, backend:** Contratos, autorización y endpoints de perfil/viajes. Depende de la verificación de las columnas reales de perfil, estado y foto.
- **Desarrollador 2, frontend:** Detalle del conductor y conexión de solicitud. Puede iniciar con fixtures del contrato; la integración final depende de los endpoints.
- **Desarrollador 3, consultas/datos:** Confirmar fuente de viajes completados, revisar índices y validar paginación/privacidad con el esquema Oracle; no se espera migración si las tablas actuales cubren el contrato.
- **Dependencias:** contrato API → consultas/endpoints → UI de detalle → solicitud reutilizada → pruebas de privacidad y regresión.

**Criterio de salida:** Desde Favoritos se abre un perfil público, se consultan viajes paginados sin filtrar datos privados y se puede solicitar una ruta elegible usando el endpoint existente. Todos los casos negativos y de regresión anteriores pasan.

## Matriz de dependencias y paralelismo

| Fase | Desarrollador 1 | Desarrollador 2 | Desarrollador 3 | Bloqueo para la siguiente fase |
|---|---|---|---|---|
| 1. Contratos | Contrato API y permisos | Flujos UI y tipos | Diseño de esquema | Contratos y modelo aprobados |
| 2. Contactos | API y autorización | Gestión de contactos UI | Tabla y restricciones | Migración + CRUD integrado |
| 3. Emergencia | API, email e idempotencia temporal | Botón, GPS opcional y estados UI | Reutiliza tablas actuales; sin migración | Participación, estado y entrega de correo verificados |
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
