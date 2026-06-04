import { getConnection } from '../db.js';

// ============================================================================
// GET /vehicles - Obtener vehículos del conductor autenticado
// ============================================================================
export async function getVehicles(req, res) {
  console.log('[VEHICLE-CONTROLLER] GET /vehicles called');
  const documento = req.user?.documento; // Del token JWT

  console.log('[VEHICLE-CONTROLLER] Documento del token:', documento);

  if (!documento) {
    console.log('[VEHICLE-CONTROLLER] No documento en token');
    return res.status(401).json({ error: 'No autenticado' });
  }

  let connection;
  try {
    connection = await getConnection();

    // Primero, test simple sin JOINs
    const result = await connection.execute('SELECT ID_VEH, DOCUMENTO_USU_VEH, PLACA_VEH FROM VEHICULO WHERE DOCUMENTO_USU_VEH = :documento', { documento });

    console.log('[VEHICLE-CONTROLLER] Raw result:', JSON.stringify(result.rows));

    const vehicles = (result.rows || []).map(row => ({
      id: row[0],
      documento: row[1],
      placa: row[2]
    }));

    await connection.close();

    return res.json({
      total: vehicles.length,
      vehiculos: vehicles
    });
  } catch (err) {
    console.error('[ERROR] Error en getVehicles:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}

// ============================================================================
// POST /vehicles - Registrar nuevo vehículo
// ============================================================================
export async function registerVehicle(req, res) {
  console.log('[VEHICLE-CONTROLLER] POST /vehicles (registerVehicle) called');
  const documento = req.user?.documento; // Del token JWT
  const { brandId, modelId, plate, colorId, soatUrl, licenciaUrl, tarjetaUrl, fotoUrl } = req.body;

  console.log('[VEHICLE-CONTROLLER] Datos recibidos:', {
    documento,
    brandId,
    modelId,
    plate,
    colorId
  });

  if (!documento) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  let connection;
  try {
    // Validar campos requeridos
    if (!brandId || !modelId || !plate || !colorId) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: brandId, modelId, plate, colorId' 
      });
    }

    connection = await getConnection();

    // Obtener ID_MM_VEH (MARCA_MODELO_VEH) basado en los IDs de marca y modelo
    const mmResult = await connection.execute(
      `SELECT ID_MM_VEH FROM MARCA_MODELO_VEH 
       WHERE ID_MAR_MMV = :brandId AND ID_MOD_MMV = :modelId`,
      { brandId: parseInt(brandId), modelId: parseInt(modelId) }
    );

    if (!mmResult.rows || mmResult.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ 
        error: 'La combinación de marca y modelo no existe en el sistema' 
      });
    }
    const idMarcaModelo = mmResult.rows[0][0];
    console.log('[VEHICLE-CONTROLLER] ID Marca-Modelo encontrado:', idMarcaModelo);

    // Validar que el color existe
    const colorCheckResult = await connection.execute(
      `SELECT ID_COL FROM COLOR_VEHICULO WHERE ID_COL = :colorId`,
      { colorId: parseInt(colorId) }
    );

    if (!colorCheckResult.rows || colorCheckResult.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ error: 'El color especificado no existe' });
    }

    // Validar placa única
    const plateCheckResult = await connection.execute(
      `SELECT ID_VEH FROM VEHICULO WHERE PLACA_VEH = :plate`,
      { plate: plate.toUpperCase() }
    );

    if (plateCheckResult.rows && plateCheckResult.rows.length > 0) {
      await connection.close();
      return res.status(400).json({ error: 'La placa ya está registrada en el sistema' });
    }

    // Estado ACTIVO = 1
    const idEstado = 1;

    // Insertar vehículo
    const insertResult = await connection.execute(
      `INSERT INTO VEHICULO (
        ID_VEH, DOCUMENTO_USU_VEH, ID_MM_VEH, ID_COL_VEH,
        ID_EST_VEH, PLACA_VEH, SOAT_URL_VEH, LICENCIA_URL_VEH, TARJETA_URL_VEH,
        VEHICULO_URL_VEH, FECHA_REGISTRO_VEH
      ) VALUES (
        SEQ_VEHICULO.NEXTVAL, :documento, :idMarcaModelo, :colorId,
        :idEstado, :plate, :soatUrl, :licenciaUrl, :tarjetaUrl,
        :fotoUrl, SYSDATE
      )`,
      {
        documento,
        idMarcaModelo,
        colorId: parseInt(colorId),
        idEstado,
        plate: plate.toUpperCase(),
        soatUrl: soatUrl || 'https://storage/docs/soat_default.pdf',
        licenciaUrl: licenciaUrl || 'https://storage/docs/licencia_default.pdf',
        tarjetaUrl: tarjetaUrl || 'https://storage/docs/tarjeta_default.pdf',
        fotoUrl: fotoUrl || 'https://storage/fotos/vehiculo_default.jpg'
      },
      { autoCommit: true }
    );

    console.log('[VEHICLE-CONTROLLER] Vehículo insertado:', {
      documento,
      plate: plate.toUpperCase(),
      idMarcaModelo,
      colorId,
      rowsAffected: insertResult.rowsAffected
    });

    await connection.close();

    return res.status(201).json({
      message: 'Vehículo registrado exitosamente',
      vehiculo: {
        documento,
        plate: plate.toUpperCase(),
        brandId,
        modelId,
        colorId
      }
    });
  } catch (err) {
    console.error('[ERROR] Error en registerVehicle:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}

// ============================================================================
// DELETE /vehicles/:id - Eliminar vehículo (mínimo 1 vehículo debe quedar)
// ============================================================================
export async function deleteVehicle(req, res) {
  const documento = req.user?.documento; // Del token JWT
  const vehicleId = req.params.id;

  if (!documento) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (!vehicleId) {
    return res.status(400).json({ error: 'ID del vehículo es requerido' });
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar que el vehículo pertenece al conductor autenticado
    const vehicleCheckResult = await connection.execute(
      `SELECT ID_VEH FROM VEHICULO WHERE ID_VEH = :vehicleId AND DOCUMENTO_USU_VEH = :documento`,
      { vehicleId: parseInt(vehicleId), documento }
    );

    if (!vehicleCheckResult.rows || vehicleCheckResult.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ error: 'Vehículo no encontrado o no pertenece a este conductor' });
    }

    // Contar cuántos vehículos tiene el conductor
    const countResult = await connection.execute(
      `SELECT COUNT(*) as TOTAL FROM VEHICULO WHERE DOCUMENTO_USU_VEH = :documento`,
      { documento }
    );

    const totalVehicles = countResult.rows ? countResult.rows[0][0] : 0;

    // Validar que siempre quede al menos 1 vehículo
    if (totalVehicles <= 1) {
      await connection.close();
      return res.status(400).json({ 
        error: 'No puedes eliminar el último vehículo. Debes tener al menos uno registrado.' 
      });
    }

    // Eliminar el vehículo
    await connection.execute(
      `DELETE FROM VEHICULO WHERE ID_VEH = :vehicleId`,
      { vehicleId: parseInt(vehicleId) },
      { autoCommit: true }
    );

    await connection.close();

    return res.json({
      message: 'Vehículo eliminado exitosamente',
      vehiculoId: vehicleId,
      vehiculosRestantes: totalVehicles - 1
    });
  } catch (err) {
    console.error('[ERROR] Error en deleteVehicle:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
