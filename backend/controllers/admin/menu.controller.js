/**
 * Controller para gestión de MENÚ
 * Tabla: MENU
 */

import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';

// GET all menús with pagination
export async function getAllMenus(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  let connection;
  try {
    connection = await getConnection();

    // Obtener total de registros
    const totalResult = await connection.execute(
      'SELECT COUNT(*) as total FROM MENU'
    );
    const total = totalResult.rows[0][0];

    // Obtener registros con paginación
    const result = await connection.execute(
      `SELECT ID_MEN, URL_MEN, NOMBRE_MEN, ID_PADRE_MEN, ORDEN_MEN 
       FROM MENU 
       ORDER BY ORDEN_MEN
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map(row => ({
      id: row[0],
      idMenu: row[0],
      url: row[1],
      nombre: row[2],
      idPadre: row[3],
      orden: row[4]
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Menús obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener menús', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// GET menú by ID
export async function getMenuById(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT ID_MEN, URL_MEN, NOMBRE_MEN, ID_PADRE_MEN, ORDEN_MEN 
       FROM MENU WHERE ID_MEN = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Menú no encontrado', 404);
    }

    const row = result.rows[0];
    const data = {
      id: row[0],
      idMenu: row[0],
      url: row[1],
      nombre: row[2],
      idPadre: row[3],
      orden: row[4]
    };

    successResponse(res, data, 'Menú obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener menú', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// CREATE menú
export async function createMenu(req, res) {
  const { url, nombre, idPadre, orden } = req.body;

  console.log('[DEBUG] Datos recibidos en createMenu:', { url, nombre, idPadre, orden });

  if (!url || !nombre) {
    return errorResponse(res, null, 'URL y nombre son requeridos', 400);
  }

  if (!orden) {
    return errorResponse(res, null, 'Orden es requerido', 400);
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar si ya existe una URL similar
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MENU WHERE URL_MEN = :url`,
      { url }
    );

    if (checkResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'Ya existe un menú con esta URL', 409);
    }

    // Obtener el próximo ID de la secuencia
    const seqResult = await connection.execute(
      `SELECT SEQ_MENU.NEXTVAL as nextId FROM DUAL`
    );
    const nextId = seqResult.rows[0][0];

    // Insertar con el ID obtenido
    await connection.execute(
      `INSERT INTO MENU (ID_MEN, URL_MEN, NOMBRE_MEN, ID_PADRE_MEN, ORDEN_MEN)
       VALUES (:id, :url, :nombre, :idPadre, :orden)`,
      { id: nextId, url, nombre, idPadre: idPadre || null, orden }
    );

    await connection.commit();
    successResponse(res, { id: nextId, url, nombre, idPadre, orden }, 'Menú creado exitosamente', 201);
  } catch (error) {
    console.error('[ERROR] Error en createMenu:', error);
    errorResponse(res, error, 'Error al crear menú', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// UPDATE menú
export async function updateMenu(req, res) {
  const { id } = req.params;
  const { url, nombre, idPadre, orden } = req.body;

  console.log('[DEBUG] Datos recibidos en updateMenu:', { id, url, nombre, idPadre, orden });

  if (!url || !nombre) {
    return errorResponse(res, null, 'URL y nombre son requeridos', 400);
  }

  if (!orden) {
    return errorResponse(res, null, 'Orden es requerido', 400);
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar si existe
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MENU WHERE ID_MEN = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Menú no encontrado', 404);
    }

    // Actualizar
    await connection.execute(
      `UPDATE MENU SET URL_MEN = :url, NOMBRE_MEN = :nombre, ID_PADRE_MEN = :idPadre, ORDEN_MEN = :orden 
       WHERE ID_MEN = :id`,
      { id, url, nombre, idPadre: idPadre || null, orden }
    );

    await connection.commit();
    successResponse(res, { id, url, nombre, idPadre, orden }, 'Menú actualizado exitosamente');
  } catch (error) {
    console.error('[ERROR] Error en updateMenu:', error);
    errorResponse(res, error, 'Error al actualizar menú', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// DELETE menú
export async function deleteMenu(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();

    // Verificar si existe
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MENU WHERE ID_MEN = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Menú no encontrado', 404);
    }

    // Verificar si hay permisos asociados
    const hasPermisos = await connection.execute(
      `SELECT COUNT(*) as count FROM MENU_PERFIL WHERE ID_MENU_MPE = :id`,
      { id }
    );

    if (hasPermisos.rows[0][0] > 0) {
      return errorResponse(res, null, 'No se puede eliminar un menú que tiene permisos asociados', 409);
    }

    // Eliminar
    await connection.execute(
      `DELETE FROM MENU WHERE ID_MEN = :id`,
      { id }
    );

    successResponse(res, { id }, 'Menú eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar menú', 500);
  } finally {
    if (connection) await connection.close();
  }
}
