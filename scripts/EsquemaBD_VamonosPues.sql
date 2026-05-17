CLEAR SCREEN;

prompt ===============================================
prompt |   Esquema de la Base de Datos de VamonosPues |
prompt ===============================================

connect system/Emma2006

show con_name

ALTER SESSION SET CONTAINER=CDB$ROOT;
ALTER DATABASE OPEN;

DROP TABLESPACE ts_vamonospues INCLUDING CONTENTS and DATAFILES;

CREATE TABLESPACE ts_vamonospues LOGGING
DATAFILE 'C:\dev\VP_Proyect\Scripts\DF_VamonosPues.dbf' size 1000M
extent management local segment space management auto;

alter session set "_ORACLE_SCRIPT"=true; 


drop user us_vamonospues cascade;

CREATE user us_vamonospues profile default 
identified by 123456789
default tablespace ts_vamonospues
temporary tablespace temp 
account unlock;     

prompt Privilegios asignados correctamente al nuevo usuario VamonosPues.
grant connect, resource,dba to us_vamonospues; 


prompt Conectado como usuario us_vamonospues.
connect us_vamonospues/123456789


show user
