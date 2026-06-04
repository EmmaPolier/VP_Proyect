import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateVehiculo } from '../../utils/validators.js';

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

export async function getAllVehiculos(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;

  let connection;

  try {
    connection = await getConnection();

    const totalResult = await connection.execute('SELECT COUNT(*) as total FROM VEHICULO');
    const total = totalResult.rows[0][0];

    const result = await connection.execute(
      `SELECT
         v.ID_VEH,
         v.PLACA_VEH,
         m.NOMBRE_MAR,
         mo.NOMBRE_MOD,
         c.NOMBRE_COL,
         e.NOMBRE_EVE,
         v.DOCUMENTO_USU_VEH,
         TO_CHAR(v.FECHA_REGISTRO_VEH, 'YYYY-MM-DD')
       FROM VEHICULO v
       LEFT JOIN MARCA_VEHICULO m ON m.ID_MAR = v.ID_MAR_VEH
       LEFT JOIN MODELO_VEHICULO mo ON mo.ID_MOD = v.ID_MOD_VEH
       LEFT JOIN COLOR_VEHICULO c ON c.ID_COL = v.ID_COL_VEH
       LEFT JOIN ESTADO_VEHICULO e ON e.ID_EVE = v.ID_EST_VEH
       ORDER BY v.ID_VEH
       OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
      { offset, pageSize }
    );

    const data = result.rows.map((row) => ({
      id: row[0],
      placa: row[1],
      marca: row[2],
      modelo: row[3],
      color: row[4],
      estado: row[5],
      documentoUsuario: row[6],
      fechaRegistro: row[7],
    }));

    paginatedResponse(res, data, page, pageSize, total, 'Vehículos obtenidos exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener vehículos', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

export async function getVehiculoById(req, res) {
  const { id } = req.params;
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
         v.ID_VEH,
         v.PLACA_VEH,
         v.ID_MAR_VEH,
         v.ID_MOD_VEH,
         v.ID_COL_VEH,
         v.ID_EST_VEH,
         v.DOCUMENTO_USU_VEH,
         TO_CHAR(v.FECHA_REGISTRO_VEH, 'YYYY-MM-DD'),
         v.SOAT_URL_VEH,
         v.LICENCIA_URL_VEH,
         v.TARJETA_URL_VEH,
         v.VEHICULO_URL_VEH
       FROM VEHICULO v
       WHERE v.ID_VEH = :id`,
      { id }
    );

    if (!result.rows.length) {
      return errorResponse(res, null, 'Vehículo no encontrado', 404);
    }

    const row = result.rows[0];
    const data = {
      id: row[0],
      placa: row[1],
      idMarca: row[2],
      idModelo: row[3],
      idColor: row[4],
      idEstado: row[5],
      documentoUsuario: row[6],
      fechaRegistro: row[7],
      soatUrl: row[8],
      licenciaUrl: row[9],
      tarjetaUrl: row[10],
      vehiculoUrl: row[11],
    };

    successResponse(res, data, 'Vehículo obtenido exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al obtener vehículo', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

export async function createVehiculo(req, res) {
  const {
    placa,
    idMarca,
    idModelo,
    idColor,
    idEstado,
    documentoUsuario,
    fechaRegistro,
    soatUrl,
    licenciaUrl,
    tarjetaUrl,
    vehiculoUrl,
  } = req.body;

  const validation = validateVehiculo({
    PLACA_VEH: placa,
    ID_MAR_VEH: idMarca,
    ID_MOD_VEH: idModelo,
    ID_COL_VEH: idColor,
    ID_EST_VEH: idEstado,
    DOCUMENTO_USU_VEH: documentoUsuario,
    FECHA_REGISTRO_VEH: fechaRegistro,
    SOAT_URL_VEH: soatUrl,
    LICENCIA_URL_VEH: licenciaUrl,
    TARJETA_URL_VEH: tarjetaUrl,
    VEHICULO_URL_VEH: vehiculoUrl,
  });

  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;

  try {
    connection = await getConnection();

    const existing = await connection.execute(
      'SELECT COUNT(*) as count FROM VEHICULO WHERE PLACA_VEH = :placa',
      { placa }
    );

    if (existing.rows[0][0] > 0) {
      return errorResponse(res, null, 'Ya existe un vehículo con esta placa', 409);
    }

    const registerDate = normalizeDate(fechaRegistro) || null;
    const dateClause = registerDate ? 'TO_DATE(:registerDate, \'YYYY-MM-DD\')' : 'SYSDATE';

    await connection.execute(
      `INSERT INTO VEHICULO (
         ID_VEH,
         ID_MAR_VEH,
         ID_MOD_VEH,
         ID_COL_VEH,
         ID_EST_VEH,
         DOCUMENTO_USU_VEH,
         PLACA_VEH,
         SOAT_URL_VEH,
         LICENCIA_URL_VEH,
         TARJETA_URL_VEH,
         VEHICULO_URL_VEH,
         FECHA_REGISTRO_VEH
       ) VALUES (
         SEQ_VEHICULO.NEXTVAL,
         :idMarca,
         :idModelo,
         :idColor,
         :idEstado,
         :documentoUsuario,
         :placa,
         :soatUrl,
         :licenciaUrl,
         :tarjetaUrl,
         :vehiculoUrl,
         ${dateClause}
       )`,
      {
        idMarca,
        idModelo,
        idColor,
        idEstado,
        documentoUsuario,
        placa,
        soatUrl,
        licenciaUrl,
        tarjetaUrl,
        vehiculoUrl,
        registerDate,
      }
    );

    successResponse(res, { placa, idMarca, idModelo, idColor, idEstado, documentoUsuario }, 'Vehículo creado exitosamente', 201);
  } catch (error) {
    errorResponse(res, error, 'Error al crear vehículo', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

export async function updateVehiculo(req, res) {
  const { id } = req.params;
  const {
    placa,
    idMarca,
    idModelo,
    idColor,
    idEstado,
    documentoUsuario,
    fechaRegistro,
    soatUrl,
    licenciaUrl,
    tarjetaUrl,
    vehiculoUrl,
  } = req.body;

  const validation = validateVehiculo({
    PLACA_VEH: placa,
    ID_MAR_VEH: idMarca,
    ID_MOD_VEH: idModelo,
    ID_COL_VEH: idColor,
    ID_EST_VEH: idEstado,
    DOCUMENTO_USU_VEH: documentoUsuario,
    FECHA_REGISTRO_VEH: fechaRegistro,
    SOAT_URL_VEH: soatUrl,
    LICENCIA_URL_VEH: licenciaUrl,
    TARJETA_URL_VEH: tarjetaUrl,
    VEHICULO_URL_VEH: vehiculoUrl,
  }, true);

  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  let connection;

  try {
    connection = await getConnection();

    // Obtener datos actuales del vehículo
    const currentVehiculoResult = await connection.execute(
      'SELECT PLACA_VEH, DOCUMENTO_USU_VEH FROM VEHICULO WHERE ID_VEH = :id',
      { id }
    );

    if (currentVehiculoResult.rows.length === 0) {
      return errorResponse(res, null, 'Vehículo no encontrado', 404);
    }

    const currentPlaca = currentVehiculoResult.rows[0][0];
    const currentDocumentoUsuario = currentVehiculoResult.rows[0][1];

    // Validar que no haya duplicado de placa SOLO si cambió
    if (placa && placa !== currentPlaca) {
      const duplicateCheck = await connection.execute(
        'SELECT COUNT(*) as count FROM VEHICULO WHERE PLACA_VEH = :placa AND ID_VEH != :id',
        { placa, id }
      );

      if (duplicateCheck.rows[0][0] > 0) {
        return errorResponse(res, null, 'Ya existe un vehículo con la misma placa', 409);
      }
    }

    // Validar que el usuario exista si se intenta cambiar el propietario
    if (documentoUsuario && documentoUsuario !== currentDocumentoUsuario) {
      const usuarioCheck = await connection.execute(
        'SELECT COUNT(*) as count FROM USUARIO WHERE DOCUMENTO_USU = :documento',
        { documento: documentoUsuario }
      );

      if (usuarioCheck.rows[0][0] === 0) {
        return errorResponse(res, null, 'Usuario no encontrado', 404);
      }
    }

    const updateFields = [];
    const params = { id };

    if (placa) {
      updateFields.push('PLACA_VEH = :placa');
      params.placa = placa;
    }
    if (idMarca) {
      updateFields.push('ID_MAR_VEH = :idMarca');
      params.idMarca = idMarca;
    }
    if (idModelo) {
      updateFields.push('ID_MOD_VEH = :idModelo');
      params.idModelo = idModelo;
    }
    if (idColor) {
      updateFields.push('ID_COL_VEH = :idColor');
      params.idColor = idColor;
    }
    if (idEstado) {
      updateFields.push('ID_EST_VEH = :idEstado');
      params.idEstado = idEstado;
    }
    if (documentoUsuario) {
      updateFields.push('DOCUMENTO_USU_VEH = :documentoUsuario');
      params.documentoUsuario = documentoUsuario;
    }
    if (fechaRegistro) {
      updateFields.push('FECHA_REGISTRO_VEH = TO_DATE(:registerDate, \'YYYY-MM-DD\')');
      params.registerDate = normalizeDate(fechaRegistro);
    }
    if (soatUrl) {
      updateFields.push('SOAT_URL_VEH = :soatUrl');
      params.soatUrl = soatUrl;
    }
    if (licenciaUrl) {
      updateFields.push('LICENCIA_URL_VEH = :licenciaUrl');
      params.licenciaUrl = licenciaUrl;
    }
    if (tarjetaUrl) {
      updateFields.push('TARJETA_URL_VEH = :tarjetaUrl');
      params.tarjetaUrl = tarjetaUrl;
    }
    if (vehiculoUrl) {
      updateFields.push('VEHICULO_URL_VEH = :vehiculoUrl');
      params.vehiculoUrl = vehiculoUrl;
    }

    if (updateFields.length > 0) {
      await connection.execute(
        `UPDATE VEHICULO SET ${updateFields.join(', ')} WHERE ID_VEH = :id`,
        params
      );
    }

    successResponse(res, { id, placa, idMarca, idModelo, idColor, idEstado, documentoUsuario }, 'Vehículo actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al actualizar vehículo', 500);
  } finally {
    if (connection) await connection?.close();
  }
}

export async function deleteVehiculo(req, res) {
  const { id } = req.params;
  let connection;

  try {
    connection = await getConnection();

    const existing = await connection.execute(
      'SELECT COUNT(*) as count FROM VEHICULO WHERE ID_VEH = :id',
      { id }
    );

    if (existing.rows[0][0] === 0) {
      return errorResponse(res, null, 'Vehículo no encontrado', 404);
    }

    // 1. Obtener todas las rutas asociadas a este vehículo
    const rutasResult = await connection.execute(
      'SELECT ID_RUT FROM RUTA WHERE ID_VEH_RUT = :id',
      { id }
    );

    const rutaIds = rutasResult.rows.map((row) => row[0]);

    if (rutaIds.length > 0) {
      const rutaIdList = rutaIds.join(',');

      // 2. Eliminar CALIFICACION que dependen de CUPO_RUTA de estas rutas
      await connection.execute(
        `DELETE FROM CALIFICACION 
         WHERE (SOL_ID_CAL, RUT_ID_CAL) IN (
           SELECT ID_SOL_CRU, ID_RUT_CRU FROM CUPO_RUTA WHERE ID_RUT_CRU IN (${rutaIdList})
         )`,
        {}
      );

      // 3. Eliminar HISTORIAL_VIAJE que dependen de CUPO_RUTA de estas rutas
      await connection.execute(
        `DELETE FROM HISTORIAL_VIAJE 
         WHERE (SOL_ID_HIS, RUT_ID_HIS) IN (
           SELECT ID_SOL_CRU, ID_RUT_CRU FROM CUPO_RUTA WHERE ID_RUT_CRU IN (${rutaIdList})
         )`,
        {}
      );

      // 4. Eliminar CUPO_RUTA de estas rutas
      await connection.execute(
        `DELETE FROM CUPO_RUTA WHERE ID_RUT_CRU IN (${rutaIdList})`,
        {}
      );

      // 5. Eliminar SOLICITUD_CUPO que dependen de estas rutas
      await connection.execute(
        `DELETE FROM SOLICITUD_CUPO WHERE ID_RUT_SOL IN (${rutaIdList})`,
        {}
      );

      // 6. Eliminar PUNTO_ENCUENTRO de estas rutas
      await connection.execute(
        `DELETE FROM PUNTO_ENCUENTRO WHERE ID_RUT_PEN IN (${rutaIdList})`,
        {}
      );

      // 7. Eliminar las RUTA
      await connection.execute(
        `DELETE FROM RUTA WHERE ID_VEH_RUT = :id`,
        { id }
      );
    }

    // 8. Finalmente eliminar el VEHICULO
    await connection.execute('DELETE FROM VEHICULO WHERE ID_VEH = :id', { id });

    successResponse(res, { id }, 'Vehículo eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error, 'Error al eliminar vehículo', 500);
  } finally {
    if (connection) await connection?.close();
  }
}
