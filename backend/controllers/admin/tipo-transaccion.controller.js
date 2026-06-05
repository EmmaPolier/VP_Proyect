/**
 * Controller para gestión de TIPOS DE TRANSACCIÓN
 * Tabla: TIPO_TRANSACCION
 */

import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateTipoTransaccion } from '../../utils/validators.js';

export async function getAllTiposTransaccion(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  let connection;
  try {
    connection = await getConnection();

    const totalResult = await connection.execute('SELECT COUNT(*) as total FROM TIPO_TRANSACCION');
    const total = totalResult.rows[0][0];

    const result = await connection.execute(
      `SELECT ID_TTR, NOMBRE_TTR, DESCRIPCION_TTR FROM TIPO_TRANSACCION 
       ORDER BY ID_TTR
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map(row => ({
      id: row[0],
      nombre: row[1],
      descripcion: row[2]
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Tipos de transacción obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener tipos de transacción', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getTipoTransaccionById(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT ID_TTR, NOMBRE_TTR, DESCRIPCION_TTR FROM TIPO_TRANSACCION WHERE ID_TTR = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Tipo de transacción no encontrado', 404);
    }

    const row = result.rows[0];
    successResponse(res, { id: row[0], nombre: row[1], descripcion: row[2] }, 'Tipo de transacción obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener tipo de transacción', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function createTipoTransaccion(req, res) {
  const { nombre, descripcion } = req.body;

  const validation = validateTipoTransaccion({ NOMBRE_TTR: nombre, DESCRIPCION_TTR: descripcion });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM TIPO_TRANSACCION WHERE NOMBRE_TTR = :nombre`,
      { nombre }
    );

    if (checkResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'El tipo de transacción ya existe', 409);
    }

    const seqResult = await connection.execute(
      `SELECT SEQ_TIPO_TRANSACCION.NEXTVAL as nextId FROM DUAL`
    );
    const nextId = seqResult.rows[0][0];

    await connection.execute(
      `INSERT INTO TIPO_TRANSACCION (ID_TTR, NOMBRE_TTR, DESCRIPCION_TTR)
       VALUES (:id, :nombre, :descripcion)`,
      { id: nextId, nombre, descripcion }
    );

    successResponse(res, { id: nextId, nombre, descripcion }, 'Tipo de transacción creado exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear tipo de transacción', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function updateTipoTransaccion(req, res) {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  const validation = validateTipoTransaccion({ NOMBRE_TTR: nombre, DESCRIPCION_TTR: descripcion });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM TIPO_TRANSACCION WHERE ID_TTR = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Tipo de transacción no encontrado', 404);
    }

    await connection.execute(
      `UPDATE TIPO_TRANSACCION SET NOMBRE_TTR = :nombre, DESCRIPCION_TTR = :descripcion WHERE ID_TTR = :id`,
      { id, nombre, descripcion }
    );

    successResponse(res, { id, nombre, descripcion }, 'Tipo de transacción actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar tipo de transacción', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function deleteTipoTransaccion(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM TIPO_TRANSACCION WHERE ID_TTR = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Tipo de transacción no encontrado', 404);
    }

    const transaccionCheck = await connection.execute(
      `SELECT COUNT(*) as count FROM TRANSACCIONES_CARTERA WHERE ID_TTR_TCA = :id`,
      { id }
    );

    if (transaccionCheck.rows[0][0] > 0) {
      return errorResponse(res, null, 'No se puede eliminar un tipo de transacción con registros', 409);
    }

    await connection.execute(
      `DELETE FROM TIPO_TRANSACCION WHERE ID_TTR = :id`,
      { id }
    );

    successResponse(res, { id }, 'Tipo de transacción eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar tipo de transacción', 500);
  } finally {
    if (connection) await connection.close();
  }
}
