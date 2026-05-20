/**
 * Controller para gestión de MÉTODOS DE PAGO
 * Tabla: METODO_PAGO
 */

import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateMetodoPago } from '../../utils/validators.js';

export async function getAllMetodosPago(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  let connection;
  try {
    connection = await getConnection();

    const totalResult = await connection.execute('SELECT COUNT(*) as total FROM METODO_PAGO');
    const total = totalResult.rows[0][0];

    const result = await connection.execute(
      `SELECT ID_MPA, NOMBRE_MPA FROM METODO_PAGO 
       ORDER BY ID_MPA
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map(row => ({
      id: row[0],
      nombre: row[1]
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Métodos de pago obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener métodos de pago', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getMetodoPagoById(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT ID_MPA, NOMBRE_MPA FROM METODO_PAGO WHERE ID_MPA = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Método de pago no encontrado', 404);
    }

    const row = result.rows[0];
    successResponse(res, { id: row[0], nombre: row[1] }, 'Método de pago obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener método de pago', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function createMetodoPago(req, res) {
  const { nombre } = req.body;

  const validation = validateMetodoPago({ NOMBRE_MPA: nombre });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM METODO_PAGO WHERE NOMBRE_MPA = :nombre`,
      { nombre }
    );

    if (checkResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'El método de pago ya existe', 409);
    }

    await connection.execute(
      `INSERT INTO METODO_PAGO (ID_MPA, NOMBRE_MPA)
       VALUES (SEQ_METODO_PAGO.NEXTVAL, :nombre)`,
      { nombre }
    );

    successResponse(res, { nombre }, 'Método de pago creado exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear método de pago', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function updateMetodoPago(req, res) {
  const { id } = req.params;
  const { nombre } = req.body;

  const validation = validateMetodoPago({ NOMBRE_MPA: nombre });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM METODO_PAGO WHERE ID_MPA = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Método de pago no encontrado', 404);
    }

    await connection.execute(
      `UPDATE METODO_PAGO SET NOMBRE_MPA = :nombre WHERE ID_MPA = :id`,
      { id, nombre }
    );

    successResponse(res, { id, nombre }, 'Método de pago actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar método de pago', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function deleteMetodoPago(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM METODO_PAGO WHERE ID_MPA = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Método de pago no encontrado', 404);
    }

    const solicitudCheck = await connection.execute(
      `SELECT COUNT(*) as count FROM SOLICITUD_CUPO WHERE ID_MPA_SOL = :id`,
      { id }
    );

    if (solicitudCheck.rows[0][0] > 0) {
      return errorResponse(res, null, 'No se puede eliminar un método de pago con solicitudes', 409);
    }

    await connection.execute(
      `DELETE FROM METODO_PAGO WHERE ID_MPA = :id`,
      { id }
    );

    successResponse(res, { id }, 'Método de pago eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar método de pago', 500);
  } finally {
    if (connection) await connection.close();
  }
}
