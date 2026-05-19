/**
 * Controller para gestión de PERFILES
 * Tabla: PERFIL
 */

import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validatePerfil } from '../../utils/validators.js';

// GET all perfiles with pagination
export async function getAllPerfiles(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  let connection;
  try {
    connection = await getConnection();

    // Obtener total de registros
    const totalResult = await connection.execute(
      'SELECT COUNT(*) as total FROM PERFIL'
    );
    const total = totalResult.rows[0][0];

    // Obtener registros con paginación
    const result = await connection.execute(
      `SELECT ID_PER, NOMBRE_PER, DESCRIPCION_PER, FECHA_CREACION_PER 
       FROM PERFIL 
       ORDER BY ID_PER
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map(row => ({
      id: row[0],
      nombre: row[1],
      descripcion: row[2],
      fechaCreacion: row[3]
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Perfiles obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener perfiles', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// GET perfil by ID
export async function getPerfilById(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT ID_PER, NOMBRE_PER, DESCRIPCION_PER, FECHA_CREACION_PER 
       FROM PERFIL WHERE ID_PER = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Perfil no encontrado', 404);
    }

    const row = result.rows[0];
    const data = {
      id: row[0],
      nombre: row[1],
      descripcion: row[2],
      fechaCreacion: row[3]
    };

    successResponse(res, data, 'Perfil obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener perfil', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// CREATE perfil
export async function createPerfil(req, res) {
  const { nombre, descripcion } = req.body;

  // Validar datos
  const validation = validatePerfil({
    NOMBRE_PER: nombre,
    DESCRIPCION_PER: descripcion
  });

  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar si ya existe
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM PERFIL WHERE NOMBRE_PER = :nombre`,
      { nombre }
    );

    if (checkResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'El perfil ya existe', 409);
    }

    // Insertar
    await connection.execute(
      `INSERT INTO PERFIL (ID_PER, NOMBRE_PER, DESCRIPCION_PER, FECHA_CREACION_PER)
       VALUES (SEQ_PERFIL.NEXTVAL, :nombre, :descripcion, SYSDATE)`,
      { nombre, descripcion }
    );

    successResponse(res, { nombre, descripcion }, 'Perfil creado exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear perfil', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// UPDATE perfil
export async function updatePerfil(req, res) {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  // Validar datos
  const validation = validatePerfil({
    NOMBRE_PER: nombre,
    DESCRIPCION_PER: descripcion
  });

  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar si existe
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM PERFIL WHERE ID_PER = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Perfil no encontrado', 404);
    }

    // Actualizar
    await connection.execute(
      `UPDATE PERFIL SET NOMBRE_PER = :nombre, DESCRIPCION_PER = :descripcion 
       WHERE ID_PER = :id`,
      { id, nombre, descripcion }
    );

    successResponse(res, { id, nombre, descripcion }, 'Perfil actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar perfil', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// DELETE perfil
export async function deletePerfil(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();

    // Verificar si existe
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM PERFIL WHERE ID_PER = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Perfil no encontrado', 404);
    }

    // Verificar si tiene usuarios asignados
    const usersResult = await connection.execute(
      `SELECT COUNT(*) as count FROM USUARIO_PERFIL WHERE ID_PER_UPE = :id`,
      { id }
    );

    if (usersResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'No se puede eliminar un perfil con usuarios asignados', 409);
    }

    // Eliminar
    await connection.execute(
      `DELETE FROM PERFIL WHERE ID_PER = :id`,
      { id }
    );

    successResponse(res, { id }, 'Perfil eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar perfil', 500);
  } finally {
    if (connection) await connection.close();
  }
}
