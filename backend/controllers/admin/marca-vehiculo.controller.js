/**
 * Controller para gestión de MARCAS DE VEHÍCULO
 * Tabla: MARCA_VEHICULO
 */

import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateMarcaVehiculo } from '../../utils/validators.js';

export async function getAllMarcas(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  let connection;
  try {
    connection = await getConnection();

    const totalResult = await connection.execute('SELECT COUNT(*) as total FROM MARCA_VEHICULO');
    const total = totalResult.rows[0][0];

    const result = await connection.execute(
      `SELECT ID_MAR, NOMBRE_MAR FROM MARCA_VEHICULO 
       ORDER BY ID_MAR
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map(row => ({
      id: row[0],
      nombre: row[1]
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Marcas obtenidas exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener marcas', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getMarcaById(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT ID_MAR, NOMBRE_MAR FROM MARCA_VEHICULO WHERE ID_MAR = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Marca no encontrada', 404);
    }

    const row = result.rows[0];
    successResponse(res, { id: row[0], nombre: row[1] }, 'Marca obtenida exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener marca', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function createMarca(req, res) {
  const { nombre } = req.body;

  const validation = validateMarcaVehiculo({ NOMBRE_MAR: nombre });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MARCA_VEHICULO WHERE NOMBRE_MAR = :nombre`,
      { nombre }
    );

    if (checkResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'La marca ya existe', 409);
    }

    await connection.execute(
      `INSERT INTO MARCA_VEHICULO (ID_MAR, NOMBRE_MAR)
       VALUES (SEQ_MARCA_VEHICULO.NEXTVAL, :nombre)`,
      { nombre }
    );

    successResponse(res, { nombre }, 'Marca creada exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear marca', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function updateMarca(req, res) {
  const { id } = req.params;
  const { nombre } = req.body;

  const validation = validateMarcaVehiculo({ NOMBRE_MAR: nombre });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MARCA_VEHICULO WHERE ID_MAR = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Marca no encontrada', 404);
    }

    await connection.execute(
      `UPDATE MARCA_VEHICULO SET NOMBRE_MAR = :nombre WHERE ID_MAR = :id`,
      { id, nombre }
    );

    successResponse(res, { id, nombre }, 'Marca actualizada exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar marca', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function deleteMarca(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MARCA_VEHICULO WHERE ID_MAR = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Marca no encontrada', 404);
    }

    const vehicleCheck = await connection.execute(
      `SELECT COUNT(*) as count FROM VEHICULO WHERE ID_MAR_VEH = :id`,
      { id }
    );

    if (vehicleCheck.rows[0][0] > 0) {
      return errorResponse(res, null, 'No se puede eliminar una marca con vehículos registrados', 409);
    }

    await connection.execute(
      `DELETE FROM MARCA_VEHICULO WHERE ID_MAR = :id`,
      { id }
    );

    successResponse(res, { id }, 'Marca eliminada exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar marca', 500);
  } finally {
    if (connection) await connection.close();
  }
}
