import { getConnection } from '../db.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function recargarCartera(req, res) {
  const documento = req.user && req.user.documento;
  const { monto, tipoTransaccionId } = req.body;

  if (!documento) return res.status(401).json({ error: 'Usuario no autenticado' });
  if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: 'Monto inválido' });
  }

  let connection;
  try {
    connection = await getConnection();

    // Obtener saldo actual
    const userRes = await connection.execute(
      `SELECT SALDO_CARTERA_USU FROM USUARIO WHERE DOCUMENTO_USU = :doc`,
      { doc: documento }
    );

    const currentSaldo = (userRes.rows && userRes.rows.length > 0) ? Number(userRes.rows[0][0]) : 0;
    const nuevaSaldo = +(currentSaldo + parseFloat(monto)).toFixed(2);

    // Actualizar saldo en USUARIO
    await connection.execute(
      `UPDATE USUARIO SET SALDO_CARTERA_USU = :saldo WHERE DOCUMENTO_USU = :doc`,
      { saldo: nuevaSaldo, doc: documento }
    );

    // Insertar transacción en TRANSACCIONES_CARTERA
    const tipoId = tipoTransaccionId || 1; // 1 = RECARGA por convención
    await connection.execute(
      `INSERT INTO TRANSACCIONES_CARTERA (ID_TRA, DOCUMENTO_USU_TRA, ID_TTR_TRA, MONTO_TRA, SALDO_RESULTANTE_TRA, FECHA_REALIZACION_TRA)
       VALUES (SEQ_TRANSACCIONES_CARTERA.NEXTVAL, :doc, :tipoId, :monto, :saldo, SYSDATE)`,
      { doc: documento, tipoId: parseInt(tipoId), monto: parseFloat(monto), saldo: nuevaSaldo }
    );

    await connection.close();

    return successResponse(res, { saldo: nuevaSaldo }, 'Recarga exitosa', 201);
  } catch (err) {
    console.error('[ERROR] recargarCartera:', err);
    if (connection) await connection.close();
    return errorResponse(res, err, 'Error interno', 500);
  }
}

export async function obtenerSaldo(req, res) {
  const documento = req.user && req.user.documento;
  if (!documento) return res.status(401).json({ error: 'Usuario no autenticado' });

  let connection;
  try {
    connection = await getConnection();
    const userRes = await connection.execute(
      `SELECT SALDO_CARTERA_USU FROM USUARIO WHERE DOCUMENTO_USU = :doc`,
      { doc: documento }
    );

    const currentSaldo = (userRes.rows && userRes.rows.length > 0) ? Number(userRes.rows[0][0]) : 0;
    await connection.close();
    return successResponse(res, { saldo: +currentSaldo.toFixed(2) }, 'Saldo obtenido exitosamente');
  } catch (err) {
    console.error('[ERROR] obtenerSaldo:', err);
    if (connection) await connection.close();
    return errorResponse(res, err, 'Error interno', 500);
  }
}

export async function obtenerHistorial(req, res) {
  const documento = req.user && req.user.documento;
  if (!documento) return res.status(401).json({ error: 'Usuario no autenticado' });

  let connection;
  try {
    connection = await getConnection();
    const txRes = await connection.execute(
      `SELECT T.ID_TRA, T.ID_TTR_TRA, TT.NOMBRE_TTR, T.MONTO_TRA, T.SALDO_RESULTANTE_TRA, T.FECHA_REALIZACION_TRA
       FROM TRANSACCIONES_CARTERA T
       LEFT JOIN TIPO_TRANSACCION TT ON TT.ID_TTR = T.ID_TTR_TRA
       WHERE T.DOCUMENTO_USU_TRA = :doc
       ORDER BY T.FECHA_REALIZACION_TRA DESC`,
      { doc: documento }
    );

    // Map rows to objects (Oracle returns arrays)
    const rows = (txRes.rows || []).map(r => ({
      id: r[0],
      tipoId: r[1],
      tipoNombre: r[2] || null,
      monto: Number(r[3]),
      saldoResultante: Number(r[4]),
      fecha: r[5]
    }));

    await connection.close();
    return successResponse(res, { historial: rows }, 'Historial obtenido exitosamente');
  } catch (err) {
    console.error('[ERROR] obtenerHistorial:', err);
    if (connection) await connection.close();
    return errorResponse(res, err, 'Error interno', 500);
  }
}

export default { recargarCartera, obtenerSaldo, obtenerHistorial };
