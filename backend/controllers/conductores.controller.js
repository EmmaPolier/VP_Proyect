import { getConnection } from '../db.js';
import { successResponse } from '../utils/response.js';

const PROFILE_DRIVER = 2;
const VALID_TRIP_STATES = new Set(['ACTIVA', 'EN_CURSO', 'COMPLETADA']);
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function sendInternalError(res, message, error) {
  console.error('[PUBLIC-DRIVER] Request failed:', error);
  return res.status(500).json({
    success: false,
    message,
    error: 'ERROR_INTERNO',
    timestamp: new Date().toISOString(),
  });
}

function parseDriverProfileId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function parsePageSize(value) {
  if (value === undefined) return DEFAULT_PAGE_SIZE;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const size = Number(value);
  return size >= 1 && size <= MAX_PAGE_SIZE ? size : null;
}

function encodeCursor(departure, routeId) {
  return Buffer.from(JSON.stringify({ departure, routeId }), 'utf8').toString('base64url');
}

function decodeCursor(value) {
  if (typeof value !== 'string' || value.length > 256 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (
      typeof decoded.departure !== 'string' ||
      !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(decoded.departure) ||
      !Number.isSafeInteger(decoded.routeId) ||
      decoded.routeId <= 0
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function mapTrip(row) {
  const status = row[1];
  const trip = {
    rutaId: Number(row[0]),
    estado: status,
    salida: `${Number(row[3]).toFixed(2)}, ${Number(row[4]).toFixed(2)}`,
    destino: `${Number(row[5]).toFixed(2)}, ${Number(row[6]).toFixed(2)}`,
    fechaSalida: row[2],
  };

  if (status !== 'COMPLETADA') {
    trip.cuposDisponibles = Number(row[7]);
    trip.precio = Number(row[8]);
  }

  return trip;
}

export async function getDriverPublicProfile(req, res) {
  const driverProfileId = parseDriverProfileId(req.params.idUpe);
  if (!driverProfileId) {
    return res.status(400).json({
      success: false,
      message: 'El ID del conductor debe ser un entero positivo',
      error: 'DATOS_INVALIDOS',
      timestamp: new Date().toISOString(),
    });
  }

  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT up.ID_UPE,
              u.NOMBRES_USU,
              u.PRIMER_APELLIDO_USU,
              u.SEGUNDO_APELLIDO_USU,
              u.FOTO_URL_USU,
              NVL(up.CALIFICACION_UPE, 5.0),
              eu.NOMBRE_EUS,
              (SELECT COUNT(*)
               FROM RUTA completed_route
               JOIN ESTADO_RUTA completed_status
                 ON completed_status.ID_ERU = completed_route.ID_EST_RUT
               WHERE completed_route.ID_UPE_RUT = up.ID_UPE
                 AND completed_status.NOMBRE_ERU = 'COMPLETADA')
       FROM USUARIO_PERFIL up
       JOIN PERFIL p ON p.ID_PER = up.ID_PER_UPE
       JOIN USUARIO u ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
       LEFT JOIN ESTADO_USUARIO eu ON eu.ID_EUS = u.ID_EST_USU
       WHERE up.ID_UPE = :driverProfileId
         AND up.ID_PER_UPE = :driverProfile
         AND p.NOMBRE_PER = 'CONDUCTOR'`,
      { driverProfileId, driverProfile: PROFILE_DRIVER }
    );

    if (!result.rows?.length) {
      return res.status(404).json({
        success: false,
        message: 'Conductor no encontrado',
        error: 'NO_ENCONTRADO',
        timestamp: new Date().toISOString(),
      });
    }

    const row = result.rows[0];
    return successResponse(res, {
      idUpe: Number(row[0]),
      nombre: [row[1], row[2], row[3]].filter(Boolean).join(' ') || 'Conductor',
      fotoUrl: row[4] || null,
      calificacion: Number(row[5]),
      estado: row[6] || 'DESCONOCIDO',
      viajesCompletados: Number(row[7]),
    }, 'Perfil del conductor obtenido correctamente');
  } catch (error) {
    return sendInternalError(res, 'No fue posible obtener el perfil del conductor', error);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getDriverTrips(req, res) {
  const driverProfileId = parseDriverProfileId(req.params.idUpe);
  if (!driverProfileId) {
    return res.status(400).json({
      success: false,
      message: 'El ID del conductor debe ser un entero positivo',
      error: 'DATOS_INVALIDOS',
      timestamp: new Date().toISOString(),
    });
  }

  const state = req.query.estado === undefined
    ? 'ACTIVA'
    : String(req.query.estado).toUpperCase();
  if (!VALID_TRIP_STATES.has(state)) {
    return res.status(400).json({
      success: false,
      message: 'El estado debe ser ACTIVA, EN_CURSO o COMPLETADA',
      error: 'FILTRO_INVALIDO',
      timestamp: new Date().toISOString(),
    });
  }

  const pageSize = parsePageSize(req.query.limite);
  if (!pageSize) {
    return res.status(400).json({
      success: false,
      message: `El límite debe ser un entero entre 1 y ${MAX_PAGE_SIZE}`,
      error: 'LIMITE_INVALIDO',
      timestamp: new Date().toISOString(),
    });
  }

  const cursor = req.query.cursor === undefined ? null : decodeCursor(String(req.query.cursor));
  if (req.query.cursor !== undefined && !cursor) {
    return res.status(400).json({
      success: false,
      message: 'El cursor de paginación no es válido',
      error: 'CURSOR_INVALIDO',
      timestamp: new Date().toISOString(),
    });
  }

  let connection;
  try {
    connection = await getConnection();

    const driverResult = await connection.execute(
      `SELECT ID_UPE FROM USUARIO_PERFIL
       WHERE ID_UPE = :driverProfileId AND ID_PER_UPE = :driverProfile`,
      { driverProfileId, driverProfile: PROFILE_DRIVER }
    );
    if (!driverResult.rows?.length) {
      return res.status(404).json({
        success: false,
        message: 'Conductor no encontrado',
        error: 'NO_ENCONTRADO',
        timestamp: new Date().toISOString(),
      });
    }

    const filters = [
      'r.ID_UPE_RUT = :driverProfileId',
      'UPPER(er.NOMBRE_ERU) = :state',
    ];
    const binds = {
      driverProfileId,
      state,
      fetchLimit: pageSize + 1,
    };
    if (state === 'ACTIVA') filters.push('r.HORA_SALIDA_RUT > SYSDATE');
    if (cursor) {
      filters.push(`(
        r.HORA_SALIDA_RUT < TO_DATE(:cursorDeparture, 'YYYY-MM-DD HH24:MI:SS')
        OR (
          r.HORA_SALIDA_RUT = TO_DATE(:cursorDeparture, 'YYYY-MM-DD HH24:MI:SS')
          AND r.ID_RUT < :cursorRouteId
        )
      )`);
      binds.cursorDeparture = cursor.departure;
      binds.cursorRouteId = cursor.routeId;
    }

    const result = await connection.execute(
      `SELECT r.ID_RUT,
              UPPER(er.NOMBRE_ERU),
              TO_CHAR(r.HORA_SALIDA_RUT, 'YYYY-MM-DD"T"HH24:MI:SS') || '-05:00',
              ROUND(r.LATITUD_ORIGEN_RUT, 2),
              ROUND(r.LONGITUD_ORIGEN_RUT, 2),
              ROUND(r.LATITUD_DESTINO_RUT, 2),
              ROUND(r.LONGITUD_DESTINO_RUT, 2),
              r.CUPOS_DISPONIBLES_RUT,
              r.PRECIO_CUPO_RUT,
              TO_CHAR(r.HORA_SALIDA_RUT, 'YYYY-MM-DD HH24:MI:SS')
       FROM RUTA r
       JOIN ESTADO_RUTA er ON er.ID_ERU = r.ID_EST_RUT
       WHERE ${filters.join(' AND ')}
       ORDER BY r.HORA_SALIDA_RUT DESC, r.ID_RUT DESC
       FETCH FIRST :fetchLimit ROWS ONLY`,
      binds
    );

    const rows = result.rows || [];
    const hasMore = rows.length > pageSize;
    const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
    const items = pageRows.map(mapTrip);
    const lastRow = pageRows[pageRows.length - 1];

    return successResponse(res, {
      items,
      nextCursor: hasMore && lastRow
        ? encodeCursor(lastRow[9], Number(lastRow[0]))
        : null,
    }, 'Viajes obtenidos correctamente');
  } catch (error) {
    return sendInternalError(res, 'No fue posible obtener los viajes del conductor', error);
  } finally {
    if (connection) await connection.close();
  }
}
