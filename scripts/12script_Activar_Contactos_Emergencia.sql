-- =====================================================
-- SCRIPT 12: ESTADO ACTIVO - CONTACTOS DE EMERGENCIA
-- Ejecutar despues de los scripts 9, 10 y 11.
-- Migracion incremental: conserva los contactos existentes como activos.
-- =====================================================

ALTER TABLE CONTACTO_EMERGENCIA
  ADD (ACTIVO_CEM CHAR(1 BYTE) DEFAULT 'S' NOT NULL);

ALTER TABLE CONTACTO_EMERGENCIA
  ADD CONSTRAINT CK_CEM_ACTIVO CHECK (ACTIVO_CEM IN ('S', 'N'));

prompt =====================================================
prompt Modulo 12 ejecutado: Estado activo de contactos
prompt =====================================================