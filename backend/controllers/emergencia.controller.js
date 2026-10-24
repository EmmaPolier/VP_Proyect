import { getConnection } from '../db.js';
import { sendEmergencyNotification } from '../services/email.service.js';

const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT_MS = 30 * 1000;
const idempotencyEntries = new Map();
const rateLimitEntries = new Map();

function sendError(res, status, message, code) {
  return res.status(status).json({
    success: false,
    message,
    error: code,
    timestamp: new Date().toISOString(),
  });
}

function sendSuccess(res, data) {
  return res.status(200).json({
    success: true,
    message: 'Resultado del envío de emergencia',
    data,
    timestamp: new Date().toISOString(),
  });
}

function parseRouteId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseEmergencyRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'El cuerpo debe ser un objeto' };
  }

  // Solo aceptamos el ID del tipo de emergencia y la ubicación opcional.
  const fields = Object.keys(body);
  const hasUnexpectedFields = fields.some(
    (field) => field !== 'tipoEmergenciaId' && field !== 'ubicacion'
  );

  if (hasUnexpectedFields) {
    return { error: 'El cuerpo contiene campos no permitidos' };
  }

  const tipoEmergenciaId = body.tipoEmergenciaId;

  if (!Number.isSafeInteger(tipoEmergenciaId) || tipoEmergenciaId <= 0) {
    return { error: 'Selecciona un tipo de emergencia válido' };
  }

  // No tener ubicación es válido; puede ocurrir si se deniega el GPS.
  if (!Object.hasOwn(body, 'ubicacion') || body.ubicacion === null) {
    return { location: null, tipoEmergenciaId };
  }

  const location = body.ubicacion;

  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    return { error: 'La ubicación debe ser un objeto con latitud y longitud' };
  }

  const locationFields = Object.keys(location);
  if (
    locationFields.length !== 2 ||
    !locationFields.includes('latitud') ||
    !locationFields.includes('longitud')
  ) {
    return { error: 'La ubicación debe incluir latitud y longitud' };
  }

  const { latitud, longitud } = location;

  if (
    typeof latitud !== 'number' ||
    typeof longitud !== 'number' ||
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud) ||
    latitud < -90 ||
    latitud > 90 ||
    longitud < -180 ||
    longitud > 180
  ) {
    return { error: 'Las coordenadas están fuera de rango' };
  }

  return {
    location: { latitud, longitud },
    tipoEmergenciaId,
  };
}

function removeExpiredEntries(now) {
  for (const [key, entry] of idempotencyEntries) {
    if (entry.expiresAt <= now) idempotencyEntries.delete(key);
  }
  for (const [key, timestamp] of rateLimitEntries) {
    if (timestamp + RATE_LIMIT_MS <= now) rateLimitEntries.delete(key);
  }
}

async function dispatchEmergency({
  routeId,
  userName,
  route,
  contacts,
  location,
  tipoEmergencia,
}) {
  const now = new Date();
  const results = await Promise.allSettled(
    contacts.map((contact) => sendEmergencyNotification({
      to: contact.email,
      userName,
      routeId,
      tipoEmergencia,
      departure: route.departure,
      origin: route.origin,
      destination: route.destination,
      location,
      sentAt: now,
    }))
  );

  const recipients = results.map((result, index) => ({
    contactoId: contacts[index].id,
    estado: result.status === 'fulfilled' ? 'ENVIADO' : 'ERROR',
  }));
  const estado = recipients.every((recipient) => recipient.estado === 'ENVIADO')
    ? 'ENVIADO'
    : 'ERROR';

  return {
    rutaId: routeId,
    estado,
    fecha: now.toISOString(),
    ubicacionIncluida: Boolean(location),
    destinatarios: recipients,
  };
}

export async function sendRouteEmergency(req, res) {
  const document = req.user?.documento;
  if (!document) return sendError(res, 401, 'Usuario no autenticado', 'NO_AUTENTICADO');

  const routeId = parseRouteId(req.params.id);
  if (!routeId) return sendError(res, 400, 'El ID de ruta debe ser un entero positivo', 'DATOS_INVALIDOS');

  const {
    location,
    tipoEmergenciaId,
    error: requestError,
    } = parseEmergencyRequest(req.body ?? {});

    if (requestError) {
      return sendError(res, 400, requestError, 'DATOS_INVALIDOS');
    }


  const idempotencyKey = req.get('Idempotency-Key');
  if (typeof idempotencyKey !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return sendError(res, 400, 'Se requiere un Idempotency-Key UUID válido', 'DATOS_INVALIDOS');
  }

  const fingerprint = JSON.stringify({ 
    routeId, 
    tipoEmergenciaId,
    location,
  });
  const idempotencyId = `${document}:${idempotencyKey}`;
  const rateLimitId = `${document}:${routeId}`;
  const now = Date.now();
  removeExpiredEntries(now);

  const previous = idempotencyEntries.get(idempotencyId);
  if (previous) {
    if (previous.fingerprint !== fingerprint) {
      return sendError(res, 409, 'La clave de idempotencia ya se utilizó con otros datos', 'CONFLICTO_IDEMPOTENCIA');
    }
    try {
      return sendSuccess(res, await previous.result);
    } catch {
      console.error('[EMERGENCY] Cached emergency request failed');
      idempotencyEntries.delete(idempotencyId);
      return sendError(res, 500, 'No fue posible procesar la alerta de emergencia', 'ERROR_INTERNO');
    }
  }

  const lastRequest = rateLimitEntries.get(rateLimitId);
  if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
    return sendError(res, 429, 'Espera antes de volver a activar la alerta para esta ruta', 'LIMITE_FRECUENCIA');
  }

  let connection;
  try {
    connection = await getConnection();

    const typeResult = await connection.execute(
      `SELECT ID_TEM, NOMBRE_TEM
      FROM TIPO_EMERGENCIA
      WHERE ID_TEM = :tipoEmergenciaId
      AND ACTIVO_TEM = 'S'`,
      { tipoEmergenciaId }
    )

    if (!typeResult.rows?.length) {
      return sendError(
        res,
        400,
        'El tipo de emergencia seleccionado no es válido o no está activo',
        'TIPO_EMERGENCIA_NO_VALIDO'
      );
    }

    const typeName = typeResult.rows[0][1];

    const routeResult = await connection.execute(
      `SELECT er.NOMBRE_ERU,
              TO_CHAR(r.HORA_SALIDA_RUT, 'YYYY-MM-DD HH24:MI'),
              r.LATITUD_ORIGEN_RUT,
              r.LONGITUD_ORIGEN_RUT,
              r.LATITUD_DESTINO_RUT,
              r.LONGITUD_DESTINO_RUT,
              up.DOCUMENTO_USU_UPE
       FROM RUTA r
       JOIN ESTADO_RUTA er ON er.ID_ERU = r.ID_EST_RUT
       JOIN USUARIO_PERFIL up ON up.ID_UPE = r.ID_UPE_RUT
       WHERE r.ID_RUT = :routeId`,
      { routeId }
    );

    if (!routeResult.rows?.length) {
      return sendError(res, 404, 'Ruta no encontrada', 'NO_ENCONTRADO');
    }

    const [routeStatus, departure, originLat, originLng, destinationLat, destinationLng, driverDocument] = routeResult.rows[0];
    let isParticipant = driverDocument === document;

    if (!isParticipant) {
      const passengerResult = await connection.execute(
        `SELECT COUNT(*)
         FROM SOLICITUD_CUPO s
         JOIN USUARIO_PERFIL pas ON pas.ID_UPE = s.ID_UPE_SOL
         JOIN ESTADO_SOLICITUD es ON es.ID_ESO = s.ID_ESO_SOL
         JOIN CUPO_RUTA cr ON cr.ID_SOL_CRU = s.ID_SOL AND cr.ID_RUT_CRU = s.ID_RUT_SOL
         JOIN ESTADO_CUPO_RUTA ec ON ec.ID_ECU = cr.ID_ECU_CRU
         WHERE s.ID_RUT_SOL = :routeId
           AND pas.DOCUMENTO_USU_UPE = :document
           AND pas.ID_PER_UPE = 1
           AND es.NOMBRE_ESO = 'ACEPTADA'
           AND ec.NOMBRE_ECU = 'RESERVADO'`,
        { routeId, document }
      );
      isParticipant = Number(passengerResult.rows?.[0]?.[0] || 0) > 0;
    }

    if (!isParticipant) {
      return sendError(res, 403, 'No tienes permiso para activar una alerta en esta ruta', 'SIN_PERMISO');
    }

    if (routeStatus !== 'EN_CURSO') {
      return sendError(res, 409, 'La alerta solo está disponible mientras la ruta está en curso', 'ESTADO_NO_VALIDO');
    }

    const userResult = await connection.execute(
      `SELECT TRIM(NVL(NOMBRES_USU, '') || ' ' || NVL(PRIMER_APELLIDO_USU, ''))
       FROM USUARIO WHERE DOCUMENTO_USU = :document`,
      { document }
    );
    const contactsResult = await connection.execute(
      `SELECT ID_CEM, CORREO_CEM
       FROM CONTACTO_EMERGENCIA
       WHERE DOCUMENTO_USU_CEM = :document AND ACTIVO_CEM = 'S'
       ORDER BY ID_CEM`,
      { document }
    );

    const contacts = (contactsResult.rows || []).map((row) => ({ id: row[0], email: row[1] }));
    if (contacts.length === 0) {
      return sendError(res, 409, 'Configura al menos un contacto de emergencia activo', 'CONTACTOS_NO_CONFIGURADOS');
    }

    const userName = userResult.rows?.[0]?.[0]?.trim();
    if (!userName) {
      return sendError(res, 404, 'Usuario no encontrado', 'NO_ENCONTRADO');
    }

    const route = {
      departure,
      origin: `${Number(originLat).toFixed(3)}, ${Number(originLng).toFixed(3)}`,
      destination: `${Number(destinationLat).toFixed(3)}, ${Number(destinationLng).toFixed(3)}`,
    };

    await connection.close();
    connection = null;

    const concurrentRequest = idempotencyEntries.get(idempotencyId);
    if (concurrentRequest) {
      if (concurrentRequest.fingerprint !== fingerprint) {
        return sendError(res, 409, 'La clave de idempotencia ya se utilizó con otros datos', 'CONFLICTO_IDEMPOTENCIA');
      }
      return sendSuccess(res, await concurrentRequest.result);
    }

    const latestRequest = rateLimitEntries.get(rateLimitId);
    if (latestRequest && Date.now() - latestRequest < RATE_LIMIT_MS) {
      return sendError(res, 429, 'Espera antes de volver a activar la alerta para esta ruta', 'LIMITE_FRECUENCIA');
    }

    const result = dispatchEmergency({
      routeId,
      userName,
      route,
      contacts,
      location,
      tipoEmergencia: typeName,
    })
    idempotencyEntries.set(idempotencyId, {
      fingerprint,
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      result,
    });
    rateLimitEntries.set(rateLimitId, Date.now());
    return sendSuccess(res, await result);
  } catch {
    console.error('[EMERGENCY] Failed to process route emergency');
    idempotencyEntries.delete(idempotencyId);
    return sendError(res, 500, 'No fue posible procesar la alerta de emergencia', 'ERROR_INTERNO');
  } finally {
    if (connection) await connection.close();
  }
}
