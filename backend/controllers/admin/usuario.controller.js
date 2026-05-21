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

    const existingUser = await connection.execute(
      'SELECT COUNT(*) as count FROM USUARIO WHERE DOCUMENTO_USU = :documento',
      { documento }
    );

    if (existingUser.rows[0][0] === 0) {
      return errorResponse(res, null, 'Usuario no encontrado', 404);
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

    if (typeof idPerfil !== 'undefined') {
      const profileUpdate = await connection.execute(
        `UPDATE USUARIO_PERFIL SET ID_PER_UPE = :idPerfil WHERE DOCUMENTO_USU_UPE = :documento`,
        { idPerfil, documento }
      );

      if (profileUpdate.rowsAffected === 0) {
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
      }
    }

    successResponse(res, { documento, email, nombres, primerApellido, idEstado, idPerfil }, 'Usuario actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar usuario', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

export async function deleteUsuario(req, res) {
  const { documento } = req.params;

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

    await connection.execute(
      'DELETE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento',
      { documento }
    );
    await connection.execute(
      'DELETE FROM USUARIO WHERE DOCUMENTO_USU = :documento',
      { documento }
    );

    successResponse(res, { documento }, 'Usuario eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar usuario', 500);
  } finally {
    if (connection) await connection?.close();
  }
}
