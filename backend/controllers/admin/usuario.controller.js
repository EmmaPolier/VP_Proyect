import bcryptjs from 'bcryptjs';
import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateUsuario } from '../../utils/validators.js';

function normalizeDate(value) {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  const parts = value.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return value;
}

export async function getAllUsuarios(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;

  let connection;
  try {
    connection = await getConnection();

    const totalResult = await connection.execute('SELECT COUNT(*) as total FROM USUARIO');
    const total = totalResult.rows[0][0];

    const result = await connection.execute(
      `SELECT
         u.DOCUMENTO_USU,
         u.NOMBRES_USU,
         u.PRIMER_APELLIDO_USU,
         u.SEGUNDO_APELLIDO_USU,
         u.CORREO_USU,
         u.NUMERO_TELEFONO_USU,
         TO_CHAR(u.FECHA_NACIMIENTO_USU, 'YYYY-MM-DD'),
         u.ID_EST_USU,
         e.NOMBRE_EUS,
         p.ID_PER,
         p.NOMBRE_PER
       FROM USUARIO u
       LEFT JOIN USUARIO_PERFIL up ON up.DOCUMENTO_USU_UPE = u.DOCUMENTO_USU
       LEFT JOIN PERFIL p ON p.ID_PER = up.ID_PER_UPE
       LEFT JOIN ESTADO_USUARIO e ON e.ID_EUS = u.ID_EST_USU
       ORDER BY u.DOCUMENTO_USU
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map((row) => ({
      id: row[0],
      documento: row[0],
      nombres: row[1],
      primerApellido: row[2],
      segundoApellido: row[3],
      email: row[4],
      telefono: row[5],
      fechaNacimiento: row[6],
      idEstado: row[7],
      estado: row[8],
      idPerfil: row[9],
      perfil: row[10],
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Usuarios obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener usuarios', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

export async function getUsuarioById(req, res) {
  const { documento } = req.params;
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         u.DOCUMENTO_USU,
         u.NOMBRES_USU,
         u.PRIMER_APELLIDO_USU,
         u.SEGUNDO_APELLIDO_USU,
         u.CORREO_USU,
         u.NUMERO_TELEFONO_USU,
         TO_CHAR(u.FECHA_NACIMIENTO_USU, 'YYYY-MM-DD'),
         u.ID_EST_USU,
         e.NOMBRE_EUS,
         p.ID_PER,
         p.NOMBRE_PER
       FROM USUARIO u
       LEFT JOIN USUARIO_PERFIL up ON up.DOCUMENTO_USU_UPE = u.DOCUMENTO_USU
       LEFT JOIN PERFIL p ON p.ID_PER = up.ID_PER_UPE
       LEFT JOIN ESTADO_USUARIO e ON e.ID_EUS = u.ID_EST_USU
       WHERE u.DOCUMENTO_USU = :documento`,
      { documento }
    );

    if (result.rows.length === 0) {
      return errorResponse(res, null, 'Usuario no encontrado', 404);
    }

    const row = result.rows[0];
    const data = {
      id: row[0],
      documento: row[0],
      nombres: row[1],
      primerApellido: row[2],
      segundoApellido: row[3],
      email: row[4],
      telefono: row[5],
      fechaNacimiento: row[6],
      idEstado: row[7],
      estado: row[8],
      idPerfil: row[9],
      perfil: row[10],
    };

    successResponse(res, data, 'Usuario obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener usuario', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

export async function createUsuario(req, res) {
  const {
    documento,
    nombres,
    primerApellido,
    segundoApellido,
    email,
    telefono,
    fechaNacimiento,
    contrasena,
    idEstado,
    idPerfil,
  } = req.body;

  const validation = validateUsuario({
    DOCUMENTO_USU: documento,
    NOMBRES_USU: nombres,
    PRIMER_APELLIDO_USU: primerApellido,
    SEGUNDO_APELLIDO_USU: segundoApellido,
    CORREO_USU: email,
    NUMERO_TELEFONO_USU: telefono,
    FECHA_NACIMIENTO_USU: fechaNacimiento,
    CONTRASENA_USU: contrasena,
    ID_EST_USU: idEstado,
    ID_PER_UPE: idPerfil,
  });

  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const existing = await connection.execute(
      `SELECT COUNT(*) as count FROM USUARIO WHERE DOCUMENTO_USU = :documento OR CORREO_USU = :email OR NUMERO_TELEFONO_USU = :telefono`,
      { documento, email, telefono }
    );

    if (existing.rows[0][0] > 0) {
      return errorResponse(res, null, 'Ya existe un usuario con el mismo documento, email o teléfono', 409);
    }

    const hash = await bcryptjs.hash(contrasena, 10);
    const birthDate = normalizeDate(fechaNacimiento) || '2000-01-01';

    await connection.execute(
      `INSERT INTO USUARIO (
         DOCUMENTO_USU,
         NOMBRES_USU,
         PRIMER_APELLIDO_USU,
         SEGUNDO_APELLIDO_USU,
         CORREO_USU,
         NUMERO_TELEFONO_USU,
         FECHA_NACIMIENTO_USU,
         CONTRASENA_USU,
         FOTO_URL_USU,
         SALDO_CARTERA_USU,
         FECHA_CREACION_USU,
         ID_EST_USU
       ) VALUES (
         :documento,
         :nombres,
         :primerApellido,
         :segundoApellido,
         :email,
         :telefono,
         TO_DATE(:birthDate, 'YYYY-MM-DD'),
         :hash,
         'https://storage/fotos/default.jpg',
         0,
         SYSDATE,
         :idEstado
       )`,
      {
        documento,
        nombres,
        primerApellido,
        segundoApellido,
        email,
        telefono,
        birthDate,
        hash,
        idEstado,
      }
    );

    await connection.execute(
      `INSERT INTO USUARIO_PERFIL (
         ID_UPE,
         DOCUMENTO_USU_UPE,
         ID_PER_UPE,
         CALIFICACION_UPE,
         FECHA_ASIGNACION_UPE
       ) VALUES (
         SEQ_USUARIO_PERFIL.NEXTVAL,
         :documento,
         :idPerfil,
         5.0,
         SYSDATE
       )`,
      { documento, idPerfil }
    );

    successResponse(res, { documento, email, nombres, primerApellido, idEstado, idPerfil }, 'Usuario creado exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear usuario', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

export async function updateUsuario(req, res) {
  const { documento } = req.params;
  const {
    nombres,
    primerApellido,
    segundoApellido,
    email,
    telefono,
    fechaNacimiento,
    contrasena,
    idEstado,
    idPerfil,
  } = req.body;

  const validation = validateUsuario({
    DOCUMENTO_USU: documento,
    NOMBRES_USU: nombres,
    PRIMER_APELLIDO_USU: primerApellido,
    SEGUNDO_APELLIDO_USU: segundoApellido,
    CORREO_USU: email,
    NUMERO_TELEFONO_USU: telefono,
    FECHA_NACIMIENTO_USU: fechaNacimiento,
    CONTRASENA_USU: contrasena,
    ID_EST_USU: idEstado,
    ID_PER_UPE: idPerfil,
  }, true);

  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;

  try {
    connection = await getConnection();

    // Obtener datos actuales del usuario
    const currentUserResult = await connection.execute(
      'SELECT CORREO_USU, NUMERO_TELEFONO_USU FROM USUARIO WHERE DOCUMENTO_USU = :documento',
      { documento }
    );

    if (currentUserResult.rows.length === 0) {
      return errorResponse(res, null, 'Usuario no encontrado', 404);
    }

    const currentEmail = currentUserResult.rows[0][0];
    const currentTelefono = currentUserResult.rows[0][1];

    // Validar duplicados SOLO si el email o teléfono cambiaron
    if ((email && email !== currentEmail) || (telefono && telefono !== currentTelefono)) {
      const conditions = [];
      const params = { documento };

      if (email && email !== currentEmail) {
        conditions.push('CORREO_USU = :email');
        params.email = email;
      }
      if (telefono && telefono !== currentTelefono) {
        conditions.push('NUMERO_TELEFONO_USU = :telefono');
        params.telefono = telefono;
      }

      if (conditions.length > 0) {
        const duplicateCheck = await connection.execute(
          `SELECT COUNT(*) as count FROM USUARIO WHERE (${conditions.join(' OR ')}) AND DOCUMENTO_USU != :documento`,
          params
        );

        if (duplicateCheck.rows[0][0] > 0) {
          return errorResponse(res, null, 'Ya existe un usuario con el mismo email o teléfono', 409);
        }
      }
    }

    const updateFields = [];
    const params = { documento };

    if (nombres) {
      updateFields.push('NOMBRES_USU = :nombres');
      params.nombres = nombres;
    }
    if (primerApellido) {
      updateFields.push('PRIMER_APELLIDO_USU = :primerApellido');
      params.primerApellido = primerApellido;
    }
    if (segundoApellido) {
      updateFields.push('SEGUNDO_APELLIDO_USU = :segundoApellido');
      params.segundoApellido = segundoApellido;
    }
    if (email) {
      updateFields.push('CORREO_USU = :email');
      params.email = email;
    }
    if (telefono) {
      updateFields.push('NUMERO_TELEFONO_USU = :telefono');
      params.telefono = telefono;
    }
    if (fechaNacimiento) {
      updateFields.push('FECHA_NACIMIENTO_USU = TO_DATE(:birthDate, \'YYYY-MM-DD\')');
      params.birthDate = normalizeDate(fechaNacimiento);
    }
    if (contrasena) {
      const hash = await bcryptjs.hash(contrasena, 10);
      updateFields.push('CONTRASENA_USU = :hash');
      params.hash = hash;
    }
    if (typeof idEstado !== 'undefined') {
      updateFields.push('ID_EST_USU = :idEstado');
      params.idEstado = idEstado;
    }

    if (updateFields.length > 0) {
      await connection.execute(
        `UPDATE USUARIO SET ${updateFields.join(', ')} WHERE DOCUMENTO_USU = :documento`,
        params
      );
    }

    // NOTA: Los perfiles NO se actualizan desde aquí
    // Los perfiles deben manejarse por separado en un endpoint específico
    // Esto previene conflictos cuando un usuario tiene múltiples perfiles

    await connection.commit();

    successResponse(res, { documento, email, nombres, primerApellido, segundoApellido, idEstado }, 'Usuario actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar usuario', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

export async function deleteUsuario(req, res) {
  const { documento } = req.params;
  const { idPerfil } = req.query; // Parámetro opcional para eliminar solo un perfil específico

  let connection;
  try {
    connection = await getConnection();

    const userCheck = await connection.execute(
      'SELECT COUNT(*) as count FROM USUARIO WHERE DOCUMENTO_USU = :documento',
      { documento }
    );

    if (userCheck.rows[0][0] === 0) {
      return errorResponse(res, null, 'Usuario no encontrado', 404);
    }

    // Si se especifica un perfil, eliminar solo ese perfil
    if (idPerfil) {
      const perfilCheck = await connection.execute(
        `SELECT ID_UPE FROM USUARIO_PERFIL 
         WHERE DOCUMENTO_USU_UPE = :documento AND ID_PER_UPE = :idPerfil`,
        { documento, idPerfil }
      );

      if (perfilCheck.rows.length === 0) {
        return errorResponse(res, null, 'Este usuario no tiene ese perfil', 404);
      }

      const uperIdToDelete = perfilCheck.rows[0][0];

      // Eliminar datos asociados a este perfil específico
      // 1. Eliminar CALIFICACION que dependen de CUPO_RUTA
      await connection.execute(
        `DELETE FROM CALIFICACION 
         WHERE (SOL_ID_CAL, RUT_ID_CAL) IN (
           SELECT ID_SOL_CRU, ID_RUT_CRU FROM CUPO_RUTA 
           WHERE ID_SOL_CRU IN (
             SELECT ID_SOL FROM SOLICITUD_CUPO WHERE ID_UPE_SOL = :uperIdToDelete
           )
         )`,
        { uperIdToDelete }
      );

      // 2. Eliminar HISTORIAL_VIAJE que dependen de CUPO_RUTA
      await connection.execute(
        `DELETE FROM HISTORIAL_VIAJE 
         WHERE (SOL_ID_HIS, RUT_ID_HIS) IN (
           SELECT ID_SOL_CRU, ID_RUT_CRU FROM CUPO_RUTA 
           WHERE ID_SOL_CRU IN (
             SELECT ID_SOL FROM SOLICITUD_CUPO WHERE ID_UPE_SOL = :uperIdToDelete
           )
         )`,
        { uperIdToDelete }
      );

      // 3. Eliminar CUPO_RUTA que dependen de SOLICITUD_CUPO
      await connection.execute(
        `DELETE FROM CUPO_RUTA 
         WHERE ID_SOL_CRU IN (
           SELECT ID_SOL FROM SOLICITUD_CUPO WHERE ID_UPE_SOL = :uperIdToDelete
         )`,
        { uperIdToDelete }
      );

      // 4. Eliminar SOLICITUD_CUPO que dependen de USUARIO_PERFIL
      await connection.execute(
        `DELETE FROM SOLICITUD_CUPO WHERE ID_UPE_SOL = :uperIdToDelete`,
        { uperIdToDelete }
      );

      // 5. Eliminar RUTA que dependen de USUARIO_PERFIL (como conductor)
      await connection.execute(
        `DELETE FROM RUTA WHERE ID_UPE_RUT = :uperIdToDelete`,
        { uperIdToDelete }
      );

      // 6. Eliminar solo este USUARIO_PERFIL
      await connection.execute(
        `DELETE FROM USUARIO_PERFIL 
         WHERE DOCUMENTO_USU_UPE = :documento AND ID_PER_UPE = :idPerfil`,
        { documento, idPerfil }
      );

      await connection.commit();

      return successResponse(res, { documento, idPerfil }, `Perfil ${idPerfil} del usuario eliminado exitosamente`);
    }

    // Si NO se especifica perfil, eliminar todo el usuario (comportamiento original)
    // Obtener IDs de USUARIO_PERFIL para este usuario
    const usuarioPerfil = await connection.execute(
      'SELECT ID_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento',
      { documento }
    );

    const uperIds = usuarioPerfil.rows.map((row) => row[0]);

    if (uperIds.length > 0) {
      // 1. Eliminar CALIFICACION que dependen de CUPO_RUTA
      await connection.execute(
        `DELETE FROM CALIFICACION 
         WHERE (SOL_ID_CAL, RUT_ID_CAL) IN (
           SELECT ID_SOL_CRU, ID_RUT_CRU FROM CUPO_RUTA 
           WHERE ID_SOL_CRU IN (
             SELECT ID_SOL FROM SOLICITUD_CUPO WHERE ID_UPE_SOL IN (${uperIds.join(',')})
           )
         )`,
        {}
      );

      // 2. Eliminar HISTORIAL_VIAJE que dependen de CUPO_RUTA
      await connection.execute(
        `DELETE FROM HISTORIAL_VIAJE 
         WHERE (SOL_ID_HIS, RUT_ID_HIS) IN (
           SELECT ID_SOL_CRU, ID_RUT_CRU FROM CUPO_RUTA 
           WHERE ID_SOL_CRU IN (
             SELECT ID_SOL FROM SOLICITUD_CUPO WHERE ID_UPE_SOL IN (${uperIds.join(',')})
           )
         )`,
        {}
      );

      // 3. Eliminar CUPO_RUTA que dependen de SOLICITUD_CUPO
      await connection.execute(
        `DELETE FROM CUPO_RUTA 
         WHERE ID_SOL_CRU IN (
           SELECT ID_SOL FROM SOLICITUD_CUPO WHERE ID_UPE_SOL IN (${uperIds.join(',')})
         )`,
        {}
      );

      // 4. Eliminar SOLICITUD_CUPO que dependen de USUARIO_PERFIL
      await connection.execute(
        `DELETE FROM SOLICITUD_CUPO WHERE ID_UPE_SOL IN (${uperIds.join(',')})`,
        {}
      );

      // 5. Eliminar RUTA que dependen de USUARIO_PERFIL (como conductor)
      await connection.execute(
        `DELETE FROM RUTA WHERE ID_UPE_RUT IN (${uperIds.join(',')})`,
        {}
      );
    }

    // 6. Eliminar VEHICULO que dependen de USUARIO (como propietario)
    await connection.execute(
      'DELETE FROM VEHICULO WHERE DOCUMENTO_USU_VEH = :documento',
      { documento }
    );

    // 7. Eliminar TRANSACCIONES_CARTERA
    await connection.execute(
      'DELETE FROM TRANSACCIONES_CARTERA WHERE DOCUMENTO_USU_TRA = :documento',
      { documento }
    );

    // 8. Eliminar VERIFICACION_CORREO
    await connection.execute(
      'DELETE FROM VERIFICACION_CORREO WHERE DOCUMENTO_USU_VER = :documento',
      { documento }
    );

    // 9. Eliminar USUARIO_PERFIL
    await connection.execute(
      'DELETE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento',
      { documento }
    );

    // 10. Finalmente eliminar USUARIO
    await connection.execute(
      'DELETE FROM USUARIO WHERE DOCUMENTO_USU = :documento',
      { documento }
    );

    await connection.commit();

    successResponse(res, { documento }, 'Usuario eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar usuario', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

/**
 * Agregar un nuevo perfil a un usuario existente
 * POST /api/admin/usuarios/:documento/perfiles
 */
export async function addPerfilToUsuario(req, res) {
  const { documento } = req.params;
  const { idPerfil } = req.body;

  let connection;
  try {
    connection = await getConnection();

    // Validar que el usuario existe
    const userCheck = await connection.execute(
      'SELECT COUNT(*) as count FROM USUARIO WHERE DOCUMENTO_USU = :documento',
      { documento }
    );

    if (userCheck.rows[0][0] === 0) {
      return errorResponse(res, null, 'Usuario no encontrado', 404);
    }

    // Validar que el perfil existe
    const perfilCheck = await connection.execute(
      'SELECT COUNT(*) as count FROM PERFIL WHERE ID_PER = :idPerfil',
      { idPerfil }
    );

    if (perfilCheck.rows[0][0] === 0) {
      return errorResponse(res, null, 'Perfil no encontrado', 404);
    }

    // Validar que el usuario no tenga ya este perfil
    const existingCheck = await connection.execute(
      `SELECT COUNT(*) as count FROM USUARIO_PERFIL 
       WHERE DOCUMENTO_USU_UPE = :documento AND ID_PER_UPE = :idPerfil`,
      { documento, idPerfil }
    );

    if (existingCheck.rows[0][0] > 0) {
      return errorResponse(res, null, 'Este usuario ya tiene asignado este perfil', 409);
    }

    // Obtener el siguiente ID de secuencia
    const seqResult = await connection.execute(
      'SELECT SEQ_USUARIO_PERFIL.NEXTVAL FROM DUAL'
    );
    const nextId = seqResult.rows[0][0];

    // Insertar el nuevo perfil para el usuario
    await connection.execute(
      `INSERT INTO USUARIO_PERFIL (
         ID_UPE,
         DOCUMENTO_USU_UPE,
         ID_PER_UPE,
         CALIFICACION_UPE,
         FECHA_ASIGNACION_UPE
       ) VALUES (
         :idUpe,
         :documento,
         :idPerfil,
         5.0,
         SYSDATE
       )`,
      { idUpe: nextId, documento, idPerfil }
    );

    await connection.commit();

    successResponse(res, { documento, idPerfil, idUpe: nextId }, 'Perfil agregado exitosamente al usuario');
  } catch (error) {
    errorResponse(res, error, 'Error al agregar perfil al usuario', 500);
  } finally {
    if (connection) await connection?.close();
  }
}
