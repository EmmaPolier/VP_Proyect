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


prompt =====================================================
prompt Módulo 3 ejecutado: Índices - VamonosPues
prompt =====================================================