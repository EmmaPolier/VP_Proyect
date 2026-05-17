-- =====================================================
-- SECCIÓN 1: LIMPIAR DATOS EXISTENTES
-- =====================================================

DELETE FROM MENU_PERFIL;
DELETE FROM MENU;

COMMIT;


-- =====================================================
-- SECCIÓN 2: INSERTAR MENÚ - CONDUCTOR (IDs 1-7)
-- =====================================================

INSERT INTO MENU VALUES (1, '/driver/routes', 'Mis Rutas', NULL, 1);
INSERT INTO MENU VALUES (2, '/driver/requests', 'Solicitudes de Cupo', NULL, 2);
INSERT INTO MENU VALUES (3, '/driver/vehicles', 'Mis Vehículos', NULL, 3);
INSERT INTO MENU VALUES (4, '/driver/wallet', 'Cartera / Saldo', NULL, 4);
INSERT INTO MENU VALUES (5, '/driver/history', 'Historial de Viajes', NULL, 5);
INSERT INTO MENU VALUES (6, '/driver/profile', 'Mi Perfil', NULL, 6);
INSERT INTO MENU VALUES (7, '/driver/settings', 'Configuración', NULL, 7);


-- =====================================================
-- SECCIÓN 3: INSERTAR MENÚ - PASAJERO (IDs 8-13)
-- =====================================================

INSERT INTO MENU VALUES (8, '/passenger/search', 'Buscar Rutas', NULL, 1);
INSERT INTO MENU VALUES (9, '/passenger/my-trips', 'Mis Viajes', NULL, 2);
INSERT INTO MENU VALUES (10, '/passenger/requests', 'Mis Solicitudes', NULL, 3);
INSERT INTO MENU VALUES (11, '/passenger/wallet', 'Cartera / Saldo', NULL, 4);
INSERT INTO MENU VALUES (12, '/passenger/profile', 'Mi Perfil', NULL, 5);
INSERT INTO MENU VALUES (13, '/passenger/settings', 'Configuración', NULL, 6);


-- =====================================================
-- SECCIÓN 4: INSERTAR MENÚ - ADMIN (IDs 14-20)
-- =====================================================

INSERT INTO MENU VALUES (14, '/admin/users', 'Gestión de Usuarios', NULL, 1);
INSERT INTO MENU VALUES (15, '/admin/vehicles', 'Gestión de Vehículos', NULL, 2);
INSERT INTO MENU VALUES (16, '/admin/routes', 'Gestión de Rutas', NULL, 3);
INSERT INTO MENU VALUES (17, '/admin/requests', 'Gestión de Solicitudes', NULL, 4);
INSERT INTO MENU VALUES (18, '/admin/catalogs', 'Catálogos', NULL, 5);
INSERT INTO MENU VALUES (19, '/admin/reports', 'Reportes', NULL, 6);
INSERT INTO MENU VALUES (20, '/admin/settings', 'Configuración', NULL, 7);

COMMIT;


-- =====================================================
-- SECCIÓN 5: PERMISOS CONDUCTOR (ID_PERFIL = 2)
-- =====================================================

-- Mis Rutas: CREATE, READ, UPDATE, DELETE
INSERT INTO MENU_PERFIL VALUES (1, 2, 'S', 'S', 'S', 'S');

-- Solicitudes de Cupo: READ, UPDATE
INSERT INTO MENU_PERFIL VALUES (2, 2, 'N', 'S', 'N', 'S');

-- Mis Vehículos: CREATE, READ, UPDATE, DELETE
INSERT INTO MENU_PERFIL VALUES (3, 2, 'S', 'S', 'S', 'S');

-- Cartera / Saldo: CREATE (recargar), READ
INSERT INTO MENU_PERFIL VALUES (4, 2, 'S', 'N', 'N', 'S');

-- Historial de Viajes: READ
INSERT INTO MENU_PERFIL VALUES (5, 2, 'N', 'N', 'N', 'S');

-- Mi Perfil: READ, UPDATE
INSERT INTO MENU_PERFIL VALUES (6, 2, 'N', 'S', 'N', 'S');

-- Configuración: READ, UPDATE
INSERT INTO MENU_PERFIL VALUES (7, 2, 'N', 'S', 'N', 'S');


-- =====================================================
-- SECCIÓN 6: PERMISOS PASAJERO (ID_PERFIL = 1)
-- =====================================================

-- Buscar Rutas: READ
INSERT INTO MENU_PERFIL VALUES (8, 1, 'N', 'N', 'N', 'S');

-- Mis Viajes: READ
INSERT INTO MENU_PERFIL VALUES (9, 1, 'N', 'N', 'N', 'S');

-- Mis Solicitudes: CREATE, READ, UPDATE, DELETE
INSERT INTO MENU_PERFIL VALUES (10, 1, 'S', 'S', 'S', 'S');

-- Cartera / Saldo: CREATE (recargar), READ
INSERT INTO MENU_PERFIL VALUES (11, 1, 'S', 'N', 'N', 'S');

-- Mi Perfil: READ, UPDATE
INSERT INTO MENU_PERFIL VALUES (12, 1, 'N', 'S', 'N', 'S');

-- Configuración: READ, UPDATE
INSERT INTO MENU_PERFIL VALUES (13, 1, 'N', 'S', 'N', 'S');


-- =====================================================
-- SECCIÓN 7: PERMISOS ADMIN (ID_PERFIL = 3)
-- =====================================================

-- Gestión de Usuarios: CREATE, READ, UPDATE, DELETE
INSERT INTO MENU_PERFIL VALUES (14, 3, 'S', 'S', 'S', 'S');

-- Gestión de Vehículos: CREATE, READ, UPDATE, DELETE
INSERT INTO MENU_PERFIL VALUES (15, 3, 'S', 'S', 'S', 'S');

-- Gestión de Rutas: CREATE, READ, UPDATE, DELETE
INSERT INTO MENU_PERFIL VALUES (16, 3, 'S', 'S', 'S', 'S');

-- Gestión de Solicitudes: CREATE, READ, UPDATE, DELETE
INSERT INTO MENU_PERFIL VALUES (17, 3, 'S', 'S', 'S', 'S');

-- Catálogos: CREATE, READ, UPDATE, DELETE
INSERT INTO MENU_PERFIL VALUES (18, 3, 'S', 'S', 'S', 'S');

-- Reportes: READ
INSERT INTO MENU_PERFIL VALUES (19, 3, 'N', 'N', 'N', 'S');

-- Configuración: READ, UPDATE
INSERT INTO MENU_PERFIL VALUES (20, 3, 'N', 'S', 'N', 'S');

COMMIT;


-- =====================================================
-- RESUMEN DE DATOS
-- =====================================================

prompt
prompt =====================================================
prompt MENÚ CONDUCTOR (ID_PERFIL = 2)
prompt =====================================================
SELECT ID_MEN, NOMBRE_MEN, INSERT_MPE, UPDATE_MPE, DELETE_MPE, SELECT_MPE 
FROM MENU m
JOIN MENU_PERFIL mp ON m.ID_MEN = mp.ID_MENU_MPE
WHERE mp.ID_PERFIL_MPE = 2
ORDER BY m.ORDEN_MEN;

prompt
prompt =====================================================
prompt MENÚ PASAJERO (ID_PERFIL = 1)
prompt =====================================================
SELECT ID_MEN, NOMBRE_MEN, INSERT_MPE, UPDATE_MPE, DELETE_MPE, SELECT_MPE 
FROM MENU m
JOIN MENU_PERFIL mp ON m.ID_MEN = mp.ID_MENU_MPE
WHERE mp.ID_PERFIL_MPE = 1
ORDER BY m.ORDEN_MEN;

prompt
prompt =====================================================
prompt MENÚ ADMIN (ID_PERFIL = 3)
prompt =====================================================
SELECT ID_MEN, NOMBRE_MEN, INSERT_MPE, UPDATE_MPE, DELETE_MPE, SELECT_MPE 
FROM MENU m
JOIN MENU_PERFIL mp ON m.ID_MEN = mp.ID_MENU_MPE
WHERE mp.ID_PERFIL_MPE = 3
ORDER BY m.ORDEN_MEN;

prompt
prompt =====================================================
prompt Módulo 5 ejecutado: Menú y Permisos - VamonosPues
prompt =====================================================
