import { getConnection } from '../db.js';
import { successResponse, errorResponse } from '../utils/response.js';

// IDs del seed (4scripts_DML_VamonosPues.sql)
const PERFIL_PASAJERO = 1;
const PERFIL_CONDUCTOR = 2;
const SOLICITUD_ACEPTADA = 2;
const CUPO_RESERVADO = 1;
const CUPO_COMPLETADO = 3;
const RUTA_ACTIVA = 1;
const RUTA_COMPLETADA = 3;
const RUTA_EN_CURSO = 4;
const MAX_FAVORITOS_POR_REQUEST = 50;

/**
 * Relación pasajero -> conductor: solicitud aceptada con cupo reservado/completado
 * en una ruta activa, en curso o completada. Requiere los binds :documento
 * (y :idUpe si se filtra por un conductor concreto).
 */
const RELACION_PASAJERO_CONDUCTOR = `
  FROM SOLICITUD_CUPO s
  JOIN USUARIO_PERFIL pas ON pas.ID_UPE = s.ID_UPE_SOL
  JOIN CUPO_RUTA cr ON cr.ID_SOL_CRU = s.ID_SOL
  JOIN RUTA r ON r.ID_RUT = cr.ID_RUT_CRU
  JOIN USUARIO_PERFIL up ON up.ID_UPE = r.ID_UPE_RUT
  JOIN USUARIO u ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
  WHERE pas.DOCUMENTO_USU_UPE = :documento
    AND pas.ID_PER_UPE = ${PERFIL_PASAJERO}
    AND s.ID_ESO_SOL = ${SOLICITUD_ACEPTADA}
    AND cr.ID_ECU_CRU IN (${CUPO_RESERVADO}, ${CUPO_COMPLETADO})
    AND r.ID_EST_RUT IN (${RUTA_ACTIVA}, ${RUTA_COMPLETADA}, ${RUTA_EN_CURSO})
    AND up.ID_PER_UPE = ${PERFIL_CONDUCTOR}
    AND up.DOCUMENTO_USU_UPE <> :documento`;

function getPasajero(req, res) {
  const documento = req.user?.documento;
  if (!documento || Number(req.user?.perfil) !== PERFIL_PASAJERO) {
    errorResponse(res, null, 'Acceso restringido a pasajeros', 403);
    return null;
  }
  return documento;
}

/**
 * Conductores favoritos del pasajero autenticado
 * GET /api/usuario/conductores-favoritos
 */
export async function getFavoritos(req, res) {
  const documento = getPasajero(req, res);
  if (!documento) return;

  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         up.ID_UPE,
         u.NOMBRES_USU,
         u.PRIMER_APELLIDO_USU,
         u.SEGUNDO_APELLIDO_USU,
         up.CALIFICACION_UPE,
         TO_CHAR(f.FECHA_CREACION_FCO, 'YYYY-MM-DD')
       FROM FAVORITO_CONDUCTOR f
       JOIN USUARIO_PERFIL up ON up.ID_UPE = f.ID_UPE_CONDUCTOR_FCO
       JOIN USUARIO u ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
       WHERE f.DOCUMENTO_USU_FCO = :documento
       ORDER BY f.FECHA_CREACION_FCO DESC`,
      { documento }
    );

    const data = result.rows.map((row) => ({
      idUpe: row[0],
      nombres: row[1],
      primerApellido: row[2],
      segundoApellido: row[3],
      calificacion: row[4],
      fechaAgregado: row[5],
    }));

    successResponse(res, data, 'Conductores favoritos obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener conductores favoritos', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

/**
 * Conductores con viaje activo o previo que aún no son favoritos
 * GET /api/usuario/conductores-favoritos/candidatos
 */
export async function getCandidatos(req, res) {
  const documento = getPasajero(req, res);
  if (!documento) return;

  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         up.ID_UPE,
         u.NOMBRES_USU,
         u.PRIMER_APELLIDO_USU,
         u.SEGUNDO_APELLIDO_USU,
         up.CALIFICACION_UPE,
         COUNT(DISTINCT r.ID_RUT) AS TOTAL_VIAJES,
         MAX(CASE WHEN r.ID_EST_RUT IN (${RUTA_ACTIVA}, ${RUTA_EN_CURSO})
                   AND cr.ID_ECU_CRU = ${CUPO_RESERVADO} THEN 1 ELSE 0 END) AS VIAJE_ACTIVO
       ${RELACION_PASAJERO_CONDUCTOR}
         AND NOT EXISTS (
           SELECT 1 FROM FAVORITO_CONDUCTOR f
           WHERE f.DOCUMENTO_USU_FCO = :documento
             AND f.ID_UPE_CONDUCTOR_FCO = up.ID_UPE
         )
       GROUP BY up.ID_UPE, u.NOMBRES_USU, u.PRIMER_APELLIDO_USU, u.SEGUNDO_APELLIDO_USU, up.CALIFICACION_UPE
       ORDER BY VIAJE_ACTIVO DESC, TOTAL_VIAJES DESC, u.NOMBRES_USU`,
      { documento }
    );

    const data = result.rows.map((row) => ({
      idUpe: row[0],
      nombres: row[1],
      primerApellido: row[2],
      segundoApellido: row[3],
      calificacion: row[4],
      totalViajes: row[5],
      viajeActivo: row[6] === 1,
    }));

    successResponse(res, data, 'Conductores disponibles obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener conductores disponibles', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

/**
 * Agregar varios conductores como favoritos
 * POST /api/usuario/conductores-favoritos  body: { idsUpeConductor: number[] }
 */
export async function addFavoritos(req, res) {
  const documento = getPasajero(req, res);
  if (!documento) return;

  const { idsUpeConductor } = req.body;

  if (!Array.isArray(idsUpeConductor) || idsUpeConductor.length === 0) {
    return errorResponse(res, null, 'Debes seleccionar al menos un conductor', 400);
  }

  const ids = [...new Set(idsUpeConductor.map(Number))];

  if (ids.length > MAX_FAVORITOS_POR_REQUEST || ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    return errorResponse(res, null, 'Lista de conductores inválida', 400);
  }

  let connection;
  try {
    connection = await getConnection();

    let agregados = 0;

    for (const idUpe of ids) {
      try {
        // Solo inserta si el conductor tiene relación válida con el pasajero y aún no es favorito
        const result = await connection.execute(
          `INSERT INTO FAVORITO_CONDUCTOR (
             ID_FCO,
             DOCUMENTO_USU_FCO,
             ID_UPE_CONDUCTOR_FCO,
             FECHA_CREACION_FCO
           )
           SELECT SEQ_FAVORITO_CONDUCTOR.NEXTVAL, :documento, :idUpe, SYSDATE
           FROM DUAL
           WHERE EXISTS (
             SELECT 1
             ${RELACION_PASAJERO_CONDUCTOR}
               AND up.ID_UPE = :idUpe
           )
           AND NOT EXISTS (
             SELECT 1 FROM FAVORITO_CONDUCTOR f
             WHERE f.DOCUMENTO_USU_FCO = :documento
               AND f.ID_UPE_CONDUCTOR_FCO = :idUpe
           )`,
          { documento, idUpe }
        );
        agregados += result.rowsAffected || 0;
      } catch (error) {
        // ORA-00001: ya era favorito (inserción concurrente), se omite
        if (error.errorNum !== 1) throw error;
      }
    }

    if (agregados === 0) {
      await connection.rollback();
      return errorResponse(res, null, 'Ninguno de los conductores seleccionados puede agregarse a favoritos', 400);
    }

    await connection.commit();

    successResponse(
      res,
      { agregados, omitidos: ids.length - agregados },
      agregados === 1 ? 'Conductor agregado a favoritos' : 'Conductores agregados a favoritos',
      201
    );
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    errorResponse(res, error, 'Error al agregar conductores favoritos', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

/**
 * Quitar un conductor de favoritos
 * DELETE /api/usuario/conductores-favoritos/:idUpe
 */
export async function removeFavorito(req, res) {
  const documento = getPasajero(req, res);
  if (!documento) return;

  const idUpe = Number(req.params.idUpe);
  if (!Number.isInteger(idUpe) || idUpe <= 0) {
    return errorResponse(res, null, 'Conductor inválido', 400);
  }

  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `DELETE FROM FAVORITO_CONDUCTOR
       WHERE DOCUMENTO_USU_FCO = :documento AND ID_UPE_CONDUCTOR_FCO = :idUpe`,
      { documento, idUpe }
    );

    if (!result.rowsAffected) {
      return errorResponse(res, null, 'El conductor no está en tus favoritos', 404);
    }

    await connection.commit();

    successResponse(res, { idUpe }, 'Conductor eliminado de favoritos');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar conductor favorito', 500);
  } finally {
    if (connection) await connection?.close();
  }
}
