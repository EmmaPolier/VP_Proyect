import { getConnection } from '../db.js';

const MAX_CONTACTOS_POR_USUARIO = 5;
const CODIGOS_ERROR = {
  400: 'DATOS_INVALIDOS',
  401: 'NO_AUTENTICADO',
  404: 'NO_ENCONTRADO',
  409: 'CONFLICTO',
  500: 'ERROR_INTERNO'
};
const CAMPOS_CONTACTO = {
  nombre: { columna: 'NOMBRE_CEM', maximo: 100 },
  relacion: { columna: 'RELACION_CEM', maximo: 50 },
  correo: { columna: 'CORREO_CEM', maximo: 150 }
};
const COLUMNA_ACTIVO = 'ACTIVO_CEM';

function responderError(res, status, message, code = CODIGOS_ERROR[status]) {
  return res.status(status).json({
    success: false,
    message,
    error: code,
    timestamp: new Date().toISOString()
  });
}

function responderExito(res, status, message, data) {
  return res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

function validarId(id) {
  if (typeof id !== 'string' || !/^[1-9]\d*$/.test(id)) return null;
  const idNumerico = Number(id);
  return Number.isSafeInteger(idNumerico) && idNumerico > 0 ? idNumerico : null;
}

function validarPayload(body, parcial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'El cuerpo de la solicitud debe ser un objeto' };
  }

  const keys = Object.keys(body);
  const camposDesconocidos = keys.filter((key) =>
    !Object.hasOwn(CAMPOS_CONTACTO, key) && !(parcial && key === 'activo')
  );
  if (camposDesconocidos.length > 0) {
    return { error: `Campos no permitidos: ${camposDesconocidos.join(', ')}` };
  }

  if (parcial && keys.length === 0) {
    return { error: 'Debes enviar al menos un campo para actualizar' };
  }

  const valores = {};
  for (const [campo, regla] of Object.entries(CAMPOS_CONTACTO)) {
    if (!Object.hasOwn(body, campo)) {
      if (!parcial) return { error: `El campo ${campo} es obligatorio` };
      continue;
    }

    if (typeof body[campo] !== 'string') {
      return { error: `El campo ${campo} debe ser texto` };
    }

    const valor = body[campo].trim();
    if (valor.length === 0 || valor.length > regla.maximo) {
      return { error: `El campo ${campo} debe tener entre 1 y ${regla.maximo} caracteres` };
    }

    valores[campo] = campo === 'correo' ? valor.toLowerCase() : valor;
  }

  if (Object.hasOwn(body, 'activo')) {
    if (typeof body.activo !== 'boolean') {
      return { error: 'El campo activo debe ser booleano' };
    }
    valores.activo = body.activo;
  }

  if (Object.hasOwn(valores, 'correo') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.correo)) {
    return { error: 'El correo electrónico no tiene un formato válido' };
  }

  return { valores };
}

function convertirContacto(row) {
  return {
    id: row[0],
    nombre: row[1],
    relacion: row[2],
    correo: row[3],
    activo: row[4] === 'S'
  };
}

function esCorreoDuplicado(error) {
  return error?.errorNum === 1;
}

export async function listarContactosEmergencia(req, res) {
  const documento = req.user?.documento;
  if (!documento) return responderError(res, 401, 'Usuario no autenticado');

  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT ID_CEM, NOMBRE_CEM, RELACION_CEM, CORREO_CEM, ACTIVO_CEM
       FROM CONTACTO_EMERGENCIA
       WHERE DOCUMENTO_USU_CEM = :documento
       ORDER BY FECHA_CREACION_CEM DESC, ID_CEM DESC`,
      { documento }
    );

    return responderExito(
      res,
      200,
      'Contactos obtenidos correctamente',
      (result.rows || []).map(convertirContacto)
    );
  } catch {
    return responderError(res, 500, 'No fue posible obtener los contactos de emergencia');
  } finally {
    if (connection) await connection.close();
  }
}

export async function crearContactoEmergencia(req, res) {
  const documento = req.user?.documento;
  if (!documento) return responderError(res, 401, 'Usuario no autenticado');

  const { error, valores } = validarPayload(req.body);
  if (error) return responderError(res, 400, error);

  let connection;
  try {
    connection = await getConnection();
    connection.autoCommit = false;
    await connection.execute(
      'SELECT DOCUMENTO_USU FROM USUARIO WHERE DOCUMENTO_USU = :documento FOR UPDATE',
      { documento }
    );

    const countResult = await connection.execute(
      `SELECT COUNT(*) FROM CONTACTO_EMERGENCIA
       WHERE DOCUMENTO_USU_CEM = :documento AND ACTIVO_CEM = 'S'`,
      { documento }
    );
    if (countResult.rows?.[0]?.[0] >= MAX_CONTACTOS_POR_USUARIO) {
      await connection.rollback();
      return responderError(
        res,
        409,
        `No puedes registrar más de ${MAX_CONTACTOS_POR_USUARIO} contactos activos`,
        'LIMITE_CONTACTOS_ACTIVOS'
      );
    }

    const sequenceResult = await connection.execute(
      'SELECT SEQ_CONTACTO_EMERGENCIA.NEXTVAL FROM DUAL'
    );
    const id = sequenceResult.rows[0][0];

    await connection.execute(
      `INSERT INTO CONTACTO_EMERGENCIA (
         ID_CEM, DOCUMENTO_USU_CEM, NOMBRE_CEM, RELACION_CEM, CORREO_CEM, FECHA_CREACION_CEM, ACTIVO_CEM
       ) VALUES (
         :id, :documento, :nombre, :relacion, :correo, SYSDATE, 'S'
       )`,
      { id, documento, ...valores },
      { autoCommit: false }
    );
    await connection.commit();

    return responderExito(res, 201, 'Contacto creado correctamente', { id, ...valores, activo: true });
  } catch (error) {
    if (connection) await connection.rollback();
    if (esCorreoDuplicado(error)) {
      return responderError(res, 409, 'Ya existe un contacto con ese correo', 'CORREO_DUPLICADO');
    }
    return responderError(res, 500, 'No fue posible crear el contacto de emergencia');
  } finally {
    if (connection) await connection.close();
  }
}

export async function editarContactoEmergencia(req, res) {
  const documento = req.user?.documento;
  if (!documento) return responderError(res, 401, 'Usuario no autenticado');

  const id = validarId(req.params.id);
  if (!id) return responderError(res, 400, 'El ID debe ser un entero positivo');

  const { error, valores } = validarPayload(req.body, true);
  if (error) return responderError(res, 400, error);

  let connection;
  try {
    connection = await getConnection();
    connection.autoCommit = false;

    await connection.execute(
      'SELECT DOCUMENTO_USU FROM USUARIO WHERE DOCUMENTO_USU = :documento FOR UPDATE',
      { documento }
    );
    const contactoActualResult = await connection.execute(
      `SELECT ACTIVO_CEM FROM CONTACTO_EMERGENCIA
       WHERE ID_CEM = :id AND DOCUMENTO_USU_CEM = :documento FOR UPDATE`,
      { id, documento }
    );
    if (!contactoActualResult.rows?.length) {
      await connection.rollback();
      return responderError(res, 404, 'Contacto no encontrado');
    }

    const activoActual = contactoActualResult.rows[0][0] === 'S';
    if (valores.activo === true && !activoActual) {
      const countResult = await connection.execute(
        `SELECT COUNT(*) FROM CONTACTO_EMERGENCIA
         WHERE DOCUMENTO_USU_CEM = :documento AND ACTIVO_CEM = 'S'`,
        { documento }
      );
      if (countResult.rows?.[0]?.[0] >= MAX_CONTACTOS_POR_USUARIO) {
        await connection.rollback();
        return responderError(
          res,
          409,
          `No puedes tener más de ${MAX_CONTACTOS_POR_USUARIO} contactos activos`,
          'LIMITE_CONTACTOS_ACTIVOS'
        );
      }
    }

    const valoresSql = { ...valores };
    if (Object.hasOwn(valoresSql, 'activo')) {
      valoresSql.activo = valoresSql.activo ? 'S' : 'N';
    }
    const asignaciones = Object.keys(valores)
      .map((campo) => `${campo === 'activo' ? COLUMNA_ACTIVO : CAMPOS_CONTACTO[campo].columna} = :${campo}`)
      .join(', ');
    const result = await connection.execute(
      `UPDATE CONTACTO_EMERGENCIA
       SET ${asignaciones}
       WHERE ID_CEM = :id AND DOCUMENTO_USU_CEM = :documento`,
      { ...valoresSql, id, documento },
      { autoCommit: false }
    );

    if (result.rowsAffected === 0) {
      await connection.rollback();
      return responderError(res, 404, 'Contacto no encontrado');
    }

    await connection.commit();
    return responderExito(res, 200, 'Contacto actualizado correctamente', {
      id,
      ...valores,
      ...(Object.hasOwn(valores, 'activo') ? {} : { activo: activoActual })
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (esCorreoDuplicado(error)) {
      return responderError(res, 409, 'Ya existe un contacto con ese correo', 'CORREO_DUPLICADO');
    }
    return responderError(res, 500, 'No fue posible actualizar el contacto de emergencia');
  } finally {
    if (connection) await connection.close();
  }
}

export async function eliminarContactoEmergencia(req, res) {
  const documento = req.user?.documento;
  if (!documento) return responderError(res, 401, 'Usuario no autenticado');

  const id = validarId(req.params.id);
  if (!id) return responderError(res, 400, 'El ID debe ser un entero positivo');

  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `DELETE FROM CONTACTO_EMERGENCIA
       WHERE ID_CEM = :id AND DOCUMENTO_USU_CEM = :documento`,
      { id, documento }
    );

    if (result.rowsAffected === 0) {
      return responderError(res, 404, 'Contacto no encontrado');
    }

    return responderExito(res, 200, 'Contacto eliminado correctamente', { id, eliminado: true });
  } catch {
    return responderError(res, 500, 'No fue posible eliminar el contacto de emergencia');
  } finally {
    if (connection) await connection.close();
  }
}