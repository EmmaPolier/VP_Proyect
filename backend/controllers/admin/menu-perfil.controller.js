/**
 * Controller para gestión de PERMISOS DE MENÚ (MENU_PERFIL)
 * Tabla: MENU_PERFIL
 */

import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';

// GET all permisos with pagination
export async function getAllPermisos(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  let connection;
  try {
    connection = await getConnection();

    // Obtener total de registros
    const totalResult = await connection.execute(
      'SELECT COUNT(*) as total FROM MENU_PERFIL'
    );
    const total = totalResult.rows[0][0];

    // Obtener registros con paginación (con JOINs para traer nombres)
    const result = await connection.execute(
      `SELECT mp.ID_MENU_MPE, m.ID_MEN, m.NOMBRE_MEN, p.ID_PER, p.NOMBRE_PER, 
              mp.INSERT_MPE, mp.UPDATE_MPE, mp.DELETE_MPE, mp.SELECT_MPE 
       FROM MENU_PERFIL mp
       INNER JOIN MENU m ON mp.ID_MENU_MPE = m.ID_MEN
       INNER JOIN PERFIL p ON mp.ID_PERFIL_MPE = p.ID_PER
       ORDER BY p.ID_PER, m.ORDEN_MEN
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map(row => ({
      id: `${row[0]}_${row[3]}`,
      idMenuPerfil: row[0],
      idMenu: row[1],
      nombreMenu: row[2],
      idPerfil: row[3],
      nombrePerfil: row[4],
      insert: row[5] === 'S',
      update: row[6] === 'S',
      delete: row[7] === 'S',
      select: row[8] === 'S'
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Permisos obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener permisos', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// GET permisos por perfil
export async function getPermisosByPerfil(req, res) {
  const { perfilId } = req.params;

  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT mp.ID_MENU_MPE, m.ID_MEN, m.NOMBRE_MEN, m.URL_MEN, 
              mp.INSERT_MPE, mp.UPDATE_MPE, mp.DELETE_MPE, mp.SELECT_MPE 
       FROM MENU_PERFIL mp
       INNER JOIN MENU m ON mp.ID_MENU_MPE = m.ID_MEN
       WHERE mp.ID_PERFIL_MPE = :perfilId
       ORDER BY m.ORDEN_MEN`,
      { perfilId }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'No hay permisos para este perfil', 404);
    }

    const data = result.rows.map(row => ({
      idMenuPerfil: row[0],
      idMenu: row[1],
      nombreMenu: row[2],
      url: row[3],
      insert: row[4] === 'S',
      update: row[5] === 'S',
      delete: row[6] === 'S',
      select: row[7] === 'S'
    }));

    successResponse(res, data, 'Permisos obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener permisos', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// GET permiso específico
export async function getPermisoById(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT mp.ID_MENU_MPE, m.ID_MEN, m.NOMBRE_MEN, p.ID_PER, p.NOMBRE_PER,
              mp.INSERT_MPE, mp.UPDATE_MPE, mp.DELETE_MPE, mp.SELECT_MPE 
       FROM MENU_PERFIL mp
       INNER JOIN MENU m ON mp.ID_MENU_MPE = m.ID_MEN
       INNER JOIN PERFIL p ON mp.ID_PERFIL_MPE = p.ID_PER
       WHERE mp.ID_MENU_MPE = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Permiso no encontrado', 404);
    }

    const row = result.rows[0];
    const data = {
      idMenuPerfil: row[0],
      idMenu: row[1],
      nombreMenu: row[2],
      idPerfil: row[3],
      nombrePerfil: row[4],
      insert: row[5] === 'S',
      update: row[6] === 'S',
      delete: row[7] === 'S',
      select: row[8] === 'S'
    };

    successResponse(res, data, 'Permiso obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener permiso', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// CREATE permiso
export async function createPermiso(req, res) {
  const { idMenu, idPerfil, insert, update, delete: deleteOp, select } = req.body;

  if (!idMenu || !idPerfil) {
    return errorResponse(res, null, 'ID del menú y del perfil son requeridos', 400);
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar que el menú existe
    const menuExists = await connection.execute(
      `SELECT COUNT(*) as count FROM MENU WHERE ID_MENU = :idMenu`,
      { idMenu }
    );

    if (menuExists.rows[0][0] === 0) {
      return errorResponse(res, null, 'El menú especificado no existe', 404);
    }

    // Verificar que el perfil existe
    const perfilExists = await connection.execute(
      `SELECT COUNT(*) as count FROM PERFIL WHERE ID_PERFIL = :idPerfil`,
      { idPerfil }
    );

    if (perfilExists.rows[0][0] === 0) {
      return errorResponse(res, null, 'El perfil especificado no existe', 404);
    }

    // Verificar si ya existe
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MENU_PERFIL 
       WHERE ID_MENU_MPE = :idMenu AND ID_PERFIL_MPE = :idPerfil`,
      { idMenu, idPerfil }
    );

    if (checkResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'Este permiso ya existe', 409);
    }

    // Convertir booleanos a 'S' o 'N'
    const insertVal = insert ? 'S' : 'N';
    const updateVal = update ? 'S' : 'N';
    const deleteVal = deleteOp ? 'S' : 'N';
    const selectVal = select ? 'S' : 'N';

    // Insertar
    await connection.execute(
      `INSERT INTO MENU_PERFIL (ID_MENU_MPE, ID_PERFIL_MPE, INSERT_MPE, UPDATE_MPE, DELETE_MPE, SELECT_MPE)
       VALUES (:idMenu, :idPerfil, :insertVal, :updateVal, :deleteVal, :selectVal)`,
      { idMenu, idPerfil, insertVal, updateVal, deleteVal, selectVal }
    );
    await connection.commit();

    successResponse(res, { idMenu, idPerfil, insert, update, delete: deleteOp, select }, 'Permiso creado exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear permiso', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// UPDATE permiso
export async function updatePermiso(req, res) {
  const { idMenu, idPerfil } = req.params;
  let { insert, update, delete: deleteOp, select, newIdPerfil } = req.body;

  // Convertir strings a booleanos si es necesario
  insert = insert === 'true' || insert === true;
  update = update === 'true' || update === true;
  deleteOp = deleteOp === 'true' || deleteOp === true;
  select = select === 'true' || select === true;

  console.log('UPDATE PERMISO - Parámetros recibidos:', {
    idMenu,
    idPerfil,
    insert,
    update,
    deleteOp,
    select,
    newIdPerfil,
  });

  let connection;
  try {
    connection = await getConnection();

    // Verificar si existe
    const checkResult = await connection.execute(
      `SELECT * FROM MENU_PERFIL 
       WHERE ID_MENU_MPE = :idMenu AND ID_PERFIL_MPE = :idPerfil`,
      { idMenu, idPerfil }
    );

    if (checkResult.rows.length === 0) {
      return errorResponse(res, null, 'Permiso no encontrado', 404);
    }

    // Convertir booleanos a 'S' o 'N'
    const insertVal = insert ? 'S' : 'N';
    const updateVal = update ? 'S' : 'N';
    const deleteVal = deleteOp ? 'S' : 'N';
    const selectVal = select ? 'S' : 'N';

    console.log('Valores convertidos:', { insertVal, updateVal, deleteVal, selectVal });

    // Si se intenta cambiar el perfil
    if (newIdPerfil && Number(newIdPerfil) !== Number(idPerfil)) {
      // Verificar que el nuevo perfil existe
      const perfilExists = await connection.execute(
        `SELECT COUNT(*) as count FROM PERFIL WHERE ID_PERFIL = :newIdPerfil`,
        { newIdPerfil }
      );

      if (perfilExists.rows[0][0] === 0) {
        return errorResponse(res, null, 'El nuevo perfil especificado no existe', 404);
      }

      // Verificar que no exista ya el permiso con el nuevo perfil
      const duplicateCheck = await connection.execute(
        `SELECT COUNT(*) as count FROM MENU_PERFIL 
         WHERE ID_MENU_MPE = :idMenu AND ID_PERFIL_MPE = :newIdPerfil`,
        { idMenu, newIdPerfil }
      );

      if (duplicateCheck.rows[0][0] > 0) {
        return errorResponse(res, null, 'Ya existe un permiso para este menú en el nuevo perfil', 409);
      }

      console.log('Cambio de perfil - Eliminando registro antiguo');
      // Eliminar el registro antiguo
      await connection.execute(
        `DELETE FROM MENU_PERFIL 
         WHERE ID_MENU_MPE = :idMenu AND ID_PERFIL_MPE = :idPerfil`,
        { idMenu, idPerfil }
      );

      console.log('Cambio de perfil - Insertando nuevo registro');
      // Insertar el nuevo registro con el nuevo perfil
      await connection.execute(
        `INSERT INTO MENU_PERFIL (ID_MENU_MPE, ID_PERFIL_MPE, INSERT_MPE, UPDATE_MPE, DELETE_MPE, SELECT_MPE)
         VALUES (:idMenu, :newIdPerfil, :insertVal, :updateVal, :deleteVal, :selectVal)`,
        { idMenu, newIdPerfil, insertVal, updateVal, deleteVal, selectVal }
      );
    } else {
      console.log('Solo actualizar permisos');
      // Solo actualizar permisos
      const updateResult = await connection.execute(
        `UPDATE MENU_PERFIL SET INSERT_MPE = :insertVal, UPDATE_MPE = :updateVal, DELETE_MPE = :deleteVal, SELECT_MPE = :selectVal 
         WHERE ID_MENU_MPE = :idMenu AND ID_PERFIL_MPE = :idPerfil`,
        { idMenu, idPerfil, insertVal, updateVal, deleteVal, selectVal }
      );
      console.log('Resultado de UPDATE - Filas afectadas:', updateResult.rowsAffected);
    }

    await connection.commit();
    console.log('Cambios committeados exitosamente');

    const finalIdPerfil = newIdPerfil && Number(newIdPerfil) !== Number(idPerfil) ? newIdPerfil : idPerfil;
    successResponse(res, { 
      idMenu, 
      idPerfil: finalIdPerfil, 
      insert, 
      update, 
      delete: deleteOp, 
      select 
    }, 'Permiso actualizado exitosamente');
  } catch (error) {
    console.error('Error en updatePermiso:', error);
    errorResponse(res, error, 'Error al actualizar permiso', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// DELETE permiso
export async function deletePermiso(req, res) {
  const { idMenu, idPerfil } = req.params;

  let connection;
  try {
    connection = await getConnection();

    // Verificar si existe
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MENU_PERFIL 
       WHERE ID_MENU_MPE = :idMenu AND ID_PERFIL_MPE = :idPerfil`,
      { idMenu, idPerfil }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Permiso no encontrado', 404);
    }

    // Eliminar
    await connection.execute(
      `DELETE FROM MENU_PERFIL WHERE ID_MENU_MPE = :idMenu AND ID_PERFIL_MPE = :idPerfil`,
      { idMenu, idPerfil }
    );
    await connection.commit();

    successResponse(res, { idMenu, idPerfil }, 'Permiso eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar permiso', 500);
  } finally {
    if (connection) await connection.close();
  }
}
