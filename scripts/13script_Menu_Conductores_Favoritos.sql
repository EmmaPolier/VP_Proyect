-- Agregar la opcion de conductores favoritos al menu del pasajero.
-- Puede ejecutarse mas de una vez sin duplicar menu ni permisos.

INSERT INTO MENU (ID_MEN, URL_MEN, NOMBRE_MEN, ID_PADRE_MEN, ORDEN_MEN)
SELECT SEQ_MENU.NEXTVAL,
       '/dashboard/passenger/favoritos',
       'Conductores favoritos',
       NULL,
       7
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1
    FROM MENU
    WHERE URL_MEN = '/dashboard/passenger/favoritos'
);

INSERT INTO MENU_PERFIL (
    ID_MENU_MPE,
    ID_PERFIL_MPE,
    INSERT_MPE,
    UPDATE_MPE,
    DELETE_MPE,
    SELECT_MPE
)
SELECT m.ID_MEN, 1, 'N', 'N', 'N', 'S'
FROM MENU m
WHERE m.URL_MEN = '/dashboard/passenger/favoritos'
  AND NOT EXISTS (
      SELECT 1
      FROM MENU_PERFIL mp
      WHERE mp.ID_MENU_MPE = m.ID_MEN
        AND mp.ID_PERFIL_MPE = 1
  );

COMMIT;