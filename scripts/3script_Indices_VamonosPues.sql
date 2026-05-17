-- =====================================================
-- TABLA: USUARIO
-- =====================================================

-- IDX: ID_EST_USU
-- Por qué: Las consultas administrativas y el sistema de permisos
--          filtran frecuentemente por estado del usuario
--          (ej: traer solo ACTIVOS). FK a ESTADO_USUARIO.
CREATE INDEX IDX_USUARIO_ESTADO
    ON USUARIO (ID_EST_USU)
    TABLESPACE TS_VamonosPues; 

-- =====================================================
-- TABLA: USUARIO_PERFIL
-- =====================================================

-- IDX: DOCUMENTO_USU_UPE
-- Por qué: Cada vez que se carga el dashboard o se hace un JOIN
--          entre USUARIO y sus perfiles, se filtra por este campo.
--          Es la FK más consultada de la tabla y tiene alta
--          frecuencia de acceso en flujos de autenticación y perfil.
CREATE INDEX IDX_UPERFIL_DOCUMENTO
    ON USUARIO_PERFIL (DOCUMENTO_USU_UPE)
    TABLESPACE TS_VamonosPues;

-- IDX: ID_PER_UPE
-- Por qué: Filtrar "todos los conductores" o "todos los pasajeros"
--          es una operación frecuente para listados administrativos
--          y asignación de rutas. FK a PERFIL.
CREATE INDEX IDX_UPERFIL_PERFIL
    ON USUARIO_PERFIL (ID_PER_UPE)
    TABLESPACE TS_VamonosPues;


-- =====================================================
-- TABLA: VEHICULO
-- =====================================================

-- IDX: DOCUMENTO_USU_VEH
-- Por qué: Al cargar "mis vehículos" en el panel del conductor,
--          se filtra por el documento del propietario.
CREATE INDEX IDX_VEHICULO_CONDUCTOR
    ON VEHICULO (DOCUMENTO_USU_VEH)
    TABLESPACE TS_VamonosPues;


-- =====================================================
-- TABLA: RUTA
-- =====================================================

-- IDX: ID_EST_RUT
-- Por qué: La búsqueda de rutas disponibles siempre filtra por
--          estado = 'ACTIVA'. Es la condición WHERE más usada
--          en toda la aplicación (pantalla principal de búsqueda).
--          FK a ESTADO_RUTA.
CREATE INDEX IDX_RUTA_ESTADO
    ON RUTA (ID_EST_RUT)
    TABLESPACE TS_VamonosPues;


-- =====================================================
-- TABLA: SOLICITUD_CUPO
-- =====================================================

-- IDX: ID_RUT_SOL
-- Por qué: El conductor consulta "solicitudes de mi ruta X" filtrando
--          por esta FK. Con muchas solicitudes en el sistema, el
--          índice es crítico para la pantalla de gestión de solicitudes.
CREATE INDEX IDX_SOLICITUD_RUTA
    ON SOLICITUD_CUPO (ID_RUT_SOL)
    TABLESPACE TS_VamonosPues;

-- IDX: ID_UPE_SOL
-- Por qué: El pasajero consulta "mis solicitudes" filtrando por su
--          usuario-perfil. FK accedida en cada carga del historial
--          de solicitudes del pasajero.
CREATE INDEX IDX_SOLICITUD_PASAJERO
    ON SOLICITUD_CUPO (ID_UPE_SOL)
    TABLESPACE TS_VamonosPues;

-- IDX: ID_ESO_SOL
-- Por qué: Las consultas filtran solicitudes por estado
--          (PENDIENTE, ACEPTADA, etc.) tanto para el conductor
--          como para reportes administrativos.
CREATE INDEX IDX_SOLICITUD_ESTADO
    ON SOLICITUD_CUPO (ID_ESO_SOL)
    TABLESPACE TS_VamonosPues;


-- =====================================================
-- TABLA: HISTORIAL_VIAJE
-- =====================================================

-- IDX: DOCUMENTO_USU_HIS
-- Por qué: La pantalla "Mis viajes" del usuario filtra el historial
--          completo por su documento. Sin índice, se hace full scan
--          de toda la tabla que crecerá con cada viaje completado.
--          Es la columna de búsqueda principal de esta tabla.
CREATE INDEX IDX_HISTORIAL_USUARIO
    ON HISTORIAL_VIAJE (DOCUMENTO_USU_HIS)
    TABLESPACE TS_VamonosPues;

-- IDX: FECHA_VIAJE_HIS
-- Por qué: El historial se ordena y filtra por fecha (ej: viajes
--          del último mes). Rango de fechas sin índice requiere
--          full scan en tabla de alto volumen.
CREATE INDEX IDX_HISTORIAL_FECHA
    ON HISTORIAL_VIAJE (FECHA_VIAJE_HIS)
    TABLESPACE TS_VamonosPues;


-- =====================================================
-- TABLA: CALIFICACION
-- =====================================================

-- IDX: DOCUMENTO_CALIFICADO_CAL
-- Por qué: Para calcular el promedio de calificaciones de un usuario
--          (conductor o pasajero) se filtra por este campo. Es la
--          columna usada en el UPDATE de USUARIO_PERFIL.CALIFICACION_UPE
--          y en la vista de perfil público.
CREATE INDEX IDX_CALIFICACION_CALIFICADO
    ON CALIFICACION (DOCUMENTO_CALIFICADO_CAL)
    TABLESPACE TS_VamonosPues;

-- IDX: DOCUMENTO_CALIFICADOR_CAL
-- Por qué: Permite verificar si un usuario ya calificó un viaje
--          específico (evitar doble calificación). Consulta frecuente
--          en la lógica de negocio al finalizar un viaje.
CREATE INDEX IDX_CALIFICACION_CALIFICADOR
    ON CALIFICACION (DOCUMENTO_CALIFICADOR_CAL)
    TABLESPACE TS_VamonosPues;


-- =====================================================
-- TABLA: VERIFICACION_CORREO
-- =====================================================

-- IDX: DOCUMENTO_USU_VER + USADO_VER (compuesto)
-- Por qué: Al verificar un código, se busca el registro activo
--          (USADO_VER = 'N') de un usuario específico. Sin índice,
--          aunque la tabla no es grande ahora, el patrón de consulta
--          es MUY frecuente (cada registro y cada reenvío de código).
CREATE INDEX IDX_VERIFICACION_USU_USADO
    ON VERIFICACION_CORREO (DOCUMENTO_USU_VER, USADO_VER)
    TABLESPACE TS_VamonosPues;

-- IDX: FECHA_EXPIRACION_VER
-- Por qué: El proceso de limpieza de códigos expirados filtra
--          WHERE FECHA_EXPIRACION_VER < SYSDATE. También usado
--          para invalidar códigos vencidos en el flujo de login.
CREATE INDEX IDX_VERIFICACION_EXPIRACION
    ON VERIFICACION_CORREO (FECHA_EXPIRACION_VER)
    TABLESPACE TS_VamonosPues;


-- =====================================================
-- TABLA: TRANSACCIONES_CARTERA
-- =====================================================

-- IDX: DOCUMENTO_USU_TRA
-- Por qué: El estado de cuenta del usuario lista todas sus
--          transacciones filtrando por documento. Tabla de alto
--          volumen (crece con cada recarga, pago y reembolso).
CREATE INDEX IDX_TRANSACCION_USUARIO
    ON TRANSACCIONES_CARTERA (DOCUMENTO_USU_TRA)
    TABLESPACE TS_VamonosPues;

-- IDX: FECHA_REALIZACION_TRA
-- Por qué: Los extractos y reportes financieros filtran por rango
--          de fechas. Permite ordenar DESC eficientemente para
--          mostrar las transacciones más recientes primero.
CREATE INDEX IDX_TRANSACCION_FECHA
    ON TRANSACCIONES_CARTERA (FECHA_REALIZACION_TRA)
    TABLESPACE TS_VamonosPues;

-- IDX: ID_TTR_TRA
-- Por qué: Reportes por tipo de transacción (cuántas recargas,
--          cuántos pagos, cuántos reembolsos en el mes). FK usada
--          en GROUP BY y WHERE de reportes administrativos.
CREATE INDEX IDX_TRANSACCION_TIPO
    ON TRANSACCIONES_CARTERA (ID_TTR_TRA)
    TABLESPACE TS_VamonosPues;

prompt =====================================================
prompt Módulo 3 ejecutado: Índices - VamonosPues
prompt =====================================================