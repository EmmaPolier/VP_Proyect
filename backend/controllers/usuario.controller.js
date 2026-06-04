import { getConnection } from '../db.js';

/**
 * Obtener vehículos del usuario autenticado
 */
export async function getUserVehicles(req, res) {
  let connection;
  try {
    const userDoc = req.user?.documento;
    
    if (!userDoc) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const query = `
      SELECT * FROM VEHICULO
      WHERE DOCUMENTO_USU_VEH = :documento
      ORDER BY FECHA_REGISTRO_VEH DESC
    `;

    connection = await getConnection();
    const result = await connection.execute(query, { documento: userDoc });

    // Convert Oracle result format to JSON
    const vehicles = (result.rows || []);

    return res.status(200).json({
      success: true,
      data: vehicles,
      message: `Se encontraron ${vehicles.length} vehículos`
    });
  } catch (error) {
    console.error('[ERROR] getUserVehicles:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener vehículos: ' + error.message
    });
  } finally {
    if (connection) await connection.close();
  }
}

/**
 * Crear nuevo vehículo para el usuario autenticado
 */
export async function createUserVehicle(req, res) {
  let connection;
  try {
    const userDoc = req.user?.documento;
    
    if (!userDoc) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const { marca, modelo, placa, color, estado, soat_url, licencia_url, tarjeta_url, foto_url } = req.body;

    // Validar campos requeridos
    if (!marca || !modelo || !placa || !color || !estado) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: marca, modelo, placa, color, estado'
      });
    }

    connection = await getConnection();

    // 1. Obtener ID de marca
    let marcaResult = await connection.execute(
      `SELECT ID_MAR FROM MARCA_VEHICULO WHERE UPPER(NOMBRE_MAR) = UPPER(:marca)`,
      { marca }
    );
    
    if (!marcaResult.rows || marcaResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Marca "${marca}" no encontrada en el sistema`
      });
    }
    const idMar = marcaResult.rows[0][0];

    // 2. Obtener ID de modelo
    let modeloResult = await connection.execute(
      `SELECT ID_MOD FROM MODELO_VEHICULO WHERE UPPER(NOMBRE_MOD) = UPPER(:modelo)`,
      { modelo }
    );
    
    if (!modeloResult.rows || modeloResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Modelo "${modelo}" no encontrado en el sistema`
      });
    }
    const idMod = modeloResult.rows[0][0];

    // 3. Obtener ID_MM_VEH (relación marca-modelo)
    let mmResult = await connection.execute(
      `SELECT ID_MM_VEH FROM MARCA_MODELO_VEH WHERE ID_MAR_MMV = :idMar AND ID_MOD_MMV = :idMod`,
      { idMar, idMod }
    );
    
    if (!mmResult.rows || mmResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `La combinación ${marca} ${modelo} no existe en el sistema`
      });
    }
    const idMmVeh = mmResult.rows[0][0];

    // 4. Obtener ID de color
    let colorResult = await connection.execute(
      `SELECT ID_COL FROM COLOR_VEHICULO WHERE UPPER(NOMBRE_COL) = UPPER(:color)`,
      { color }
    );
    
    if (!colorResult.rows || colorResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Color "${color}" no encontrado en el sistema`
      });
    }
    const idCol = colorResult.rows[0][0];

    // 5. Obtener ID de estado
    let estadoResult = await connection.execute(
      `SELECT ID_EVE FROM ESTADO_VEHICULO WHERE UPPER(NOMBRE_EVE) = UPPER(:estado)`,
      { estado }
    );
    
    if (!estadoResult.rows || estadoResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Estado "${estado}" no encontrado en el sistema`
      });
    }
    const idEst = estadoResult.rows[0][0];

    // 6. Obtener siguiente ID para vehículo
    let idResult = await connection.execute(
      `SELECT NVL(MAX(ID_VEH), 0) + 1 as NEXT_ID FROM VEHICULO`
    );
    const nextId = idResult.rows[0][0];

    // 7. Insertar nuevo vehículo
    const insertQuery = `
      INSERT INTO VEHICULO (
        ID_VEH, DOCUMENTO_USU_VEH, ID_MM_VEH, ID_COL_VEH, ID_EST_VEH,
        PLACA_VEH, SOAT_URL_VEH, LICENCIA_URL_VEH, TARJETA_URL_VEH, VEHICULO_URL_VEH,
        FECHA_REGISTRO_VEH
      ) VALUES (
        :idVeh, :docUsuVeh, :idMmVeh, :idColVeh, :idEstVeh,
        :placaVeh, :soatUrl, :licenciaUrl, :tarjetaUrl, :vehiculoUrl,
        SYSDATE
      )
    `;

    await connection.execute(insertQuery, {
      idVeh: nextId,
      docUsuVeh: userDoc,
      idMmVeh: idMmVeh,
      idColVeh: idCol,
      idEstVeh: idEst,
      placaVeh: placa.toUpperCase(),
      soatUrl: soat_url || null,
      licenciaUrl: licencia_url || null,
      tarjetaUrl: tarjeta_url || null,
      vehiculoUrl: foto_url || null
    });

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Vehículo registrado correctamente',
      data: { id: nextId }
    });
  } catch (error) {
    console.error('[ERROR] createUserVehicle:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar vehículo: ' + error.message
    });
  } finally {
    if (connection) await connection.close();
  }
}

/**
 * Eliminar vehículo del usuario autenticado
 */
export async function deleteUserVehicle(req, res) {
  let connection;
  try {
    const userDoc = req.user?.documento;
    const vehicleId = req.params.id;
    
    if (!userDoc) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'ID de vehículo no proporcionado'
      });
    }

    connection = await getConnection();

    // Verificar que el vehículo pertenece al usuario
    let checkQuery = `SELECT ID_VEH FROM VEHICULO WHERE ID_VEH = :vehicleId AND DOCUMENTO_USU_VEH = :documento`;
    let checkResult = await connection.execute(checkQuery, { vehicleId, documento: userDoc });

    if (!checkResult.rows || checkResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este vehículo'
      });
    }

    // Eliminar vehículo
    let deleteQuery = `DELETE FROM VEHICULO WHERE ID_VEH = :vehicleId AND DOCUMENTO_USU_VEH = :documento`;
    await connection.execute(deleteQuery, { vehicleId, documento: userDoc });

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Vehículo eliminado correctamente'
    });
  } catch (error) {
    console.error('[ERROR] deleteUserVehicle:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar vehículo: ' + error.message
    });
  } finally {
    if (connection) await connection.close();
  }
}

/**
 * Obtener historial de viajes del usuario autenticado
 */
export async function getUserTravelHistory(req, res) {
  let connection;
  try {
    const userDoc = req.user?.documento;
    
    if (!userDoc) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const query = `
      SELECT * FROM HISTORIAL_VIAJE
      WHERE DOCUMENTO_USU_HIS = :documento
      ORDER BY FECHA_VIAJE_HIS DESC
    `;

    connection = await getConnection();
    const result = await connection.execute(query, { documento: userDoc });

    // Convert Oracle result format to JSON
    const travels = (result.rows || []);

    return res.status(200).json({
      success: true,
      data: travels,
      message: `Se encontraron ${travels.length} viajes`
    });
  } catch (error) {
    console.error('[ERROR] getUserTravelHistory:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener historial: ' + error.message
    });
  } finally {
    if (connection) await connection.close();
  }
}
