-- =====================================================
-- SCRIPT 9: TABLAS Y SECUENCIAS - CONTACTOS Y FAVORITOS
-- =====================================================
-- Migracion incremental. No elimina ni recrea objetos existentes.
-- Las alertas de emergencia no se persisten; no se crea tabla de historial.

-- Secuencias
CREATE SEQUENCE SEQ_CONTACTO_EMERGENCIA START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_FAVORITO_CONDUCTOR START WITH 1 INCREMENT BY 1 NOCACHE;

-- Contactos de emergencia configurados por cada usuario
CREATE TABLE CONTACTO_EMERGENCIA (
    ID_CEM              INTEGER,
    DOCUMENTO_USU_CEM   VARCHAR2(10 BYTE),-- sujeto a cambios
    NOMBRE_CEM          VARCHAR2(100 BYTE),
    RELACION_CEM        VARCHAR2(50 BYTE),
    CORREO_CEM          VARCHAR2(150 BYTE),
    FECHA_CREACION_CEM  DATE DEFAULT SYSDATE
) TABLESPACE TS_VamonosPues;

-- Conductores guardados como favoritos por cada usuario
CREATE TABLE FAVORITO_CONDUCTOR (
    ID_FCO                  INTEGER,
    DOCUMENTO_USU_FCO       VARCHAR2(10 BYTE),
    ID_UPE_CONDUCTOR_FCO    INTEGER,
    FECHA_CREACION_FCO      DATE DEFAULT SYSDATE
) TABLESPACE TS_VamonosPues;

prompt =====================================================
prompt Modulo 9 ejecutado: DDL Contactos y Favoritos
prompt =====================================================