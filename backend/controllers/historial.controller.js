import { getConnection } from '../db.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function getHistorial(req, res) {
  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    connection = await getConnection();

    // Obtener historial del usuario
    const historialResult = await connection.execute(
      `SELECT
         h.ID_HIS,
         h.SOL_ID_HIS,
         h.RUT_ID_HIS,
         h.DOCUMENTO_USU_HIS,
         h.ROL_VIAJE_HIS,
         h.FECHA_VIAJE_HIS
       FROM HISTORIAL_VIAJE h
       WHERE h.DOCUMENTO_USU_HIS = :doc
       ORDER BY h.FECHA_VIAJE_HIS DESC
       FETCH FIRST 50 ROWS ONLY`,
      { doc: documento }
    );

    const historial = (historialResult.rows || []).map(row => ({
      id: row[0],
      solicitudId: row[1],
      rutaId: row[2],
      documentoUsuario: row[3],
      rolViaje: row[4],
      fechaViaje: row[5]
    }));

    successResponse(res, historial, 'Historial obtenido exitosamente', 200);
  } catch (error) {
    console.error('[ERROR] Error al obtener historial:', error);
    errorResponse(res, error, 'Error al obtener historial', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getHistorialDetalle(req, res) {
  const historialId = Number(req.params.id);
  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    connection = await getConnection();

    // Obtener detalle del historial
    const detalleResult = await connection.execute(
      `SELECT
         h.ID_HIS,
         h.SOL_ID_HIS,
         h.RUT_ID_HIS,
         h.DOCUMENTO_USU_HIS,
         h.ROL_VIAJE_HIS,
         h.FECHA_VIAJE_HIS
       FROM HISTORIAL_VIAJE h
       WHERE h.ID_HIS = :historialId
         AND h.DOCUMENTO_USU_HIS = :doc`,
      { historialId, doc: documento }
    );

    if (!detalleResult.rows || detalleResult.rows.length === 0) {
      return res.status(404).json({ message: 'Historial no encontrado' });
    }

    const row = detalleResult.rows[0];

    const detalle = {
      id: row[0],
      solicitudId: row[1],
      rutaId: row[2],
      documentoUsuario: row[3],
      rolViaje: row[4],
      fechaViaje: row[5]
    };

    successResponse(res, detalle, 'Detalle de historial obtenido', 200);
  } catch (error) {
    console.error('[ERROR] Error al obtener detalle de historial:', error);
    errorResponse(res, error, 'Error al obtener detalle de historial', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function createHistorial(req, res) {
  const {
    solicitudId,
    rutaId,
    rolViaje
  } = req.body;

  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    connection = await getConnection();

    // Insertar historial
    await connection.execute(
      `INSERT INTO HISTORIAL_VIAJE (
         ID_HIS,
         SOL_ID_HIS,
         RUT_ID_HIS,
         DOCUMENTO_USU_HIS,
         ROL_VIAJE_HIS,
         FECHA_VIAJE_HIS
       ) VALUES (
         SEQ_HISTORIAL_VIAJE.NEXTVAL,
         :solicitudId,
         :rutaId,
         :documento,
         :rolViaje,
         SYSDATE
       )`,
      {
        solicitudId,
        rutaId,
        documento,
        rolViaje
      },
      { autoCommit: true }
    );

    const sequenceResult = await connection.execute(`SELECT SEQ_HISTORIAL_VIAJE.CURRVAL FROM DUAL`);
    const historialId = sequenceResult.rows.length ? sequenceResult.rows[0][0] : null;

    successResponse(res, { historialId }, 'Historial creado exitosamente', 201);
  } catch (error) {
    console.error('[ERROR] Error al crear historial:', error);
    errorResponse(res, error, 'Error al crear historial', 500);
  } finally {
    if (connection) await connection.close();
  }
}
