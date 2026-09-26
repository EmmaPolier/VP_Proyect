-- =====================================================
-- SCRIPT 11: INDICES - CONTACTOS Y FAVORITOS
-- Ejecutar despues de 10script_Constraints_Contactos_Favoritos_VamonosPues.sql
-- =====================================================

-- La unicidad (DOCUMENTO_USU_CEM, CORREO_CEM) ya crea un indice util
-- para listar los contactos de un usuario.

-- Facilita buscar los usuarios que marcaron como favorito a un conductor.
CREATE INDEX IDX_FCO_CONDUCTOR
    ON FAVORITO_CONDUCTOR (ID_UPE_CONDUCTOR_FCO)
    TABLESPACE TS_VamonosPues;

prompt =====================================================
prompt Modulo 11 ejecutado: Indices Contactos y Favoritos
prompt =====================================================