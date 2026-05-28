-- =====================================================
-- SCRIPT: Limpieza y mantenimiento de VERIFICACION_CORREO
-- =====================================================
-- Propósito: Eliminar códigos OTP expirados y usados para mantener la tabla limpia
-- Ejecución: Ejecutar este script para limpiar registros antiguos
-- =====================================================

-- Paso 1: Eliminar códigos expirados (más de 10 minutos de antigüedad)
DELETE FROM VERIFICACION_CORREO 
WHERE FECHA_CREACION_VER < SYSDATE - (10/1440);  -- 10 minutos

-- Paso 2: Eliminar códigos marcados como usados que tengan más de 1 día
DELETE FROM VERIFICACION_CORREO 
WHERE USADO_VER = 'S' 
AND FECHA_CREACION_VER < SYSDATE - 1;

-- Paso 3: Commit de cambios
COMMIT;

-- Paso 4: Verificar registros pendientes
SELECT 
    ID_VER,
    DOCUMENTO_USU_VER,
    CODIGO_VER,
    FECHA_EXPIRACION_VER,
    USADO_VER,
    FECHA_CREACION_VER,
    TRUNC(SYSDATE - FECHA_CREACION_VER) as DIAS_ANTIGÜEDAD,
    ROUND((SYSDATE - FECHA_CREACION_VER) * 1440) as MINUTOS_ANTIGÜEDAD
FROM VERIFICACION_CORREO
ORDER BY FECHA_CREACION_VER DESC;

-- =====================================================
-- NOTA: Se recomienda ejecutar este script:
-- - Cada 24 horas vía Oracle Job
-- - O manualmente cuando sea necesario limpiar
-- 
-- Para crear un Job automático (opcional):
-- BEGIN
--   DBMS_SCHEDULER.CREATE_JOB (
--     job_name            => 'LIMPIEZA_VERIFICACION_CORREO',
--     job_type            => 'PLSQL_BLOCK',
--     job_action          => 'BEGIN
--                              DELETE FROM VERIFICACION_CORREO 
--                              WHERE FECHA_CREACION_VER < SYSDATE - (10/1440);
--                              DELETE FROM VERIFICACION_CORREO 
--                              WHERE USADO_VER = ''S'' 
--                              AND FECHA_CREACION_VER < SYSDATE - 1;
--                              COMMIT;
--                            END;',
--     repeat_interval     => 'FREQ=DAILY;BYHOUR=2;BYMINUTE=0;BYSECOND=0',
--     enabled             => TRUE
--   );
-- END;
-- /
-- =====================================================
