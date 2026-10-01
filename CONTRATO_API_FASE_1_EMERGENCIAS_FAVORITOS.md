# Contrato API y datos: contactos, alerta de emergencia y conductores favoritos

**Estado:** Propuesta acordada para implementación  
**Alcance:** Contratos de backend, frontend y Oracle para la primera entrega de contactos de emergencia, botón de alerta, favoritos y consulta de conductores/viajes.  
**No incluye:** Historial persistente de emergencias ni pantalla/endpoints para consultar alertas anteriores.

## 1. Convenciones generales

- Base URL local: `http://localhost:4000`.
- Prefijos existentes: `/api/usuario` para funcionalidades del usuario y `/api/routes` para rutas y solicitudes. Se registra un router nuevo bajo `/api/conductores` para detalle y viajes públicos del conductor.
- Endpoints descritos requieren `Authorization: Bearer <JWT>`, salvo que se indique lo contrario.
- La identidad autenticada se obtiene del JWT validado por `authMiddleware`, usando `req.user.documento`. No aceptar del cliente documento del propietario, nombre del usuario que activa la emergencia ni identidad que pueda derivarse del servidor.
- Para identificar conductores se utiliza `USUARIO_PERFIL.ID_UPE` del perfil `CONDUCTOR`, no solo el documento, porque el usuario puede tener varios perfiles.
- Fechas y horas en JSON se expresan en ISO 8601 con zona horaria, por ejemplo `2026-09-26T14:30:00.000Z`. Oracle almacena con las convenciones locales del proyecto y el backend serializa a ISO 8601.
- Usar binds para todo valor SQL. No incluir contraseña, token, dirección de correo de contactos ni documentos personales en logs.
- Respuesta exitosa compatible con `successResponse` existente:

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {},
  "timestamp": "2026-09-26T14:30:00.000Z"
}
```

- Respuesta de error objetivo para estos endpoints:

```json
{
  "success": false,
  "message": "Descripción segura del error",
  "error": "CODIGO_ERROR",
  "timestamp": "2026-09-26T14:30:00.000Z"
}
```

- No devolver trazas SQL, stack traces, direcciones de correo de terceros ni detalles internos del proveedor de email.
- Los nombres JSON son `camelCase`; nombres de tablas/columnas Oracle siguen mayúsculas y sufijo abreviado de entidad del esquema actual.

## 2. Autorización

| Operación | Permitido | Denegado |
|---|---|---|
| Gestionar contactos | Usuario autenticado, únicamente sobre sus propios registros. | Cualquier intento de enviar/usar un documento propietario distinto del JWT o modificar el contacto de otra persona. |
| Activar emergencia | Conductor dueño de la ruta (`RUTA.ID_UPE_RUT`) o pasajero participante con solicitud `ACEPTADA` y/o cupo `RESERVADO` según la relación vigente del proyecto; además la ruta debe estar `EN_CURSO`. | Usuario sin JWT, no participante, participante de otra ruta, ruta inexistente o ruta no `EN_CURSO`. |
| Consultar alerta | No se ofrece consulta posterior: no existe historial de emergencias. La respuesta inmediata solo vuelve al usuario que realizó la petición. | No hay endpoint para listar alertas previas ni para consultar por ID posteriormente. |
| Gestionar favoritos | Usuario autenticado, solo su propia lista. | Propietario enviado en body/query o acceso a lista ajena. |
| Consultar conductor/viajes | Datos públicos permitidos de un perfil `CONDUCTOR`. | Documentos, correo privado, datos de pasajeros, pagos o ubicaciones precisas históricas. |
| Solicitar viaje desde favorito | Se reutilizan las validaciones del endpoint existente de solicitud. | No se crea un endpoint alternativo que evada validaciones de cupos/estado/perfil. |

**Nota de implementación:** en rutas de emergencia, verificar autorización y estado dentro de una consulta consistente. Resolver nombre del usuario y datos de ruta desde Oracle; nunca confiar en esos valores enviados por el navegador.

## 3. Contactos de emergencia

### Datos y reglas

La información funcional que ingresa el usuario se limita a:

- Nombre.
- Relación con el usuario.
- Correo electrónico.

Campos técnicos propuestos para `CONTACTO_EMERGENCIA`:

| Columna | Tipo sugerido | Regla |
|---|---|---|
| `ID_CEM` | `INTEGER` | PK, generado con `SEQ_CONTACTO_EMERGENCIA`. |
| `DOCUMENTO_USU_CEM` | `VARCHAR2(10 BYTE)` | FK a `USUARIO.DOCUMENTO_USU`; se asigna desde JWT. |
| `NOMBRE_CEM` | `VARCHAR2(100 BYTE)` | Obligatorio, trim, no vacío. |
| `RELACION_CEM` | `VARCHAR2(50 BYTE)` | Obligatorio, trim, no vacío. |
| `CORREO_CEM` | `VARCHAR2(150 BYTE)` | Obligatorio, normalizado a minúscula y validado. |
| `FECHA_CREACION_CEM` | `DATE DEFAULT SYSDATE` | Auditoría técnica; no editable desde cliente. |
| `ACTIVO_CEM` | `CHAR(1 BYTE) DEFAULT 'S'` | `'S'` activo, `'N'` inactivo. Los contactos existentes se migran como activos. |

Índices/restricciones: PK en `ID_CEM`, FK al propietario, unicidad de correo normalizado por propietario, check de `ACTIVO_CEM IN ('S', 'N')` y un índice para listar por `DOCUMENTO_USU_CEM`. La migración incremental `scripts/12script_Activar_Contactos_Emergencia.sql` agrega el estado sin borrar datos; las filas existentes quedan activas. Máximo de **5 contactos activos por usuario**; el límite debe quedar como constante configurable y contar solo registros con `ACTIVO_CEM = 'S'`. Los contactos inactivos se conservan, no reciben alertas y no ocupan cupo activo. El correo continúa siendo único por usuario incluso en contactos inactivos; eliminar físicamente el contacto libera el correo para reutilizarlo por ese mismo usuario. No se incluye teléfono.

### Endpoints

#### `GET /api/usuario/contactos-emergencia`

Lista exclusivamente los contactos del usuario autenticado. No admite parámetro de propietario.

Respuesta `200`:

```json
{
  "success": true,
  "message": "Contactos obtenidos correctamente",
  "data": [
    {
      "id": 41,
      "nombre": "Ana Pérez",
      "relacion": "Hermana",
      "correo": "ana@example.com",
      "activo": true
    }
  ],
  "timestamp": "2026-09-26T14:30:00.000Z"
}
```

#### `POST /api/usuario/contactos-emergencia`

Crea un contacto. No aceptar `documentoUsuario` ni `id` en el body.

Body:

```json
{
  "nombre": "Ana Pérez",
  "relacion": "Hermana",
  "correo": "ana@example.com"
}
```

El backend asigna `activo: true`; el cliente no puede elegir estado al crear.

Respuesta `201`: `data` contiene el contacto creado con `id`, `nombre`, `relacion`, `correo` y `activo`.

#### `PATCH /api/usuario/contactos-emergencia/:id`

Actualiza nombre, relación, correo o estado del contacto que pertenezca al usuario autenticado. Acepta uno o más campos permitidos; rechaza body vacío y campos desconocidos. Para activar/desactivar se envía `{"activo": true}` o `{"activo": false}`. La reactivación devuelve `409` si el propietario ya tiene cinco contactos activos. Activar un contacto no cambia su correo; el correo permanece reservado mientras exista el registro, incluso si está inactivo.

#### `DELETE /api/usuario/contactos-emergencia/:id`

Elimina físicamente el contacto si pertenece al usuario autenticado. Respuesta `200` con `data: { "id": 41, "eliminado": true }`. Contacto inexistente o ajeno devuelve el mismo `404` para no revelar existencia.

### Validaciones de contactos

- `nombre`: requerido, entre 1 y 100 caracteres tras trim.
- `relacion`: requerido, entre 1 y 50 caracteres tras trim.
- `correo`: requerido, máximo 150 caracteres, validación de formato, trim y lowercase antes de guardar.
- No permitir correo duplicado para el mismo usuario, comparando normalizado.
- Crear contactos siempre activos y rechazar la creación si el usuario ya tiene cinco activos.
- `activo` solo se acepta en `PATCH` y debe ser booleano; rechazar la reactivación que supere cinco contactos activos.
- Correo único por propietario entre contactos activos e inactivos; al eliminar físicamente el registro, el correo queda disponible para reutilización por ese propietario.
- El `id` de ruta debe ser entero positivo.
- Toda consulta/update/delete filtra simultáneamente por `ID_CEM` y el documento autenticado.

## 4. Botón de emergencia y contrato de envío

### Comportamiento acordado

- No se almacena una fila persistente de emergencia ni se habilita historial. No crear `EMERGENCIA_RUTA`, tabla de historial, endpoint de historial o pantalla de alertas anteriores.
- El endpoint genera un correo separado para cada contacto, para no revelar los destinatarios entre sí.
- El servidor determina el nombre del usuario, conductor, ruta y fecha. El mensaje mostrado abajo es genérico y no editable por el cliente.
- Se envían contexto de ruta y ubicación actual si el dispositivo la facilita; si GPS no está disponible, la alerta se envía igualmente con la ubicación marcada como no disponible y con el origen/destino conocido de la ruta cuando exista.
- La petición espera los resultados del proveedor de correo con timeout acotado por destinatario y devuelve un resultado inmediato por contacto. Un envío parcial no se disfraza como éxito total.
- No se realiza reintento automático ni persistente en esta versión: sin historial/cola duradera no habría fuente para garantizar reintentos. El cliente puede informar cuáles envíos fallaron y pedir al usuario que contacte por otro medio. Evitar reenvío involuntario por reintento HTTP mediante `Idempotency-Key` en caché compartida con TTL de 10 minutos. Si no hay Redis/caché distribuida disponible, documentar que la deduplicación solo es de instancia y no se garantiza entre réplicas.

### Plantilla del mensaje

Texto fijo del cuerpo:

> Algo ha salido mal con el viaje de **{nombreUsuario}**. Contáctate con esta persona lo antes posible y verifica que todo se encuentre bien.\n\n- Equipo de VamosPuesDrive

El correo puede añadir debajo un bloque de contexto: identificador de ruta, origen/destino conocidos, fecha/hora del servidor y coordenadas GPS actuales si el usuario las autorizó. No enviar enlaces externos que incorporen datos sensibles. Escapar nombre y valores dinámicos antes de interpolarlos en HTML. Mostrar ubicación con precisión limitada en el correo; no persistir coordenadas.

### `POST /api/routes/:id/emergencias`

Autenticado. Body opcional de ubicación; no recibe nombre, email de destinatarios ni mensaje libre.

```json
{
  "ubicacion": {
    "latitud": 6.251839,
    "longitud": -75.581228
  }
}
```

Enviar `Idempotency-Key: <UUID>` en header. No enviar `ubicacion` o enviarla como `null` cuando no se obtuvo GPS.

Respuesta `200` cuando la petición fue procesada, incluso si uno o más correos fallaron. `estado` representa el resultado agregado: `ENVIADO` solo si todos los destinatarios recibieron aceptación del proveedor; `ERROR` si falló al menos uno. Cada resultado individual usa los mismos estados.

```json
{
  "success": true,
  "message": "Resultado del envío de emergencia",
  "data": {
    "rutaId": 82,
    "estado": "ERROR",
    "fecha": "2026-09-26T14:30:00.000Z",
    "ubicacionIncluida": true,
    "destinatarios": [
      { "contactoId": 41, "estado": "ENVIADO" },
      { "contactoId": 42, "estado": "ERROR" }
    ]
  },
  "timestamp": "2026-09-26T14:30:05.000Z"
}
```

No incluir correo del contacto ni error interno de SMTP en la respuesta. El frontend debe mostrar estado agregado y cantidad de envíos fallidos. La aceptación SMTP significa que el proveedor aceptó el correo, no que el destinatario lo haya leído.

### Validación y seguridad de emergencia

- `:id` entero positivo; ruta existente y `ESTADO_RUTA.NOMBRE_ERU = 'EN_CURSO'`.
- Autorizar conductor dueño o pasajero con reserva/solicitud confirmada conforme al estado existente. Definir con una prueba de integración cuál de `SOLICITUD_CUPO.ACEPTADA` y `CUPO_RUTA.RESERVADO` es la fuente de verdad; aceptar ambas solo si se comprueba que representan la misma participación vigente.
- Debe existir al menos un contacto. Si no, `409 CONTACTOS_NO_CONFIGURADOS`; la UI ofrece navegar a configuración, pero no bloquea la edición de contactos por iniciar una ruta.
- El envío selecciona exclusivamente contactos del propietario con `ACTIVO_CEM = 'S'`; los inactivos nunca reciben alertas. Si no hay contactos activos, responder `409 CONTACTOS_NO_CONFIGURADOS`.
- `latitud` y `longitud` deben estar ambas presentes o ambas ausentes; latitud `[-90, 90]`, longitud `[-180, 180]`.
- Limitar tasa, inicialmente a una activación cada 30 segundos por usuario y ruta, además de deduplicación idempotente. La emergencia no debe tener un mecanismo que permita enviar correo arbitrario a emails proporcionados por el cliente.
- Enviar un correo por contacto con timeout máximo acotado; ejecutar concurrencia limitada y recopilar resultados con `Promise.allSettled` o equivalente.
- No usar los destinatarios como `To` visibles en un mismo correo. No incluir documento del usuario.
- Plantilla HTML escapa todas las variables. Usar `EMAIL_USER`/`EMAIL_PASSWORD` desde secretos del entorno; nunca devolver contenido SMTP.
- Si falla el email de todos los contactos, el backend devuelve la respuesta de negocio con `estado: ERROR`; fallos de validación/autorización mantienen su código HTTP correspondiente.

## 5. Estados y códigos HTTP

Estados de emergencia acordados (sin persistencia):

- `ENVIADO`: todos los contactos activos/configurados recibieron aceptación del proveedor.
- `ERROR`: uno o más envíos fallaron o expiraron; el campo por destinatario permite identificar cuántos, no expone el correo.

| HTTP | Código de error | Uso |
|---|---|---|
| `400` | `DATOS_INVALIDOS` | Campos mal formados, coordenadas parciales/fuera de rango o body con campos no permitidos. |
| `401` | `NO_AUTENTICADO` | JWT ausente, inválido o expirado. |
| `403` | `SIN_PERMISO` | No participa como usuario habilitado en la ruta. |
| `404` | `NO_ENCONTRADO` | Ruta/contacto inexistente; contacto ajeno se comporta como inexistente. |
| `409` | `CONTACTOS_NO_CONFIGURADOS`, `LIMITE_CONTACTOS_ACTIVOS`, `CORREO_DUPLICADO`, `ESTADO_NO_VALIDO`, `CONFLICTO_IDEMPOTENCIA` | No hay contactos activos, se excede el máximo de cinco activos, el correo ya está reservado por ese propietario, la ruta no está `EN_CURSO` o hay conflicto de idempotencia. |
| `429` | `LIMITE_FRECUENCIA` | Frecuencia de activación de emergencia alcanzada. |
| `500` | `ERROR_INTERNO` | Falla inesperada antes de poder formar un resultado de negocio. |

Un fallo de email no usa `500` si el servidor sí pudo procesar todos los intentos y reportar el resultado: devuelve `200` con estado `ERROR` parcial o total.

## 6. Favoritos

### Tabla propuesta

`FAVORITO_CONDUCTOR`:

| Columna | Tipo sugerido | Regla |
|---|---|---|
| `ID_FCO` | `INTEGER` | PK con `SEQ_FAVORITO_CONDUCTOR`. |
| `DOCUMENTO_USU_FCO` | `VARCHAR2(10 BYTE)` | FK a usuario que guarda el favorito; propietario del JWT. |
| `ID_UPE_CONDUCTOR_FCO` | `INTEGER` | FK a `USUARIO_PERFIL.ID_UPE`, debe corresponder al perfil `CONDUCTOR`. |
| `FECHA_CREACION_FCO` | `DATE DEFAULT SYSDATE` | No editable por cliente. |

Crear unique constraint para `(DOCUMENTO_USU_FCO, ID_UPE_CONDUCTOR_FCO)` e índices útiles para listar por documento. La operación repetida de alta debe ser idempotente y devolver el favorito existente como éxito; la baja repetida puede responder `204` o `200` con `eliminado: false`, y se debe elegir una sola convención durante implementación.

### Endpoints

#### `GET /api/usuario/conductores-favoritos`

Devuelve la lista del usuario autenticado con identificador `idUpe`, nombre público, foto pública si está disponible, calificación y estado de usuario. Orden por fecha de alta descendente.

#### `POST /api/usuario/conductores-favoritos/:idUpe`

Guarda un perfil conductor. Sin body de propietario. Respuesta `201` si se creó o `200` si ya existía, con `{ idUpe, favorito: true }`.

#### `DELETE /api/usuario/conductores-favoritos/:idUpe`

Elimina solamente la relación del usuario autenticado. No borra al conductor ni sus rutas.

### Validaciones

- `idUpe` entero positivo y existente.
- Confirmar el perfil relacionado en `PERFIL` como `CONDUCTOR`.
- Rechazar que el perfil objetivo corresponda al mismo documento del usuario autenticado.
- Nunca aceptar `DOCUMENTO_USU_FCO` desde el cliente.
- Evitar duplicados tanto en servicio como con restricción única Oracle para cubrir concurrencia.

## 7. Detalle de conductor, viajes y solicitud

### `GET /api/conductores/:idUpe`

Autenticado. Devuelve solo información pública del perfil conductor: `idUpe`, nombre visible, foto pública si existe, calificación, estado de cuenta y resumen de viajes. No devuelve documento, correo, teléfono ni identificadores internos de pasajeros.

Ejemplo `data`:

```json
{
  "idUpe": 120,
  "nombre": "Luis Pérez",
  "fotoUrl": "https://storage.example/perfil.jpg",
  "calificacion": 4.8,
  "estado": "ACTIVO",
  "viajesCompletados": 15
}
```

### `GET /api/conductores/:idUpe/viajes?estado=ACTIVA&limite=20&cursor=`

Devuelve rutas actuales `ACTIVA`/`EN_CURSO` y viajes terminados disponibles públicamente. `estado` solo acepta `ACTIVA`, `EN_CURSO` o `COMPLETADA`; `limite` default 20, máximo 50; cursor opaco. Orden estable por fecha e ID para permitir paginación. Las rutas futuras pueden incluir origen/destino generalizados y salida; historial completado no expone coordenadas precisas, pasajeros o pago.

Respuesta de lista:

```json
{
  "success": true,
  "message": "Viajes obtenidos correctamente",
  "data": {
    "items": [
      {
        "rutaId": 82,
        "estado": "ACTIVA",
        "salida": "San Cristóbal",
        "destino": "Politécnico",
        "fechaSalida": "2026-09-27T12:15:00.000Z",
        "cuposDisponibles": 2,
        "precio": 8500
      }
    ],
    "nextCursor": null
  },
  "timestamp": "2026-09-26T14:30:00.000Z"
}
```

Para nuevas solicitudes, reutilizar `POST /api/routes/:id/solicitudes` con el contrato vigente del proyecto. No se agrega `/favoritos/:idUpe/solicitar`. Validaciones servidor: perfil pasajero, no ser conductor de esa ruta, ruta `ACTIVA`, cupos disponibles, no tener solicitud vigente duplicada, monto/método de pago válidos.

## 8. Contratos de validación y pruebas de aceptación

- JWT: sin token, token expirado y usuario autenticado.
- Contactos: alta válida; nombre/relación vacíos; correo inválido; correo duplicado con diferencia de mayúsculas; máximo de cinco; editar/eliminar propio; leer/editar/eliminar contacto ajeno.
- Emergencia: conductor participante; pasajero con cupo confirmado; pasajero pendiente; no participante; ruta inexistente; ruta `ACTIVA`, `COMPLETADA` o `CANCELADA`; sin contactos; GPS permitido/denegado/coordenadas inválidas; todos los envíos exitosos; éxito parcial; todos fallidos; timeout SMTP; reintento HTTP con misma clave idempotente; límite de frecuencia; destinatarios no visibles entre sí.
- Favoritos: alta nueva, alta repetida, baja, baja repetida, perfil pasajero, perfil inexistente, auto-favorito, lista de otro usuario, intentos concurrentes de alta.
- Detalle/viajes: perfil conductor existente/no existente, estados permitidos/no permitidos, página vacía y paginación estable, privacidad de viajes completados.
- Solicitud desde lista de favoritos: reutiliza la ruta real; probar cupo disponible, sin cupo, ruta completada, solicitud duplicada y solicitud del propio conductor.
- Regresión: búsqueda/creación/finalización de rutas y solicitudes existentes no cambian de comportamiento.

## 9. Decisiones que deben cerrar los tres desarrolladores antes del merge

1. Confirmar la fuente exacta de participación válida del pasajero entre `SOLICITUD_CUPO` aceptada y `CUPO_RUTA` reservado, usando el comportamiento implementado actualmente.
2. Confirmar que en primera versión no se guarda ninguna emergencia ni resultado de email en Oracle. Los estados `ENVIADO`/`ERROR` existen solo en la respuesta inmediata.
3. Confirmar proveedor de cache distribuida para `Idempotency-Key`. Si no está disponible, documentar la garantía limitada y no afirmar idempotencia entre múltiples instancias.
4. Confirmar límite inicial de cinco contactos por usuario y unicidad de correo por usuario.
5. Acordar contrato de eliminación repetida de favorito (`204` o `200`) y mantenerlo en backend/frontend.
6. Confirmar precisión/representación de ubicación en correo y que la geolocalización no es requisito para disparar la alerta.
7. Desarrollador de backend valida contrato y permisos; frontend valida cuerpos, estados y errores; datos valida nombres, tipos, FK, restricciones e índices antes de iniciar implementación paralela.
