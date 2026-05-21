/**
 * Controller para gestión de USUARIOS
 * Tabla: USUARIO
 * Relación: USUARIO_PERFIL (N:M con PERFIL)
 */

import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateUsuario, validatePassword } from '../../utils/validators.js';
import bcrypt from 'bcrypt';

// GET all usuarios with pagination
export async function getAllUsuarios(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  let connection;
  try {
    connection = await getConnection();

    // Obtener total
    const totalResult = await connection.execute(
      'SELECT COUNT(*) as total FROM USUARIO'
    );
    const total = totalResult.rows[0][0];

    // Obtener usuarios con paginación
    const result = await connection.execute(
      `SELECT ID_USU, NOMBRE_USU, EMAIL_USU, TELEFONO_USU, ID_EST, FECHA_CREACION_USU 
       FROM USUARIO 
       ORDER BY ID_USU
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map(row => ({
      id: row[0],
      nombre: row[1],
      email: row[2],
      telefono: row[3],
      idEstado: row[4],
      fechaCreacion: row[5]
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Usuarios obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener usuarios', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// GET usuario by ID con perfiles
export async function getUsuarioById(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT ID_USU, NOMBRE_USU, EMAIL_USU, TELEFONO_USU, ID_EST, FECHA_CREACION_USU 
       FROM USUARIO WHERE ID_USU = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Usuario no encontrado', 404);
    }

    const row = result.rows[0];
    const usuario = {
      id: row[0],
      nombre: row[1],
      email: row[2],
      telefono: row[3],
      idEstado: row[4],
      fechaCreacion: row[5]
    };

    // Obtener perfiles/roles del usuario
    const perfilesResult = await connection.execute(
      `SELECT ID_PER, NOMBRE_PER FROM PERFIL 
       WHERE ID_PER IN (SELECT ID_PER FROM USUARIO_PERFIL WHERE ID_USU = :id)`,
      { id }
    );

    usuario.perfiles = perfilesResult.rows.map(row => ({
      id: row[0],
      nombre: row[1]
    }));

    successResponse(res, usuario, 'Usuario obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener usuario', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// CREATE usuario
export async function createUsuario(req, res) {
  const { nombre, email, telefono, contraseña, idEstado, perfiles } = req.body;

  // Validar datos
  const validation = validateUsuario({
    NOMBRE_USU: nombre,
    EMAIL_USU: email,
    TELEFONO_USU: telefono,
    ID_EST: idEstado
  });

  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  // Validar contraseña
  const passwordValidation = validatePassword(contraseña);
  if (!passwordValidation.valid) {
    return errorResponse(res, null, passwordValidation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar si email ya existe
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM USUARIO WHERE EMAIL_USU = :email`,
      { email }
    );

    if (checkResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'El email ya está registrado', 409);
    }

    // Verificar estado
    const estadoCheck = await connection.execute(
      `SELECT COUNT(*) as count FROM ESTADO WHERE ID_EST = :idEstado`,
      { idEstado }
    );

    if (estadoCheck.rows[0][0] === 0) {
      return errorResponse(res, null, 'El estado no existe', 400);
    }

    // Hash contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Insertar usuario
    await connection.execute(
      `INSERT INTO USUARIO (ID_USU, NOMBRE_USU, EMAIL_USU, TELEFONO_USU, CONTRASEÑA_USU, ID_EST, FECHA_CREACION_USU)
       VALUES (SEQ_USUARIO.NEXTVAL, :nombre, :email, :telefono, :contraseña, :idEstado, SYSDATE)`,
      { nombre, email, telefono, contraseña: hashedPassword, idEstado }
    );

    // Obtener ID del usuario creado
    const idResult = await connection.execute(
      `SELECT ID_USU FROM USUARIO WHERE EMAIL_USU = :email`,
      { email }
    );

    const usuarioId = idResult.rows[0][0];

    // Asignar perfiles si se proporcionan
    if (perfiles && Array.isArray(perfiles) && perfiles.length > 0) {
      for (const perfilId of perfiles) {
        await connection.execute(
          `INSERT INTO USUARIO_PERFIL (ID_USU, ID_PER, CALIFICACION_UPE)
           VALUES (:usuarioId, :perfilId, 5.0)`,
          { usuarioId, perfilId }
        );
      }
    }

    successResponse(res, { id: usuarioId, nombre, email, telefono }, 'Usuario creado exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear usuario', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// UPDATE usuario
export async function updateUsuario(req, res) {
  const { id } = req.params;
  const { nombre, email, telefono, idEstado, perfiles } = req.body;

  // Validar datos
  const validation = validateUsuario({
    NOMBRE_USU: nombre,
    EMAIL_USU: email,
    TELEFONO_USU: telefono,
    ID_EST: idEstado
  });

  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar si existe
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM USUARIO WHERE ID_USU = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Usuario no encontrado', 404);
    }

    // Verificar email único (solo si es diferente)
    const emailCheck = await connection.execute(
      `SELECT COUNT(*) as count FROM USUARIO WHERE EMAIL_USU = :email AND ID_USU != :id`,
      { email, id }
    );

    if (emailCheck.rows[0][0] > 0) {
      return errorResponse(res, null, 'El email ya está en uso', 409);
    }

    // Actualizar usuario
    await connection.execute(
      `UPDATE USUARIO SET NOMBRE_USU = :nombre, EMAIL_USU = :email, TELEFONO_USU = :telefono, ID_EST = :idEstado
       WHERE ID_USU = :id`,
      { nombre, email, telefono, idEstado, id }
    );

    // Actualizar perfiles si se proporcionan
    if (perfiles && Array.isArray(perfiles)) {
      // Eliminar perfiles actuales
      await connection.execute(
        `DELETE FROM USUARIO_PERFIL WHERE ID_USU = :id`,
        { id }
      );

      // Insertar nuevos perfiles
      for (const perfilId of perfiles) {
        await connection.execute(
          `INSERT INTO USUARIO_PERFIL (ID_USU, ID_PER, CALIFICACION_UPE)
           VALUES (:id, :perfilId, 5.0)`,
          { id, perfilId }
        );
      }
    }

    successResponse(res, { id, nombre, email, telefono }, 'Usuario actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar usuario', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// DELETE usuario
export async function deleteUsuario(req, res) {
  const { id } = req.params;

  let connection;
  try {
    connection = await getConnection();

    // Verificar si existe
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as count FROM USUARIO WHERE ID_USU = :id`,
      { id }
    );

    if (checkResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'Usuario no encontrado', 404);
    }

    // Eliminar perfiles asociados
    await connection.execute(
      `DELETE FROM USUARIO_PERFIL WHERE ID_USU = :id`,
      { id }
    );

    // Eliminar usuario
    await connection.execute(
      `DELETE FROM USUARIO WHERE ID_USU = :id`,
      { id }
    );

    successResponse(res, { id }, 'Usuario eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar usuario', 500);
  } finally {
    if (connection) await connection.close();
  }
}

// CHANGE PASSWORD
export async function changePassword(req, res) {
  const { id } = req.params;
  const { contraseñaActual, contraseñaNueva } = req.body;

  if (!contraseñaActual || !contraseñaNueva) {
    return errorResponse(res, null, 'Se requieren contraseña actual y nueva', 400);
  }

  const passwordValidation = validatePassword(contraseñaNueva);
  if (!passwordValidation.valid) {
    return errorResponse(res, null, passwordValidation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    // Obtener usuario
    const result = await connection.execute(
      `SELECT CONTRASEÑA_USU FROM USUARIO WHERE ID_USU = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Usuario no encontrado', 404);
    }

    const hashedPasswordDB = result.rows[0][0];

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(contraseñaActual, hashedPasswordDB);
    if (!isValid) {
      return errorResponse(res, null, 'Contraseña actual incorrecta', 401);
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(contraseñaNueva, 10);

    // Actualizar
    await connection.execute(
      `UPDATE USUARIO SET CONTRASEÑA_USU = :contraseña WHERE ID_USU = :id`,
      { contraseña: hashedPassword, id }
    );

    successResponse(res, { id }, 'Contraseña actualizada exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al cambiar contraseña', 500);
  } finally {
    if (connection) await connection.close();
  }
}
