import { getConnection } from '../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

// Helper borrowed from route.controller.js to lookup ids by name
async function getIdByName(connection, table, idField, nameField, nameValue) {
  const result = await connection.execute(
    `SELECT ${idField} FROM ${table} WHERE ${nameField} = :nameValue`,
    { nameValue }
  );
  return result.rows.length ? result.rows[0][0] : null;
}
/**
 * Crear una nueva calificación
 * POST /api/calificaciones
 * Body: { solId, rutId, documentoCalificador, documentoCalificado, puntaje, comentario, rolCalificador }
 */
export async function createCalificacion(req, res) {
  const {
    solId,
    rutId,
    documentoCalificador,
    documentoCalificado,
    puntaje,
    comentario,
    rolCalificador,
  } = req.body;

  const normalizedDocumentoCalificador = String(documentoCalificador || '').trim();
  const normalizedDocumentoCalificado = String(documentoCalificado || '').trim();
  const score = Number(puntaje);

  // Validaciones
  if (!solId || !rutId || !normalizedDocumentoCalificador || !normalizedDocumentoCalificado || !rolCalificador) {
    return errorResponse(res, null, 'Faltan campos requeridos', 400);
  }

  if (Number.isNaN(score) || score < 1 || score > 5) {
    return errorResponse(res, null, 'El puntaje debe estar entre 1 y 5', 400);
  }

  if (!['PASAJERO', 'CONDUCTOR'].includes(rolCalificador)) {
    return errorResponse(res, null, 'Rol inválido. Debe ser PASAJERO o CONDUCTOR', 400);
  }

  if (normalizedDocumentoCalificador === normalizedDocumentoCalificado) {
    return errorResponse(res, null, 'No puedes calificarte a ti mismo', 400);
  }

  const usuarioActual = String(req.user?.documento || '').trim();
  if (!usuarioActual) {
    return errorResponse(res, null, 'Usuario no autenticado', 401);
  }

  if (usuarioActual !== normalizedDocumentoCalificador) {
    return errorResponse(res, null, 'El documento del calificador debe coincidir con el usuario autenticado', 403);
  }

  let connection;

  try {
    connection = await getConnection();
    const acceptedStatusId = await getIdByName(connection, 'ESTADO_SOLICITUD', 'ID_ESO', 'NOMBRE_ESO', 'ACEPTADA');

    const solResult = await connection.execute(
      `SELECT
         s.ID_ESO_SOL,
         er.NOMBRE_ERU AS ROUTE_STATUS,
         pu.DOCUMENTO_USU_UPE AS PASSENGER_DOCUMENT,
         dupe.DOCUMENTO_USU_UPE AS DRIVER_DOCUMENT
       FROM SOLICITUD_CUPO s
       JOIN RUTA r ON r.ID_RUT = s.ID_RUT_SOL
       JOIN ESTADO_RUTA er ON er.ID_ERU = r.ID_EST_RUT
       LEFT JOIN USUARIO_PERFIL pu ON pu.ID_UPE = s.ID_UPE_SOL
       LEFT JOIN USUARIO_PERFIL dupe ON dupe.ID_UPE = r.ID_UPE_RUT
       WHERE s.ID_SOL = :solId AND s.ID_RUT_SOL = :rutId`,
      { solId, rutId }
    );

    if (!solResult.rows.length) {
      return errorResponse(res, null, 'La solicitud o ruta no existen', 404);
    }

    const [solEstado, routeStatus, passengerDocument, driverDocument] = solResult.rows[0];
    if (routeStatus !== 'COMPLETADA') {
      return errorResponse(res, null, 'Solo se puede calificar una ruta completada', 400);
    }

    if (acceptedStatusId && solEstado !== acceptedStatusId) {
      return errorResponse(res, null, 'Solo se pueden calificar solicitudes aceptadas', 400);
    }

    if (rolCalificador === 'PASAJERO') {
      if (normalizedDocumentoCalificador !== passengerDocument || normalizedDocumentoCalificado !== driverDocument) {
        return errorResponse(res, null, 'No puedes calificar a este usuario como pasajero', 403);
      }
    } else {
      if (normalizedDocumentoCalificador !== driverDocument || normalizedDocumentoCalificado !== passengerDocument) {
        return errorResponse(res, null, 'No puedes calificar a este usuario como conductor', 403);
      }
    }

    // Verificar que el CUPO_RUTA existe
    const cupResult = await connection.execute(
      `SELECT COUNT(*) as count FROM CUPO_RUTA WHERE ID_SOL_CRU = :solId AND ID_RUT_CRU = :rutId`,
      { solId, rutId }
    );

    if (cupResult.rows[0][0] === 0) {
      return errorResponse(res, null, 'La solicitud o ruta no existen', 404);
    }

    // Verificar que no exista ya una calificación del mismo calificador para este viaje
    const existingResult = await connection.execute(
      `SELECT COUNT(*) as count FROM CALIFICACION 
       WHERE SOL_ID_CAL = :solId AND RUT_ID_CAL = :rutId AND DOCUMENTO_CALIFICADOR_CAL = :documentoCalificador`,
      { solId, rutId, documentoCalificador: normalizedDocumentoCalificador }
    );

    if (existingResult.rows[0][0] > 0) {
      return errorResponse(res, null, 'Ya existe una calificación tuya para este viaje', 400);
    }

    // Insertar calificación
    await connection.execute(
      `INSERT INTO CALIFICACION (
        ID_CAL,
        SOL_ID_CAL,
        RUT_ID_CAL,
        DOCUMENTO_CALIFICADOR_CAL,
        DOCUMENTO_CALIFICADO_CAL,
        PUNTAJE_CAL,
        COMENTARIO_CAL,
        ROL_CALIFICADOR_CAL,
        FECHA_CREACION_CAL
       ) VALUES (
        SEQ_CALIFICACION.NEXTVAL,
        :solId,
        :rutId,
        :documentoCalificador,
        :documentoCalificado,
        :puntaje,
        :comentario,
        :rolCalificador,
        SYSDATE
       )`,
      {
        solId,
        rutId,
        documentoCalificador: normalizedDocumentoCalificador,
        documentoCalificado: normalizedDocumentoCalificado,
        puntaje: score,
        comentario: comentario || null,
        rolCalificador,
      }
    );

    // Actualizar promedio de calificación en USUARIO_PERFIL
    const promedioResult = await connection.execute(
      `SELECT ROUND(AVG(PUNTAJE_CAL), 1) as promedio
       FROM CALIFICACION
       WHERE DOCUMENTO_CALIFICADO_CAL = :documentoCalificado`,
      { documentoCalificado: normalizedDocumentoCalificado }
    );

    const promedio = promedioResult.rows[0][0] || 5.0;

    await connection.execute(
      `UPDATE USUARIO_PERFIL SET CALIFICACION_UPE = :promedio
       WHERE DOCUMENTO_USU_UPE = :documentoCalificado`,
      { promedio, documentoCalificado: normalizedDocumentoCalificado }
    );

    await connection.commit();

    successResponse(res, { solId, rutId, puntaje, promedio }, 'Calificación registrada exitosamente');
  } catch (error) {
    if (connection) await connection.rollback();
    errorResponse(res, error, 'Error al crear calificación', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

/**
 * Obtener calificación/rating de un usuario
 * GET /api/usuario/:documento/calificacion
 */
export async function getCalificacionUsuario(req, res) {
  const { documento } = req.params;

  if (!documento) {
    return errorResponse(res, null, 'Documento es requerido', 400);
  }

  let connection;

  try {
    connection = await getConnection();

    // Obtener promedio de calificaciones
    const result = await connection.execute(
      `SELECT 
         ROUND(AVG(PUNTAJE_CAL), 1) as promedio,
         COUNT(*) as totalCalificaciones,
         MIN(PUNTAJE_CAL) as minimo,
         MAX(PUNTAJE_CAL) as maximo
       FROM CALIFICACION
       WHERE DOCUMENTO_CALIFICADO_CAL = :documento`,
      { documento }
    );

    const row = result.rows[0];
    const promedio = row[0] || 5.0;
    const totalCalificaciones = row[1] || 0;
    const minimo = row[2] || null;
    const maximo = row[3] || null;

    // Obtener últimas 5 calificaciones
    const calificacionesResult = await connection.execute(
      `SELECT 
         ID_CAL,
         DOCUMENTO_CALIFICADOR_CAL,
         PUNTAJE_CAL,
         COMENTARIO_CAL,
         ROL_CALIFICADOR_CAL,
         TO_CHAR(FECHA_CREACION_CAL, 'YYYY-MM-DD HH24:MI:SS') as fechaCreacion
       FROM CALIFICACION
       WHERE DOCUMENTO_CALIFICADO_CAL = :documento
       ORDER BY FECHA_CREACION_CAL DESC
       FETCH FIRST 5 ROWS ONLY`,
      { documento }
    );

    const calificaciones = calificacionesResult.rows.map((row) => ({
      id: row[0],
      calificador: 'Anónimo',
      puntaje: row[2],
      comentario: row[3],
      rol: row[4],
      fecha: row[5],
    }));

    successResponse(
      res,
      {
        documento,
        promedio,
        totalCalificaciones,
        minimo,
        maximo,
        calificaciones,
      },
      'Calificaciones obtenidas exitosamente'
    );
  } catch (error) {
    errorResponse(res, error, 'Error al obtener calificaciones', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

/**
 * Obtener todas las calificaciones de un usuario (con paginación)
 * GET /api/calificaciones?documento=xxx&page=1&pageSize=10
 */
export async function getCalificaciones(req, res) {
  const { documento } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;

  if (!documento) {
    return errorResponse(res, null, 'Documento es requerido', 400);
  }

  let connection;

  try {
    connection = await getConnection();

    // Contar total
    const totalResult = await connection.execute(
      `SELECT COUNT(*) as total FROM CALIFICACION WHERE DOCUMENTO_CALIFICADO_CAL = :documento`,
      { documento }
    );
    const total = totalResult.rows[0][0];

    // Obtener calificaciones paginadas
    const result = await connection.execute(
      `SELECT 
         ID_CAL,
         SOL_ID_CAL,
         RUT_ID_CAL,
         DOCUMENTO_CALIFICADOR_CAL,
         PUNTAJE_CAL,
         COMENTARIO_CAL,
         ROL_CALIFICADOR_CAL,
         TO_CHAR(FECHA_CREACION_CAL, 'YYYY-MM-DD HH24:MI:SS') as fechaCreacion
       FROM CALIFICACION
       WHERE DOCUMENTO_CALIFICADO_CAL = :documento
       ORDER BY FECHA_CREACION_CAL DESC
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { documento, offset, pageSize }
    );

    const calificaciones = result.rows.map((row) => ({
      id: row[0],
      solId: row[1],
      rutId: row[2],
      calificador: 'Anónimo',
      puntaje: row[4],
      comentario: row[5],
      rol: row[6],
      fecha: row[7],
    }));

    paginatedResponse(res, calificaciones, page, pageSize, total, 'Calificaciones obtenidas exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener calificaciones', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

/**
 * Obtener estadísticas de calificaciones de un usuario
 * GET /api/calificaciones/:documento/estadisticas
 */
export async function getEstadisticasCalificacion(req, res) {
  const { documento } = req.params;

  if (!documento) {
    return errorResponse(res, null, 'Documento es requerido', 400);
  }

  let connection;

  try {
    connection = await getConnection();

    // Obtener estadísticas por rol
    const result = await connection.execute(
      `SELECT 
         ROL_CALIFICADOR_CAL,
         COUNT(*) as cantidad,
         ROUND(AVG(PUNTAJE_CAL), 2) as promedio,
         MIN(PUNTAJE_CAL) as minimo,
         MAX(PUNTAJE_CAL) as maximo
       FROM CALIFICACION
       WHERE DOCUMENTO_CALIFICADO_CAL = :documento
       GROUP BY ROL_CALIFICADOR_CAL`,
      { documento }
    );

    const estadisticas = {};
    let totalCalificaciones = 0;
    let promediaGeneral = 0;

    result.rows.forEach((row) => {
      const rol = row[0];
      const cantidad = row[1];
      const promedio = row[2];
      totalCalificaciones += cantidad;

      estadisticas[rol] = {
        cantidad,
        promedio,
        minimo: row[3],
        maximo: row[4],
      };
    });

    // Calcular promedio general
    if (totalCalificaciones > 0) {
      const promedioResult = await connection.execute(
        `SELECT ROUND(AVG(PUNTAJE_CAL), 2) as promedio FROM CALIFICACION WHERE DOCUMENTO_CALIFICADO_CAL = :documento`,
        { documento }
      );
      promediaGeneral = promedioResult.rows[0][0];
    }

    successResponse(
      res,
      {
        documento,
        totalCalificaciones,
        promediaGeneral,
        porRol: estadisticas,
      },
      'Estadísticas obtenidas exitosamente'
    );
  } catch (error) {
    errorResponse(res, error, 'Error al obtener estadísticas', 500);
  } finally {
    if (connection) await connection?.close();
  }
}
