import { getConnection } from '../db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { sendNotificationEmail } from '../services/email.service.js';

const LOCATION_PRESETS = [
  {
    label: 'San Cristóbal',
    aliases: ['san cristobal', 'san cristóbal', 'san', 'cristobal', 'cristóbal'],
    lat: 6.251839,
    lng: -75.581228,
  },
  {
    label: 'Belén',
    aliases: ['belen', 'belén'],
    lat: 6.242200,
    lng: -75.590780,
  },
  {
    label: 'Politécnico',
    aliases: ['politecnico', 'politécnico', 'poli'],
    lat: 6.197458,
    lng: -75.567108,
  },
  {
    label: 'Politécnico Sur',
    aliases: ['politecnico sur', 'politécnico sur'],
    lat: 6.181200,
    lng: -75.570000,
  },
];

function getLocationFilters(value) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const matches = LOCATION_PRESETS.filter((preset) =>
    preset.aliases.some((alias) => normalized.includes(alias))
  );

  if (matches.length === 0) {
    return null;
  }

  return matches;
}

export async function searchRoutes(req, res) {
  const { origin, destination } = req.query;
  let connection;

  try {
    connection = await getConnection();

    const filters = [];
    const binds = {
      activeState: 'ACTIVA',
    };

    filters.push(`r.CUPOS_DISPONIBLES_RUT > 0`);
    filters.push(`er.NOMBRE_ERU = :activeState`);

    const originFilters = getLocationFilters(origin);
    if (originFilters) {
      const originConditions = originFilters.map((item, index) => {
        binds[`originLat${index}`] = item.lat;
        binds[`originLng${index}`] = item.lng;
        return `(ABS(r.LATITUD_ORIGEN_RUT - :originLat${index}) <= 0.015 AND ABS(r.LONGITUD_ORIGEN_RUT - :originLng${index}) <= 0.015)`;
      });
      filters.push(`(${originConditions.join(' OR ')})`);
    }

    const destinationFilters = getLocationFilters(destination);
    if (destinationFilters) {
      const destinationConditions = destinationFilters.map((item, index) => {
        binds[`destLat${index}`] = item.lat;
        binds[`destLng${index}`] = item.lng;
        return `(ABS(r.LATITUD_DESTINO_RUT - :destLat${index}) <= 0.015 AND ABS(r.LONGITUD_DESTINO_RUT - :destLng${index}) <= 0.015)`;
      });
      filters.push(`(${destinationConditions.join(' OR ')})`);
    }

    const date = req.query.date;
    const time = req.query.time;
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;

    if (date) {
      filters.push(`TRUNC(r.HORA_SALIDA_RUT) = TO_DATE(:date, 'YYYY-MM-DD')`);
      binds.date = date;
    }
    if (time) {
      filters.push(`TO_CHAR(r.HORA_SALIDA_RUT, 'HH24:MI') = :time`);
      binds.time = time;
    }
    if (minPrice !== null && !Number.isNaN(minPrice)) {
      filters.push(`r.PRECIO_CUPO_RUT >= :minPrice`);
      binds.minPrice = minPrice;
    }
    if (maxPrice !== null && !Number.isNaN(maxPrice)) {
      filters.push(`r.PRECIO_CUPO_RUT <= :maxPrice`);
      binds.maxPrice = maxPrice;
    }

    const query = `
      SELECT
        r.ID_RUT,
        TO_CHAR(r.HORA_SALIDA_RUT, 'YYYY-MM-DD HH24:MI') AS HORA_SALIDA,
        r.CUPOS_DISPONIBLES_RUT,
        r.CUPOS_TOTALES_RUT,
        r.PRECIO_CUPO_RUT,
        r.DISTANCIA_KM_RUT,
        r.LATITUD_ORIGEN_RUT,
        r.LONGITUD_ORIGEN_RUT,
        r.LATITUD_DESTINO_RUT,
        r.LONGITUD_DESTINO_RUT,
        NVL(u.NOMBRES_USU, 'Sin nombre') || ' ' || NVL(u.PRIMER_APELLIDO_USU, '') AS CONDUCTOR,
        v.PLACA_VEH,
        NVL(up.CALIFICACION_UPE, 0) AS DRIVER_RATING,
        NVL(up.CALIFICACION_UPE, 0) AS DRIVER_RATING,
        er.NOMBRE_ERU,
        p.ID_PEN,
        p.LATITUD_PEN,
        p.LONGITUD_PEN,
        p.ORDEN_PEN
      FROM RUTA r
      LEFT JOIN ESTADO_RUTA er ON r.ID_EST_RUT = er.ID_ERU
      LEFT JOIN USUARIO_PERFIL up ON up.ID_UPE = r.ID_UPE_RUT
      LEFT JOIN USUARIO u ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
      LEFT JOIN VEHICULO v ON v.ID_VEH = r.ID_VEH_RUT
      LEFT JOIN PUNTO_ENCUENTRO p ON p.ID_RUT_PEN = r.ID_RUT
      WHERE ${filters.join(' AND ')}
      ORDER BY r.HORA_SALIDA_RUT ASC, p.ORDEN_PEN ASC
    `;

    const result = await connection.execute(query, binds);

    const routeMap = new Map();
    for (const row of result.rows) {
      const id = row[0];
      if (!routeMap.has(id)) {
        routeMap.set(id, {
          id,
          departure: row[1],
          availableSeats: row[2],
          totalSeats: row[3],
          price: row[4],
          distance: row[5],
          originLatitude: row[6],
          originLongitude: row[7],
          destinationLatitude: row[8],
          destinationLongitude: row[9],
          driverName: row[10],
          vehiclePlate: row[11],
          driverRating: Number(row[12] ?? 0),
          status: row[13],
          meetingPoints: [],
        });
      }

      const pointId = row[14];
      if (pointId !== null) {
        routeMap.get(id).meetingPoints.push({
          id: pointId,
          lat: row[15],
          lng: row[16],
          order: row[17],
        });
      }
    }

    const routes = Array.from(routeMap.values());

    successResponse(res, routes, 'Rutas encontradas exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error buscando rutas', 500);
  } finally {
    if (connection) await connection.close();
  }
}

async function getProfileId(connection, documento, profileType) {
  const result = await connection.execute(
    `SELECT ID_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento AND ID_PER_UPE = :profileType`,
    { documento, profileType }
  );
  return result.rows.length ? result.rows[0][0] : null;
}

async function getIdByName(connection, table, idField, nameField, nameValue) {
  const result = await connection.execute(
    `SELECT ${idField} FROM ${table} WHERE ${nameField} = :nameValue`,
    { nameValue }
  );
  return result.rows.length ? result.rows[0][0] : null;
}

export async function createRoute(req, res) {
  const {
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    departure,
    availableSeats,
    price,
    meetingPoints = [],
  } = req.body;
  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (
      originLat === undefined ||
      originLng === undefined ||
      destinationLat === undefined ||
      destinationLng === undefined ||
      !departure ||
      availableSeats === undefined ||
      price === undefined
    ) {
      return res.status(400).json({ message: 'Datos incompletos de la ruta' });
    }

    // Convertir formato ISO string a formato Oracle
    const departureFormatted = departure.replace('T', ' ');

    connection = await getConnection();
    const driverProfileId = await getProfileId(connection, documento, 2);

    if (!driverProfileId) {
      return res.status(403).json({ message: 'Solo conductores pueden crear rutas' });
    }

    const vehicleResult = await connection.execute(
      `SELECT ID_VEH FROM VEHICULO WHERE DOCUMENTO_USU_VEH = :documento AND ROWNUM = 1`,
      { documento }
    );
    const vehicleId = vehicleResult.rows.length ? vehicleResult.rows[0][0] : null;

    if (!vehicleId) {
      return res.status(400).json({ message: 'No se encontró un vehículo asociado al conductor' });
    }

    const activeStateId = await getIdByName(connection, 'ESTADO_RUTA', 'ID_ERU', 'NOMBRE_ERU', 'ACTIVA');
    if (!activeStateId) {
      return res.status(500).json({ message: 'Estado de ruta ACTIVA no encontrado' });
    }

    await connection.execute(
      `INSERT INTO RUTA (
         ID_RUT,
         ID_UPE_RUT,
         ID_VEH_RUT,
         ID_EST_RUT,
         LATITUD_ORIGEN_RUT,
         LONGITUD_ORIGEN_RUT,
         LATITUD_DESTINO_RUT,
         LONGITUD_DESTINO_RUT,
         HORA_SALIDA_RUT,
         CUPOS_TOTALES_RUT,
         CUPOS_DISPONIBLES_RUT,
         PRECIO_CUPO_RUT,
         DISTANCIA_KM_RUT,
         FECHA_CREACION_RUT,
         FECHA_ACTUALIZACION_RUT
       ) VALUES (
         SEQ_RUTA.NEXTVAL,
         :driverProfileId,
         :vehicleId,
         :activeStateId,
         :originLat,
         :originLng,
         :destinationLat,
         :destinationLng,
         TO_TIMESTAMP(:departure, 'YYYY-MM-DD HH24:MI:SS'),
         :availableSeats,
         :availableSeats,
         :price,
         0,
         SYSDATE,
         SYSDATE
       )`,
      { driverProfileId, vehicleId, activeStateId, originLat, originLng, destinationLat, destinationLng, departure: departureFormatted, availableSeats, price },
      { autoCommit: true }
    );

    const sequenceResult = await connection.execute(`SELECT SEQ_RUTA.CURRVAL FROM DUAL`);
    const routeId = sequenceResult.rows.length ? sequenceResult.rows[0][0] : null;

    if (!routeId) {
      return res.status(500).json({ message: 'No se pudo crear la ruta' });
    }

    for (let index = 0; index < meetingPoints.length; index += 1) {
      const point = meetingPoints[index];
      if (point?.lat !== undefined && point?.lng !== undefined) {
        await connection.execute(
          `INSERT INTO PUNTO_ENCUENTRO (
             ID_PEN,
             ID_RUT_PEN,
             LATITUD_PEN,
             LONGITUD_PEN,
             ORDEN_PEN
           ) VALUES (
             SEQ_PUNTO_ENCUENTRO.NEXTVAL,
             :routeId,
             :lat,
             :lng,
             :orden
           )`,
          { routeId, lat: point.lat, lng: point.lng, orden: index + 1 },
          { autoCommit: true }
        );
      }
    }

    successResponse(res, { routeId }, 'Ruta creada exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear ruta', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function createSolicitud(req, res) {
  const routeId = Number(req.params.id);
  const { paymentMethod = 'CARTERA_VIRTUAL', amount, punto_encuentro = '' } = req.body;
  const documento = req.user?.documento;

  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // T6.3: Validar punto_encuentro enum
    const validMeetingPoints = ['Centro Comercial', 'Estación', 'Parque', 'Biblioteca', 'Centro Cívico'];
    if (punto_encuentro && !validMeetingPoints.includes(punto_encuentro)) {
      return res.status(400).json({ 
        message: `Punto de encuentro inválido. Opciones válidas: ${validMeetingPoints.join(', ')}`
      });
    }

    connection = await getConnection();

    const routeResult = await connection.execute(
      `SELECT
         r.ID_RUT,
         r.CUPOS_DISPONIBLES_RUT,
         r.ID_EST_RUT,
         r.PRECIO_CUPO_RUT,
         NVL(u.CORREO_USU, '') AS DRIVER_EMAIL,
         NVL(u.NOMBRES_USU, '') AS DRIVER_NAME,
         NVL(u.PRIMER_APELLIDO_USU, '') AS DRIVER_LASTNAME,
         NVL(u.DOCUMENTO_USU, '') AS DRIVER_DOCUMENTO
       FROM RUTA r
       LEFT JOIN USUARIO_PERFIL up ON up.ID_UPE = r.ID_UPE_RUT
       LEFT JOIN USUARIO u ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
       WHERE r.ID_RUT = :routeId`,
      { routeId }
    );

    if (!routeResult.rows.length) {
      return res.status(404).json({ message: 'Ruta no encontrada' });
    }

    const [idRut, availableSeats, idEstado, routePrice, driverEmail, driverFirstName, driverLastName, driverDocumento] = routeResult.rows[0];
    
    // T6.1: Validar que pasajero ≠ conductor
    if (documento === driverDocumento) {
      return res.status(400).json({ message: 'No puedes solicitar cupo en tu propia ruta' });
    }

    const statusResult = await connection.execute(
      `SELECT NOMBRE_ERU FROM ESTADO_RUTA WHERE ID_ERU = :idEstado`,
      { idEstado }
    );
    const statusName = statusResult.rows.length ? statusResult.rows[0][0] : null;

    if (statusName !== 'ACTIVA') {
      return res.status(400).json({ message: 'No puedes solicitar una ruta que no está activa' });
    }

    if (availableSeats <= 0) {
      return res.status(400).json({ message: 'No hay cupos disponibles en esta ruta' });
    }

    const passengerProfileId = await getProfileId(connection, documento, 1);
    if (!passengerProfileId) {
      return res.status(403).json({ message: 'Solo pasajeros pueden solicitar cupo' });
    }

    const monto = Number(amount ?? routePrice ?? 0);
    if (monto <= 0) {
      return res.status(400).json({ message: 'Monto de solicitud inválido' });
    }

    if (paymentMethod === 'CARTERA_VIRTUAL') {
      const balanceRes = await connection.execute(
        `SELECT NVL(SALDO_CARTERA_USU, 0) FROM USUARIO WHERE DOCUMENTO_USU = :doc`,
        { doc: documento }
      );
      const currentBalance = balanceRes.rows.length ? Number(balanceRes.rows[0][0]) : 0;
      if (currentBalance < monto) {
        return res.status(400).json({ message: 'Saldo insuficiente en cartera virtual' });
      }
    }

    // Verificar si existe solicitud ACTIVA (no cancelada ni rechazada)
    const cancelledStatusId = await getIdByName(connection, 'ESTADO_SOLICITUD', 'ID_ESO', 'NOMBRE_ESO', 'CANCELADA');
    const rejectedStatusId = await getIdByName(connection, 'ESTADO_SOLICITUD', 'ID_ESO', 'NOMBRE_ESO', 'RECHAZADA');
    
    const existingRequest = await connection.execute(
      `SELECT COUNT(*) FROM SOLICITUD_CUPO 
       WHERE ID_UPE_SOL = :passengerProfileId 
       AND ID_RUT_SOL = :routeId 
       AND ID_ESO_SOL NOT IN (:cancelledStatusId, :rejectedStatusId)`,
      { passengerProfileId, routeId, cancelledStatusId, rejectedStatusId }
    );

    if (existingRequest.rows[0][0] > 0) {
      return res.status(409).json({ message: 'Ya existe una solicitud activa para esta ruta. Cancela la anterior si deseas solicitar nuevamente.' });
    }

    const passengerNameResult = await connection.execute(
      `SELECT NVL(NOMBRES_USU, '') || ' ' || NVL(PRIMER_APELLIDO_USU, '') FROM USUARIO WHERE DOCUMENTO_USU = :documento`,
      { documento }
    );
    const passengerName = passengerNameResult.rows.length ? passengerNameResult.rows[0][0] : 'Pasajero';

    const estadoPendienteId = await getIdByName(connection, 'ESTADO_SOLICITUD', 'ID_ESO', 'NOMBRE_ESO', 'PENDIENTE');
    const metodoPagoId = await getIdByName(connection, 'METODO_PAGO', 'ID_MPA', 'NOMBRE_MPA', paymentMethod);

    if (!estadoPendienteId || !metodoPagoId) {
      return res.status(400).json({ message: 'Datos de solicitud no válidos' });
    }

    await connection.execute(
      `INSERT INTO SOLICITUD_CUPO (
         ID_SOL,
         ID_UPE_SOL,
         ID_RUT_SOL,
         ID_ESO_SOL,
         ID_MPA_SOL,
         MONTO_SOL,
         FECHA_CREACION_SOL
       ) VALUES (
         SEQ_SOLICITUD_CUPO.NEXTVAL,
         :passengerProfileId,
         :routeId,
         :estadoPendienteId,
         :metodoPagoId,
         :monto,
         SYSDATE
       )`,
      { passengerProfileId, routeId, estadoPendienteId, metodoPagoId, monto },
      { autoCommit: true }
    );

    // Obtener el ID de la solicitud creada
    const sequenceResult = await connection.execute(`SELECT SEQ_SOLICITUD_CUPO.CURRVAL FROM DUAL`);
    const solicitudId = sequenceResult.rows.length ? sequenceResult.rows[0][0] : null;

    const driverFullName = `${driverFirstName} ${driverLastName}`.trim() || 'Conductor';

    if (driverEmail) {
      try {
        await sendNotificationEmail(
          driverEmail,
          'Nueva solicitud de cupo - VamonosPues',
          `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
              <h2>Hola ${driverFullName}</h2>
              <p>Has recibido una nueva solicitud de cupo para la ruta <strong>#${routeId}</strong>.</p>
              <p>Pasajero: <strong>${passengerName}</strong></p>
              <p>Monto solicitado: <strong>$${monto}</strong></p>
              <p>Ingresa al panel para aceptar o rechazar la solicitud.</p>
            </div>
          `
        );
      } catch (emailError) {
        console.error('[WARN] No se pudo enviar notificación al conductor:', emailError);
      }
    }

    successResponse(res, { solicitudId, routeId, passengerProfileId, paymentMethod, amount: monto }, 'Solicitud de cupo creada exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear solicitud', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function cancelSolicitud(req, res) {
  const solicitudId = Number(req.params.id);
  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    connection = await getConnection();
    const passengerProfileId = await getProfileId(connection, documento, 1);

    if (!passengerProfileId) {
      return res.status(403).json({ message: 'Solo pasajeros pueden cancelar solicitudes' });
    }

    const result = await connection.execute(
      `SELECT
         s.ID_SOL,
         s.ID_ESO_SOL,
         s.ID_RUT_SOL
       FROM SOLICITUD_CUPO s
       WHERE s.ID_SOL = :solicitudId
         AND s.ID_UPE_SOL = :passengerProfileId`,
      { solicitudId, passengerProfileId }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const [idSol, currentStatusId, routeId] = result.rows[0];
    const currentStatusResult = await connection.execute(
      `SELECT NOMBRE_ESO FROM ESTADO_SOLICITUD WHERE ID_ESO = :statusId`,
      { statusId: currentStatusId }
    );
    const currentStatusName = currentStatusResult.rows.length ? currentStatusResult.rows[0][0] : null;

    if (currentStatusName !== 'PENDIENTE') {
      return res.status(400).json({ message: 'Solo se pueden cancelar solicitudes pendientes' });
    }

    const cancelStatusId = await getIdByName(connection, 'ESTADO_SOLICITUD', 'ID_ESO', 'NOMBRE_ESO', 'CANCELADA');

    if (!cancelStatusId) {
      return res.status(500).json({ message: 'Estado de cancelación no encontrado' });
    }

    // T6.4: Reversar cupos disponibles (incrementar en 1)
    await connection.execute(
      `UPDATE RUTA SET CUPOS_DISPONIBLES_RUT = CUPOS_DISPONIBLES_RUT + 1 
       WHERE ID_RUT = :routeId`,
      { routeId },
      { autoCommit: true }
    );

    await connection.execute(
      `UPDATE SOLICITUD_CUPO SET ID_ESO_SOL = :cancelStatusId WHERE ID_SOL = :solicitudId`,
      { cancelStatusId, solicitudId },
      { autoCommit: true }
    );

    const passengerEmail = await connection.execute(
      `SELECT NVL(u.CORREO_USU, ''), NVL(u.NOMBRES_USU, '') || ' ' || NVL(u.PRIMER_APELLIDO_USU, '')
       FROM USUARIO_PERFIL up
       LEFT JOIN USUARIO u ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
       WHERE up.ID_UPE = :passengerProfileId`,
      { passengerProfileId }
    );

    const emailTo = passengerEmail.rows.length ? passengerEmail.rows[0][0] : null;
    const nameTo = passengerEmail.rows.length ? passengerEmail.rows[0][1] : 'Pasajero';

    if (emailTo) {
      try {
        await sendNotificationEmail(
          emailTo,
          'Cancelación de solicitud - VamonosPues',
          `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
              <h2>Hola ${nameTo}</h2>
              <p>Tu solicitud ha sido cancelada correctamente.</p>
              <p>Si necesitas volver a solicitar un cupo, hazlo desde tu panel.</p>
            </div>
          `
        );
      } catch (emailError) {
        console.error('[WARN] No se pudo enviar notificación de cancelación al pasajero:', emailError);
      }
    }

    successResponse(res, { id: idSol, status: 'CANCELADA' }, 'Solicitud cancelada correctamente');
  } catch (error) {
    errorResponse(res, error, 'Error al cancelar solicitud', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getMySolicitudes(req, res) {
  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    connection = await getConnection();
    const passengerProfileId = await getProfileId(connection, documento, 1);

    if (!passengerProfileId) {
      return res.status(403).json({ message: 'Solo pasajeros pueden ver sus solicitudes' });
    }

    const passengerDocResult = await connection.execute(
      `SELECT DOCUMENTO_USU_UPE FROM USUARIO_PERFIL WHERE ID_UPE = :passengerProfileId`,
      { passengerProfileId }
    );
    const passengerDoc = passengerDocResult.rows.length ? passengerDocResult.rows[0][0] : null;

    const { status, routeStatus, fromDate, toDate } = req.query;
    const filters = ['s.ID_UPE_SOL = :passengerProfileId'];
    const binds = { passengerProfileId };

    if (status) {
      filters.push(`UPPER(es.NOMBRE_ESO) = :status`);
      binds.status = String(status).toUpperCase();
    }

    if (routeStatus) {
      filters.push(`UPPER(rs.NOMBRE_ERU) = :routeStatus`);
      binds.routeStatus = String(routeStatus).toUpperCase();
    }

    if (fromDate) {
      filters.push(`TRUNC(r.HORA_SALIDA_RUT) >= TO_DATE(:fromDate, 'YYYY-MM-DD')`);
      binds.fromDate = String(fromDate);
    }

    if (toDate) {
      filters.push(`TRUNC(r.HORA_SALIDA_RUT) <= TO_DATE(:toDate, 'YYYY-MM-DD')`);
      binds.toDate = String(toDate);
    }

    const result = await connection.execute(
      `SELECT
         s.ID_SOL,
         s.ID_RUT_SOL,
         TO_CHAR(r.HORA_SALIDA_RUT, 'YYYY-MM-DD HH24:MI'),
         s.MONTO_SOL,
         mp.NOMBRE_MPA,
         es.NOMBRE_ESO,
         TO_CHAR(s.FECHA_CREACION_SOL, 'YYYY-MM-DD HH24:MI'),
         rs.NOMBRE_ERU,
         du.DOCUMENTO_USU,
         du.NOMBRES_USU,
         CASE WHEN EXISTS (
           SELECT 1 FROM CALIFICACION c 
           WHERE c.SOL_ID_CAL = s.ID_SOL 
           AND c.DOCUMENTO_CALIFICADOR_CAL = :passengerDoc 
           AND c.DOCUMENTO_CALIFICADO_CAL = du.DOCUMENTO_USU
         ) THEN 1 ELSE 0 END AS calificadoPorMi
       FROM SOLICITUD_CUPO s
       JOIN RUTA r ON r.ID_RUT = s.ID_RUT_SOL
       LEFT JOIN ESTADO_SOLICITUD es ON es.ID_ESO = s.ID_ESO_SOL
       LEFT JOIN ESTADO_RUTA rs ON rs.ID_ERU = r.ID_EST_RUT
       LEFT JOIN USUARIO_PERFIL dupe ON dupe.ID_UPE = r.ID_UPE_RUT
       LEFT JOIN USUARIO du ON du.DOCUMENTO_USU = dupe.DOCUMENTO_USU_UPE
       LEFT JOIN METODO_PAGO mp ON mp.ID_MPA = s.ID_MPA_SOL
       WHERE ${filters.join(' AND ')}
       ORDER BY s.FECHA_CREACION_SOL DESC`,
      { ...binds, passengerDoc }
    );

    const requests = result.rows.map((row) => ({
      id: row[0],
      routeId: row[1],
      departure: row[2],
      amount: row[3],
      paymentMethod: row[4],
      status: row[5],
      requestedAt: row[6],
      routeStatus: row[7],
      driverDocument: row[8],
      driverName: row[9],
      calificadoPorMi: row[10] === 1,
    }));

    successResponse(res, requests, 'Solicitudes obtenidas exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener solicitudes', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getPassengerDashboard(req, res) {
  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    connection = await getConnection();
    const passengerProfileId = await getProfileId(connection, documento, 1);

    if (!passengerProfileId) {
      return res.status(403).json({ message: 'Solo pasajeros pueden ver el dashboard de pasajero' });
    }

    const result = await connection.execute(
      `SELECT
         NVL(u.SALDO_CARTERA_USU, 0),
         NVL(up.CALIFICACION_UPE, 0),
         COUNT(DISTINCT hv.ID_HIS),
         SUM(CASE WHEN es.NOMBRE_ESO = 'ACEPTADA' THEN 1 ELSE 0 END),
         SUM(CASE WHEN es.NOMBRE_ESO = 'PENDIENTE' THEN 1 ELSE 0 END),
         COUNT(s.ID_SOL),
         NVL(SUM(CASE WHEN es.NOMBRE_ESO = 'ACEPTADA' THEN s.MONTO_SOL ELSE 0 END), 0)
       FROM USUARIO u
       LEFT JOIN USUARIO_PERFIL up ON up.DOCUMENTO_USU_UPE = u.DOCUMENTO_USU
       LEFT JOIN SOLICITUD_CUPO s ON s.ID_UPE_SOL = up.ID_UPE
       LEFT JOIN ESTADO_SOLICITUD es ON es.ID_ESO = s.ID_ESO_SOL
       LEFT JOIN HISTORIAL_VIAJE hv ON hv.DOCUMENTO_USU_HIS = u.DOCUMENTO_USU AND hv.ROL_VIAJE_HIS = 'PASAJERO'
       WHERE u.DOCUMENTO_USU = :documento
       GROUP BY u.SALDO_CARTERA_USU, up.CALIFICACION_UPE`,
      { documento }
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Datos del dashboard no encontrados' });
    }

    const [wallet, rating, completedTrips, acceptedRequests, pendingRequests, totalRequests, totalSpent] = result.rows[0];
    const acceptanceRate = totalRequests > 0 ? Math.round((acceptedRequests / totalRequests) * 100) : 0;

    successResponse(res, {
      wallet,
      rating,
      completedTrips,
      acceptedRequests,
      pendingRequests,
      totalRequests,
      totalSpent,
      acceptanceRate,
    }, 'Dashboard de pasajero obtenido correctamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener dashboard de pasajero', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getDriverDashboard(req, res) {
  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    connection = await getConnection();
    const driverProfileId = await getProfileId(connection, documento, 2);

    if (!driverProfileId) {
      return res.status(403).json({ message: 'Solo conductores pueden ver el dashboard de conductor' });
    }

    const result = await connection.execute(
      `SELECT
         NVL(u.SALDO_CARTERA_USU, 0),
         NVL(up.CALIFICACION_UPE, 0),
         SUM(CASE WHEN er.NOMBRE_ERU = 'ACTIVA' THEN 1 ELSE 0 END),
         SUM(CASE WHEN es.NOMBRE_ESO = 'PENDIENTE' THEN 1 ELSE 0 END),
         SUM(CASE WHEN es.NOMBRE_ESO = 'ACEPTADA' THEN 1 ELSE 0 END),
         NVL(SUM(CASE WHEN es.NOMBRE_ESO = 'ACEPTADA' THEN s.MONTO_SOL ELSE 0 END), 0)
       FROM USUARIO u
       LEFT JOIN USUARIO_PERFIL up ON up.DOCUMENTO_USU_UPE = u.DOCUMENTO_USU
       LEFT JOIN RUTA r ON r.ID_UPE_RUT = up.ID_UPE
       LEFT JOIN ESTADO_RUTA er ON er.ID_ERU = r.ID_EST_RUT
       LEFT JOIN SOLICITUD_CUPO s ON s.ID_RUT_SOL = r.ID_RUT
       LEFT JOIN ESTADO_SOLICITUD es ON es.ID_ESO = s.ID_ESO_SOL
       WHERE u.DOCUMENTO_USU = :documento
       GROUP BY u.SALDO_CARTERA_USU, up.CALIFICACION_UPE`,
      { documento }
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Datos del dashboard no encontrados' });
    }

    const [wallet, rating, activeRoutes, pendingRequests, acceptedRequests, totalEarned] = result.rows[0];

    successResponse(res, {
      wallet,
      rating,
      activeRoutes: activeRoutes || 0,
      pendingRequests: pendingRequests || 0,
      acceptedRequests: acceptedRequests || 0,
      totalEarned,
    }, 'Dashboard de conductor obtenido correctamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener dashboard de conductor', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function updateSolicitudStatus(req, res) {
  const solicitudId = Number(req.params.id);
  const { action } = req.params;
  const documento = req.user?.documento;
  let connection;

  if (!['aceptar', 'rechazar'].includes(action)) {
    return res.status(400).json({ message: 'Acción inválida' });
  }

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    connection = await getConnection();
    const driverProfileId = await getProfileId(connection, documento, 2);

    if (!driverProfileId) {
      return res.status(403).json({ message: 'Solo conductores pueden gestionar solicitudes' });
    }

    const result = await connection.execute(
      `SELECT
         s.ID_SOL,
         s.ID_RUT_SOL,
         r.ID_UPE_RUT,
         s.ID_ESO_SOL,
         r.CUPOS_DISPONIBLES_RUT
       FROM SOLICITUD_CUPO s
       JOIN RUTA r ON r.ID_RUT = s.ID_RUT_SOL
       JOIN ESTADO_SOLICITUD es ON es.ID_ESO = s.ID_ESO_SOL
       WHERE s.ID_SOL = :solicitudId`,
      { solicitudId }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const [idSol, routeId, routeDriverProfileId, currentStatusId, availableSeats] = result.rows[0];

    if (routeDriverProfileId !== driverProfileId) {
      return res.status(403).json({ message: 'No tienes permiso para gestionar esta solicitud' });
    }

    const currentStatusResult = await connection.execute(
      `SELECT NOMBRE_ESO FROM ESTADO_SOLICITUD WHERE ID_ESO = :statusId`,
      { statusId: currentStatusId }
    );
    const currentStatusName = currentStatusResult.rows.length ? currentStatusResult.rows[0][0] : null;

    if (currentStatusName !== 'PENDIENTE') {
      return res.status(400).json({ message: 'Solo se pueden gestionar solicitudes pendientes' });
    }

    const targetStatus = action === 'aceptar' ? 'ACEPTADA' : 'RECHAZADA';
    const targetStatusId = await getIdByName(connection, 'ESTADO_SOLICITUD', 'ID_ESO', 'NOMBRE_ESO', targetStatus);

    if (!targetStatusId) {
      return res.status(400).json({ message: 'Estado de solicitud no válido' });
    }

    if (action === 'aceptar') {
      // 🔴 TRANSACCIÓN ATÓMICA - INICIO
      // Desabilitar autoCommit para garantizar atomicidad
      const previousAutoCommit = connection.autoCommit;
      connection.autoCommit = false;

      try {
        // BLOQUEO DE FILA para evitar race condition en cupos
        const rutaLockResult = await connection.execute(
          `SELECT PRECIO_CUPO_RUT, CUPOS_DISPONIBLES_RUT FROM RUTA WHERE ID_RUT = :routeId FOR UPDATE`,
          { routeId }
        );

        if (rutaLockResult.rows.length === 0) {
          await connection.rollback();
          connection.autoCommit = previousAutoCommit;
          return res.status(404).json({ message: 'Ruta no encontrada' });
        }

        const [precioRuta, cuposDisponiblesActuales] = rutaLockResult.rows[0];
        
        if (cuposDisponiblesActuales <= 0) {
          await connection.rollback();
          connection.autoCommit = previousAutoCommit;
          return res.status(409).json({ message: 'No hay cupos disponibles en esta ruta (otro conductor acaba de aceptar el último)' });
        }

        // Obtener documento del pasajero para cartera
        const pasajeroDocResult = await connection.execute(
          `SELECT DOCUMENTO_USU_UPE FROM USUARIO_PERFIL WHERE ID_UPE = 
           (SELECT ID_UPE_SOL FROM SOLICITUD_CUPO WHERE ID_SOL = :solicitudId)`,
          { solicitudId }
        );

        if (!pasajeroDocResult.rows || pasajeroDocResult.rows.length === 0) {
          await connection.rollback();
          connection.autoCommit = previousAutoCommit;
          return res.status(400).json({ message: 'No se encontró el pasajero' });
        }

        const docPasajero = pasajeroDocResult.rows[0][0];

        const reservedStateId = await getIdByName(connection, 'ESTADO_CUPO_RUTA', 'ID_ECU', 'NOMBRE_ECU', 'RESERVADO');
        if (!reservedStateId) {
          await connection.rollback();
          connection.autoCommit = previousAutoCommit;
          return res.status(500).json({ message: 'Estado de cupo reservado no encontrado' });
        }

        const existingCupo = await connection.execute(
          `SELECT COUNT(*) FROM CUPO_RUTA WHERE ID_SOL_CRU = :solicitudId AND ID_RUT_CRU = :routeId`,
          { solicitudId, routeId }
        );

        if (existingCupo.rows[0][0] === 0) {
          await connection.execute(
            `INSERT INTO CUPO_RUTA (
               ID_SOL_CRU,
               ID_RUT_CRU,
               ID_ECU_CRU,
               FECHA_APROBACION_CRU
             ) VALUES (
               :solicitudId,
               :routeId,
               :reservedStateId,
               SYSDATE
             )`,
            { solicitudId, routeId, reservedStateId },
            { autoCommit: false }
          );
        }

        // Decrementar cupo (con fila ya bloqueada)
        const updateResult = await connection.execute(
          `UPDATE RUTA SET CUPOS_DISPONIBLES_RUT = CUPOS_DISPONIBLES_RUT - 1 WHERE ID_RUT = :routeId`,
          { routeId },
          { autoCommit: false }
        );

        if (updateResult.rowsAffected === 0) {
          await connection.rollback();
          connection.autoCommit = previousAutoCommit;
          return res.status(500).json({ message: 'Error al actualizar cupos de la ruta' });
        }

        // 💰 NUEVO: REGISTRAR TRANSACCIÓN EN CARTERA (DÉBITO)
        // Primero obtener el saldo actual del usuario
        const userBalanceRes = await connection.execute(
          `SELECT SALDO_CARTERA_USU FROM USUARIO WHERE DOCUMENTO_USU = :doc`,
          { doc: docPasajero }
        );
        const currentBalance = Number(userBalanceRes.rows[0][0]);
        const newBalance = currentBalance - Number(precioRuta);
        
        await connection.execute(
          `INSERT INTO TRANSACCIONES_CARTERA 
           (ID_TRA, DOCUMENTO_USU_TRA, ID_TTR_TRA, MONTO_TRA, SALDO_RESULTANTE_TRA, FECHA_REALIZACION_TRA)
           VALUES (SEQ_TRANSACCIONES_CARTERA.NEXTVAL, :doc, 2, :monto, :newBalance, SYSDATE)`,
          { doc: docPasajero, monto: Number(precioRuta), newBalance },
          { autoCommit: false }
        );

        // 💰 NUEVO: ACTUALIZAR SALDO DEL USUARIO
        const saldoUpdateResult = await connection.execute(
          `UPDATE USUARIO SET SALDO_CARTERA_USU = SALDO_CARTERA_USU - :monto 
           WHERE DOCUMENTO_USU = :doc`,
          { monto: Number(precioRuta), doc: docPasajero },
          { autoCommit: false }
        );

        if (saldoUpdateResult.rowsAffected === 0) {
          await connection.rollback();
          connection.autoCommit = previousAutoCommit;
          return res.status(400).json({ message: 'No se pudo actualizar el saldo del pasajero' });
        }

        // ✅ COMMIT: TODAS LAS OPERACIONES EXITOSAS
        await connection.commit();
        connection.autoCommit = previousAutoCommit;
        console.log(`[✓] Transacción atómica completada: Solicitud ${solicitudId} aceptada, cartera debitada`);

      } catch (transactionError) {
        // 🔄 ROLLBACK AUTOMÁTICO si hay error
        try {
          await connection.rollback();
          console.error(`[ROLLBACK] Error en transacción: ${transactionError.message}`);
        } catch (rollbackErr) {
          console.error(`[ERROR] Fallo al hacer ROLLBACK: ${rollbackErr.message}`);
        }
        connection.autoCommit = previousAutoCommit;
        throw transactionError;
      }
    }

    await connection.execute(
      `UPDATE SOLICITUD_CUPO SET ID_ESO_SOL = :targetStatusId WHERE ID_SOL = :solicitudId`,
      { targetStatusId, solicitudId }
    );

    const passengerInfo = await connection.execute(
      `SELECT NVL(u.CORREO_USU, ''), NVL(u.NOMBRES_USU, '') || ' ' || NVL(u.PRIMER_APELLIDO_USU, '')
       FROM SOLICITUD_CUPO s
       LEFT JOIN USUARIO_PERFIL up ON up.ID_UPE = s.ID_UPE_SOL
       LEFT JOIN USUARIO u ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
       WHERE s.ID_SOL = :solicitudId`,
      { solicitudId }
    );

    const passengerEmail = passengerInfo.rows.length ? passengerInfo.rows[0][0] : null;
    const passengerName = passengerInfo.rows.length ? passengerInfo.rows[0][1] : 'Pasajero';

    if (passengerEmail) {
      try {
        await sendNotificationEmail(
          passengerEmail,
          `Solicitud ${targetStatus.toLowerCase()} - VamonosPues`,
          `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
              <h2>Hola ${passengerName}</h2>
              <p>Tu solicitud ha sido <strong>${targetStatus.toLowerCase()}</strong>.</p>
              <p>Consulta el panel para ver más detalles sobre tu solicitud.</p>
            </div>
          `
        );
      } catch (emailError) {
        console.error('[WARN] No se pudo enviar notificación al pasajero:', emailError);
      }
    }

    successResponse(res, { id: idSol, status: targetStatus }, `Solicitud ${action === 'aceptar' ? 'aceptada' : 'rechazada'} correctamente`);
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar estado de solicitud', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getDriverRoutes(req, res) {
  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    connection = await getConnection();
    const driverProfileId = await getProfileId(connection, documento, 2);

    if (!driverProfileId) {
      return res.status(403).json({ message: 'Solo conductores pueden ver sus rutas' });
    }

    const result = await connection.execute(
      `SELECT
         r.ID_RUT,
         TO_CHAR(r.HORA_SALIDA_RUT, 'YYYY-MM-DD HH24:MI'),
         r.CUPOS_DISPONIBLES_RUT,
         r.CUPOS_TOTALES_RUT,
         r.PRECIO_CUPO_RUT,
         r.DISTANCIA_KM_RUT,
         NVL(v.PLACA_VEH, '') AS PLACA_VEH,
         NVL(u.NOMBRES_USU, 'Sin nombre') || ' ' || NVL(u.PRIMER_APELLIDO_USU, '') AS CONDUCTOR,
         er.NOMBRE_ERU,
         p.ID_PEN,
         p.LATITUD_PEN,
         p.LONGITUD_PEN,
         p.ORDEN_PEN
       FROM RUTA r
       LEFT JOIN ESTADO_RUTA er ON r.ID_EST_RUT = er.ID_ERU
       LEFT JOIN VEHICULO v ON v.ID_VEH = r.ID_VEH_RUT
       LEFT JOIN USUARIO_PERFIL up ON up.ID_UPE = r.ID_UPE_RUT
       LEFT JOIN USUARIO u ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
       LEFT JOIN PUNTO_ENCUENTRO p ON p.ID_RUT_PEN = r.ID_RUT
       WHERE r.ID_UPE_RUT = :driverProfileId
       ORDER BY r.HORA_SALIDA_RUT ASC, p.ORDEN_PEN ASC`,
      { driverProfileId }
    );

    const routeMap = new Map();
    for (const row of result.rows) {
      const id = row[0];
      if (!routeMap.has(id)) {
        routeMap.set(id, {
          id,
          departure: row[1],
          availableSeats: row[2],
          totalSeats: row[3],
          price: row[4],
          distance: row[5],
          vehiclePlate: row[6],
          driverName: row[7],
          status: row[8],
          meetingPoints: [],
        });
      }

      const pointId = row[9];
      if (pointId !== null) {
        routeMap.get(id).meetingPoints.push({
          id: pointId,
          lat: row[10],
          lng: row[11],
          order: row[12],
        });
      }
    }

    const routes = Array.from(routeMap.values());

    successResponse(res, routes, 'Rutas del conductor obtenidas correctamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener rutas del conductor', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function getDriverSolicitudes(req, res) {
  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    connection = await getConnection();
    const driverProfileId = await getProfileId(connection, documento, 2);

    if (!driverProfileId) {
      return res.status(403).json({ message: 'Solo conductores pueden ver sus solicitudes' });
    }

    const driverDocResult = await connection.execute(
      `SELECT DOCUMENTO_USU_UPE FROM USUARIO_PERFIL WHERE ID_UPE = :driverProfileId`,
      { driverProfileId }
    );
    const driverDoc = driverDocResult.rows.length ? driverDocResult.rows[0][0] : null;

    const result = await connection.execute(
      `SELECT
         s.ID_SOL,
         s.ID_RUT_SOL,
         TO_CHAR(r.HORA_SALIDA_RUT, 'YYYY-MM-DD HH24:MI'),
         NVL(u.NOMBRES_USU, 'Sin nombre') || ' ' || NVL(u.PRIMER_APELLIDO_USU, '') AS passengerName,
         s.MONTO_SOL,
         mp.NOMBRE_MPA,
         es.NOMBRE_ESO,
         rs.NOMBRE_ERU AS routeStatus,
         up.DOCUMENTO_USU_UPE AS passengerDocument,
         TO_CHAR(s.FECHA_CREACION_SOL, 'YYYY-MM-DD HH24:MI'),
         CASE WHEN EXISTS (
           SELECT 1 FROM CALIFICACION c 
           WHERE c.SOL_ID_CAL = s.ID_SOL 
           AND c.DOCUMENTO_CALIFICADOR_CAL = :driverDoc 
           AND c.DOCUMENTO_CALIFICADO_CAL = up.DOCUMENTO_USU_UPE
         ) THEN 1 ELSE 0 END AS calificadoPorMi
       FROM SOLICITUD_CUPO s
       JOIN RUTA r ON r.ID_RUT = s.ID_RUT_SOL
       LEFT JOIN USUARIO_PERFIL up ON up.ID_UPE = s.ID_UPE_SOL
       LEFT JOIN USUARIO u ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
       LEFT JOIN ESTADO_SOLICITUD es ON es.ID_ESO = s.ID_ESO_SOL
       LEFT JOIN ESTADO_RUTA rs ON rs.ID_ERU = r.ID_EST_RUT
       LEFT JOIN METODO_PAGO mp ON mp.ID_MPA = s.ID_MPA_SOL
       WHERE r.ID_UPE_RUT = :driverProfileId
       ORDER BY s.FECHA_CREACION_SOL DESC`,
      { driverProfileId, driverDoc }
    );

    const requests = result.rows.map((row) => ({
      id: row[0],
      routeId: row[1],
      departure: row[2],
      passenger: row[3],
      amount: row[4],
      paymentMethod: row[5],
      status: row[6],
      routeStatus: row[7],
      passengerDocument: row[8],
      requestedAt: row[9],
      calificadoPorMi: row[10] === 1,
    }));

    successResponse(res, requests, 'Solicitudes del conductor obtenidas correctamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener solicitudes del conductor', 500);
  } finally {
    if (connection) await connection.close();
  }
}

export async function finalizeRoute(req, res) {
  const routeId = Number(req.params.id);
  const documento = req.user?.documento;
  let connection;

  try {
    if (!documento) return res.status(401).json({ message: 'Usuario no autenticado' });

    connection = await getConnection();
    const driverProfileId = await getProfileId(connection, documento, 2);
    if (!driverProfileId) return res.status(403).json({ message: 'Solo conductores pueden finalizar rutas' });

    const routeRes = await connection.execute(
      `SELECT ID_RUT, ID_UPE_RUT, ID_EST_RUT FROM RUTA WHERE ID_RUT = :routeId`,
      { routeId }
    );

    if (!routeRes.rows.length) return res.status(404).json({ message: 'Ruta no encontrada' });

    const [idRut, idUpeRut, idEstRut] = routeRes.rows[0];
    if (idUpeRut !== driverProfileId) return res.status(403).json({ message: 'No eres el conductor de esta ruta' });

    const estRes = await connection.execute(`SELECT NOMBRE_ERU FROM ESTADO_RUTA WHERE ID_ERU = :id`, { id: idEstRut });
    const estName = estRes.rows.length ? estRes.rows[0][0] : null;
    if (estName === 'COMPLETADA') return res.status(400).json({ message: 'La ruta ya fue finalizada' });

    // Obtener estado ACEPTADA id
    const acceptedStatusId = await getIdByName(connection, 'ESTADO_SOLICITUD', 'ID_ESO', 'NOMBRE_ESO', 'ACEPTADA');
    const carteraMetodoId = await getIdByName(connection, 'METODO_PAGO', 'ID_MPA', 'NOMBRE_MPA', 'CARTERA_VIRTUAL');
    const pagoTipoId = await getIdByName(connection, 'TIPO_TRANSACCION', 'ID_TTR', 'NOMBRE_TTR', 'PAGO_VIAJE');
    const recargaTipoId = await getIdByName(connection, 'TIPO_TRANSACCION', 'ID_TTR', 'NOMBRE_TTR', 'RECARGA');
    const reservedCupoStateId = await getIdByName(connection, 'ESTADO_CUPO_RUTA', 'ID_ECU', 'NOMBRE_ECU', 'RESERVADO');
    const completedCupoStateId = await getIdByName(connection, 'ESTADO_CUPO_RUTA', 'ID_ECU', 'NOMBRE_ECU', 'COMPLETADO');

    // Obtener solicitudes aceptadas para la ruta
    const solsRes = await connection.execute(
      `SELECT s.ID_SOL, s.ID_MPA_SOL, s.MONTO_SOL, up.DOCUMENTO_USU_UPE
       FROM SOLICITUD_CUPO s
       LEFT JOIN USUARIO_PERFIL up ON up.ID_UPE = s.ID_UPE_SOL
       WHERE s.ID_RUT_SOL = :routeId AND s.ID_ESO_SOL = :acceptedStatusId`,
      { routeId, acceptedStatusId }
    );

    const solicitudes = solsRes.rows.map(r => ({ id: r[0], metodoId: r[1], monto: Number(r[2] || 0), documento: r[3] }));

    // Validar fondos para pagos con cartera
    const insufficient = [];
    for (const s of solicitudes) {
      if (s.metodoId === carteraMetodoId) {
        const balRes = await connection.execute(`SELECT SALDO_CARTERA_USU FROM USUARIO WHERE DOCUMENTO_USU = :doc`, { doc: s.documento });
        const saldo = balRes.rows.length ? Number(balRes.rows[0][0]) : 0;
        if (saldo < s.monto) insufficient.push({ solicitudId: s.id, documento: s.documento, saldo, monto: s.monto });
      }
    }

    if (insufficient.length) {
      return res.status(400).json({ message: 'Fondos insuficientes en algunas carteras', insufficient });
    }

    // Procesar cobros y movimientos atómicamente
    let totalToDriver = 0;
    for (const s of solicitudes) {
      const cupoResult = await connection.execute(
        `SELECT COUNT(*) FROM CUPO_RUTA WHERE ID_SOL_CRU = :solId AND ID_RUT_CRU = :rutId`,
        { solId: s.id, rutId: routeId }
      );

      if (cupoResult.rows[0][0] === 0) {
        if (!reservedCupoStateId) {
          return res.status(500).json({ message: 'Estado de cupo reservado no encontrado' });
        }

        await connection.execute(
          `INSERT INTO CUPO_RUTA (
             ID_SOL_CRU,
             ID_RUT_CRU,
             ID_ECU_CRU,
             FECHA_APROBACION_CRU
           ) VALUES (
             :solId,
             :rutId,
             :reservedCupoStateId,
             SYSDATE
           )`,
          { solId: s.id, rutId: routeId, reservedCupoStateId }
        );
      }

      if (s.metodoId === carteraMetodoId) {
        const balRes = await connection.execute(`SELECT SALDO_CARTERA_USU FROM USUARIO WHERE DOCUMENTO_USU = :doc FOR UPDATE`, { doc: s.documento });
        const current = balRes.rows.length ? Number(balRes.rows[0][0]) : 0;
        const newSaldo = +(current - s.monto).toFixed(2);
        await connection.execute(`UPDATE USUARIO SET SALDO_CARTERA_USU = :newSaldo WHERE DOCUMENTO_USU = :doc`, { newSaldo, doc: s.documento });
        await connection.execute(
          `INSERT INTO TRANSACCIONES_CARTERA (ID_TRA, DOCUMENTO_USU_TRA, ID_TTR_TRA, MONTO_TRA, SALDO_RESULTANTE_TRA, FECHA_REALIZACION_TRA)
           VALUES (SEQ_TRANSACCIONES_CARTERA.NEXTVAL, :doc, :tipoId, :monto, :saldo, SYSDATE)`,
          { doc: s.documento, tipoId: pagoTipoId, monto: s.monto, saldo: newSaldo }
        );
        totalToDriver += s.monto;
      }

      await connection.execute(
        `INSERT INTO HISTORIAL_VIAJE (ID_HIS, SOL_ID_HIS, RUT_ID_HIS, DOCUMENTO_USU_HIS, ROL_VIAJE_HIS, FECHA_VIAJE_HIS)
         VALUES (SEQ_HISTORIAL_VIAJE.NEXTVAL, :solId, :rutId, :doc, 'PASAJERO', SYSDATE)`,
        { solId: s.id, rutId: routeId, doc: s.documento }
      );

      if (completedCupoStateId) {
        await connection.execute(
          `UPDATE CUPO_RUTA SET ID_ECU_CRU = :completedCupoStateId WHERE ID_SOL_CRU = :solId AND ID_RUT_CRU = :rutId`,
          { completedCupoStateId, solId: s.id, rutId: routeId }
        );
      }
    }

    // Acreditar al conductor sólo lo proveniente de carteras virtuales
    if (totalToDriver > 0) {
      const driverUserRes = await connection.execute(
        `SELECT DOCUMENTO_USU_UPE FROM USUARIO_PERFIL WHERE ID_UPE = :driverProfileId`,
        { driverProfileId }
      );
      const driverDoc = driverUserRes.rows.length ? driverUserRes.rows[0][0] : null;
      if (driverDoc) {
        const drvBalRes = await connection.execute(`SELECT SALDO_CARTERA_USU FROM USUARIO WHERE DOCUMENTO_USU = :doc FOR UPDATE`, { doc: driverDoc });
        const drvCurrent = drvBalRes.rows.length ? Number(drvBalRes.rows[0][0]) : 0;
        const drvNew = +(drvCurrent + totalToDriver).toFixed(2);
        await connection.execute(`UPDATE USUARIO SET SALDO_CARTERA_USU = :drvNew WHERE DOCUMENTO_USU = :doc`, { drvNew, doc: driverDoc });
        await connection.execute(
          `INSERT INTO TRANSACCIONES_CARTERA (ID_TRA, DOCUMENTO_USU_TRA, ID_TTR_TRA, MONTO_TRA, SALDO_RESULTANTE_TRA, FECHA_REALIZACION_TRA)
           VALUES (SEQ_TRANSACCIONES_CARTERA.NEXTVAL, :doc, :tipoId, :monto, :saldo, SYSDATE)`,
          { doc: driverDoc, tipoId: recargaTipoId, monto: totalToDriver, saldo: drvNew }
        );
      }
    }

    // Marcar ruta como COMPLETADA
    const completedStateId = await getIdByName(connection, 'ESTADO_RUTA', 'ID_ERU', 'NOMBRE_ERU', 'COMPLETADA');
    if (completedStateId) {
      await connection.execute(`UPDATE RUTA SET ID_EST_RUT = :completedStateId WHERE ID_RUT = :routeId`, { completedStateId, routeId });
    }

    successResponse(res, { routeId, chargedTotal: totalToDriver }, 'Ruta finalizada y cobros aplicados');
  } catch (error) {
    console.error('[ERROR] Error al finalizar ruta:', error);
    // Retornar mensaje amigable sin exponer stack traces
    return res.status(500).json({ success: false, message: 'Error al finalizar la ruta. Por favor intenta de nuevo.' });
  } finally {
    if (connection) await connection.close();
  }
}
