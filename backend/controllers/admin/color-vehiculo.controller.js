/**
 * Controller para gestión de COLORES DE VEHÍCULO
 * Tabla: COLOR_VEHICULO
 */

import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateColorVehiculo } from '../../utils/validators.js';

export async function getAllColores(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  let connection;
  try {
    connection = await getConnection();

    const totalResult = await connection.execute('SELECT COUNT(*) as total FROM COLOR_VEHICULO');
    const total = totalResult.rows[0][0];

    const result = await connection.execute(
      `SELECT ID_COL, NOMBRE_COL FROM COLOR_VEHICULO 
       ORDER BY ID_COL
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map(row => ({
      id: row[0],
      nombre: row[1]
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Colores obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener colores', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getColorById(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT ID_COL, NOMBRE_COL FROM COLOR_VEHICULO WHERE ID_COL = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Color no encontrado', 404);
    }

    const row = result.rows[0];
    successResponse(res, { id: row[0], nombre: row[1] }, 'Color obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener color', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function createColor(req, res) {
  const { nombre } = req.body;

  const validation = validateColorVehiculo({ NOMBRE_COL: nombre });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM COLOR_VEHICULO WHERE NOMBRE_COL = :nombre`,
      { nombre }
    );

    if (checkResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'El color ya existe', 409);
    }

    const seqResult = await connection.execute(
      `SELECT SEQ_COLOR_VEHICULO.NEXTVAL as nextId FROM DUAL`
    );
    const nextId = seqResult.rows[0][0];

    await connection.execute(
      `INSERT INTO COLOR_VEHICULO (ID_COL, NOMBRE_COL)
       VALUES (:id, :nombre)`,
      { id: nextId, nombre }
    );

    successResponse(res, { id: nextId, nombre }, 'Color creado exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear color', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function updateColor(req, res) {
  const { id } = req.params;
  const { nombre } = req.body;

  const validation = validateColorVehiculo({ NOMBRE_COL: nombre });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM COLOR_VEHICULO WHERE ID_COL = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Color no encontrado', 404);
    }

    await connection.execute(
      `UPDATE COLOR_VEHICULO SET NOMBRE_COL = :nombre WHERE ID_COL = :id`,
      { id, nombre }
    );

    successResponse(res, { id, nombre }, 'Color actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar color', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function deleteColor(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM COLOR_VEHICULO WHERE ID_COL = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Color no encontrado', 404);
    }

    const vehicleCheck = await connection.execute(
      `SELECT COUNT(*) as count FROM VEHICULO WHERE ID_COL_VEH = :id`,
      { id }
    );

    if (vehicleCheck.rows[0][0] > 0) {
      return errorResponse(res, null, 'No se puede eliminar un color con vehículos registrados', 409);
    }

    await connection.execute(
      `DELETE FROM COLOR_VEHICULO WHERE ID_COL = :id`,
      { id }
    );

    successResponse(res, { id }, 'Color eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar color', 500);
  } finally {
    if (connection) await connection.close();
  }
}
