import { getConnection } from '../db.js';
import { errorResponse, successResponse } from '../utils/response.js';

export async function getChatGroups(req, res) {
  const documento = req.user?.documento;

  if (!documento) {
    return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
  }

  let connection;

  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT r.ID_RUT,
              r.LATITUD_DESTINO_RUT,
              r.LONGITUD_DESTINO_RUT,
              TO_CHAR(r.HORA_SALIDA_RUT, 'YYYY-MM-DD HH24:MI') AS HORA_SALIDA,
              CASE
                WHEN EXISTS (
                  SELECT 1
                  FROM USUARIO_PERFIL up
                  WHERE up.ID_UPE = r.ID_UPE_RUT
                    AND up.DOCUMENTO_USU_UPE = :documento
                ) THEN 'CONDUCTOR'
                ELSE 'PASAJERO'
              END AS ROL
       FROM RUTA r
       WHERE EXISTS (
         SELECT 1
         FROM USUARIO_PERFIL up
         WHERE up.ID_UPE = r.ID_UPE_RUT
           AND up.DOCUMENTO_USU_UPE = :documento
       )
       OR EXISTS (
         SELECT 1
         FROM SOLICITUD_CUPO s
         JOIN USUARIO_PERFIL up ON up.ID_UPE = s.ID_UPE_SOL
         JOIN ESTADO_SOLICITUD es ON es.ID_ESO = s.ID_ESO_SOL
         WHERE s.ID_RUT_SOL = r.ID_RUT
           AND up.DOCUMENTO_USU_UPE = :documento
           AND es.NOMBRE_ESO = 'ACEPTADA'
       )
       ORDER BY r.HORA_SALIDA_RUT DESC`,
      { documento }
    );

    const groups = result.rows.map((row) => ({
      routeId: row[0],
      destinationLatitude: row[1],
      destinationLongitude: row[2],
      departure: row[3],
      role: row[4],
    }));

    return successResponse(res, groups, 'Chats grupales obtenidos correctamente');
  } catch (error) {
    return errorResponse(res, error, 'Error al obtener los chats grupales', 500);
  } finally {
    if (connection) await connection.close();
  }
}

async function userCanAccessRoute(connection, routeId, documento) {
  const result = await connection.execute(
    `SELECT 1
     FROM RUTA r
     WHERE r.ID_RUT = :routeId
       AND (
         EXISTS (
           SELECT 1
           FROM USUARIO_PERFIL up
           WHERE up.ID_UPE = r.ID_UPE_RUT
             AND up.DOCUMENTO_USU_UPE = :documento
         )
         OR EXISTS (
           SELECT 1
           FROM SOLICITUD_CUPO s
           JOIN USUARIO_PERFIL up ON up.ID_UPE = s.ID_UPE_SOL
           JOIN ESTADO_SOLICITUD es ON es.ID_ESO = s.ID_ESO_SOL
           WHERE s.ID_RUT_SOL = r.ID_RUT
             AND up.DOCUMENTO_USU_UPE = :documento
             AND es.NOMBRE_ESO = 'ACEPTADA'
         )
       )`,
    { routeId, documento }
  );

  return result.rows.length > 0;
}

function getRequestValues(req) {
  const documento = req.user?.documento;
  const routeId = Number(req.params.id);

  if (!documento) {
    return { error: { status: 401, message: 'Usuario no autenticado' } };
  }

  if (!Number.isSafeInteger(routeId) || routeId <= 0) {
    return { error: { status: 400, message: 'El ID de ruta debe ser un entero positivo' } };
  }

  return { documento, routeId };
}

export async function getMessages(req, res) {
  const values = getRequestValues(req);
  if (values.error) {
    return res.status(values.error.status).json({ success: false, message: values.error.message });
  }

  const { documento, routeId } = values;
  let connection;

  try {
    connection = await getConnection();
    if (!(await userCanAccessRoute(connection, routeId, documento))) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a los mensajes de esta ruta',
      });
    }

    const result = await connection.execute(
      `SELECT m.ID_MSG,
              m.ID_RUT_MSG,
              NVL(u.NOMBRES_USU, '') || ' ' || NVL(u.PRIMER_APELLIDO_USU, '') AS NOMBRE_REMITENTE,
              m.CONTENIDO_MSG,
              m.FECHA_ENVIO_MSG
       FROM MENSAJE_RUTA m
       JOIN USUARIO u ON u.DOCUMENTO_USU = m.DOCUMENTO_USU_MSG
       WHERE m.ID_RUT_MSG = :routeId
       ORDER BY m.FECHA_ENVIO_MSG ASC, m.ID_MSG ASC`,
      { routeId }
    );

    const messages = result.rows.map((row) => ({
      id: row[0],
      routeId: row[1],
      senderName: row[2].trim(),
      content: row[3],
      sentAt: row[4],
    }));

    return successResponse(res, messages, 'Mensajes obtenidos correctamente');
  } catch (error) {
    return errorResponse(res, error, 'Error al obtener los mensajes', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function createMessage(req, res) {
  const values = getRequestValues(req);
  if (values.error) {
    return res.status(values.error.status).json({ success: false, message: values.error.message });
  }

  const { documento, routeId } = values;
  const content = typeof req.body?.contenido === 'string' ? req.body.contenido.trim() : '';

  if (!content || content.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'El contenido es obligatorio y no puede superar 1000 caracteres',
    });
  }

  let connection;

  try {
    connection = await getConnection();
    if (!(await userCanAccessRoute(connection, routeId, documento))) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a los mensajes de esta ruta',
      });
    }

    await connection.execute(
      `INSERT INTO MENSAJE_RUTA (
         ID_RUT_MSG,
         DOCUMENTO_USU_MSG,
         CONTENIDO_MSG
       ) VALUES (
         :routeId,
         :documento,
         :content
       )`,
      { routeId, documento, content },
      { autoCommit: true }
    );

    return successResponse(
      res,
      { routeId, content },
      'Mensaje enviado correctamente',
      201
    );
  } catch (error) {
    return errorResponse(res, error, 'Error al enviar el mensaje', 500);
  } finally {
    if (connection) await connection.close();
  }
}
