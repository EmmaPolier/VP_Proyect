/**
 * Controller para gestión de MODELOS DE VEHÍCULO
 * Tabla: MODELO_VEHICULO
 */

import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateModeloVehiculo } from '../../utils/validators.js';

export async function getAllModelos(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  let connection;
  try {
    connection = await getConnection();

    const totalResult = await connection.execute('SELECT COUNT(*) as total FROM MODELO_VEHICULO');
    const total = totalResult.rows[0][0];

    const result = await connection.execute(
      `SELECT ID_MOD, NOMBRE_MOD, ANIO_MOD FROM MODELO_VEHICULO 
       ORDER BY ID_MOD
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map(row => ({
      id: row[0],
      nombre: row[1],
      ano: row[2]
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Modelos obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener modelos', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getModeloById(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT ID_MOD, NOMBRE_MOD, ANIO_MOD FROM MODELO_VEHICULO WHERE ID_MOD = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Modelo no encontrado', 404);
    }

    const row = result.rows[0];
    successResponse(res, { id: row[0], nombre: row[1], ano: row[2] }, 'Modelo obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener modelo', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function createModelo(req, res) {
  const { nombre, ano } = req.body;

  const validation = validateModeloVehiculo({ NOMBRE_MOD: nombre, ANIO_MOD: ano });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MODELO_VEHICULO WHERE NOMBRE_MOD = :nombre AND ANIO_MOD = :ano`,
      { nombre, ano }
    );

    if (checkResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'El modelo ya existe', 409);
    }

    await connection.execute(
      `INSERT INTO MODELO_VEHICULO (ID_MOD, NOMBRE_MOD, ANIO_MOD)
       VALUES (SEQ_MODELO_VEHICULO.NEXTVAL, :nombre, :ano)`,
      { nombre, ano }
    );

    successResponse(res, { nombre, ano }, 'Modelo creado exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear modelo', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function updateModelo(req, res) {
  const { id } = req.params;
  const { nombre, ano } = req.body;

  const validation = validateModeloVehiculo({ NOMBRE_MOD: nombre, ANIO_MOD: ano });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MODELO_VEHICULO WHERE ID_MOD = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Modelo no encontrado', 404);
    }

    await connection.execute(
      `UPDATE MODELO_VEHICULO SET NOMBRE_MOD = :nombre, ANIO_MOD = :ano WHERE ID_MOD = :id`,
      { id, nombre, ano }
    );

    successResponse(res, { id, nombre, ano }, 'Modelo actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar modelo', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function deleteModelo(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MODELO_VEHICULO WHERE ID_MOD = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Modelo no encontrado', 404);
    }

    const vehicleCheck = await connection.execute(
      `SELECT COUNT(*) as count FROM VEHICULO WHERE ID_MOD_VEH = :id`,
      { id }
    );

    if (vehicleCheck.rows[0][0] > 0) {
      return errorResponse(res, null, 'No se puede eliminar un modelo con vehículos registrados', 409);
    }

    await connection.execute(
      `DELETE FROM MODELO_VEHICULO WHERE ID_MOD = :id`,
      { id }
    );

    successResponse(res, { id }, 'Modelo eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar modelo', 500);
  } finally {
    if (connection) await connection.close();
  }
}
