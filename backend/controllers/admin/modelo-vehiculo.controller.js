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
      `SELECT m.ID_MOD, m.NOMBRE_MOD, m.ANIO_MOD, mm.ID_MAR_MMV
       FROM MODELO_VEHICULO m
       LEFT JOIN MARCA_MODELO_VEH mm ON m.ID_MOD = mm.ID_MOD_MMV
       ORDER BY m.ID_MOD
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map(row => ({
      id: row[0],
      nombre: row[1],
      ano: row[2],
      brandId: row[3]
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
      `SELECT m.ID_MOD, m.NOMBRE_MOD, m.ANIO_MOD, mm.ID_MAR_MMV
       FROM MODELO_VEHICULO m
       LEFT JOIN MARCA_MODELO_VEH mm ON m.ID_MOD = mm.ID_MOD_MMV
       WHERE m.ID_MOD = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Modelo no encontrado', 404);
    }

    const row = result.rows[0];
    successResponse(res, { id: row[0], nombre: row[1], ano: row[2], brandId: row[3] }, 'Modelo obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener modelo', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function createModelo(req, res) {
  const { nombre, ano, brandId } = req.body;

  // Validar que se proporcione marca
  if (!brandId) {
    return errorResponse(res, null, 'La marca del modelo es requerida', 400);
  }

  const validation = validateModeloVehiculo({ NOMBRE_MOD: nombre, ANIO_MOD: ano });
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar que la marca existe
    const brandCheck = await connection.execute(
      `SELECT ID_MAR FROM MARCA_VEHICULO WHERE ID_MAR = :brandId`,
      { brandId }
    );

    if (!brandCheck.rows || brandCheck.rows.length === 0) {
      return errorResponse(res, null, 'La marca especificada no existe', 404);
    }

    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM MODELO_VEHICULO WHERE NOMBRE_MOD = :nombre AND ANIO_MOD = :ano`,
      { nombre, ano }
    );

    if (checkResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'El modelo ya existe', 409);
    }

    // Obtener el siguiente ID de modelo
    const seqResult = await connection.execute(
      `SELECT SEQ_MODELO_VEHICULO.NEXTVAL FROM DUAL`
    );
    const modeloId = seqResult.rows[0][0];

    // Insertar modelo
    await connection.execute(
      `INSERT INTO MODELO_VEHICULO (ID_MOD, NOMBRE_MOD, ANIO_MOD)
       VALUES (:modeloId, :nombre, :ano)`,
      { modeloId, nombre, ano }
    );

    // Crear la relación marca-modelo
    await connection.execute(
      `INSERT INTO MARCA_MODELO_VEH (ID_MM_VEH, ID_MAR_MMV, ID_MOD_MMV, FECHA_CREACION_MMV)
       VALUES (SEQ_MARCA_MODELO_VEH.NEXTVAL, :brandId, :modeloId, SYSDATE)`,
      { brandId, modeloId }
    );

    successResponse(res, { id: modeloId, nombre, ano, brandId }, 'Modelo creado exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear modelo', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function updateModelo(req, res) {
  const { id } = req.params;
  const { nombre, ano, brandId } = req.body;

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

    // Si se proporciona brandId, validar que exista y actualizar la relación
    if (brandId) {
      const brandCheck = await connection.execute(
        `SELECT ID_MAR FROM MARCA_VEHICULO WHERE ID_MAR = :brandId`,
        { brandId }
      );

      if (!brandCheck.rows || brandCheck.rows.length === 0) {
        return errorResponse(res, null, 'La marca especificada no existe', 404);
      }

      // Actualizar la relación marca-modelo
      await connection.execute(
        `UPDATE MARCA_MODELO_VEH SET ID_MAR_MMV = :brandId WHERE ID_MOD_MMV = :id`,
        { brandId, id }
      );
    }

    await connection.execute(
      `UPDATE MODELO_VEHICULO SET NOMBRE_MOD = :nombre, ANIO_MOD = :ano WHERE ID_MOD = :id`,
      { id, nombre, ano }
    );

    successResponse(res, { id, nombre, ano, brandId }, 'Modelo actualizado exitosamente');
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

    // Verificar si hay vehículos que usan este modelo a través de MARCA_MODELO_VEH
    const vehicleCheck = await connection.execute(
      `SELECT COUNT(*) as count FROM VEHICULO v
       INNER JOIN MARCA_MODELO_VEH mm ON v.ID_MM_VEH = mm.ID_MM_VEH
       WHERE mm.ID_MOD_MMV = :id`,
      { id }
    );

    if (vehicleCheck.rows[0][0] > 0) {
      return errorResponse(res, null, 'No se puede eliminar un modelo con vehículos registrados', 409);
    }

    // Eliminar la relación marca-modelo
    await connection.execute(
      `DELETE FROM MARCA_MODELO_VEH WHERE ID_MOD_MMV = :id`,
      { id }
    );

    // Eliminar el modelo
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
