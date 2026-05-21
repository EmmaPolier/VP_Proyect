import { getConnection } from '../db.js';

export async function registerVehicle(req, res) {
  const { driverId, brandId, modelId, plate, colorId, soatUrl, licenciaUrl, tarjetaUrl, fotoUrl } = req.body;

  let connection;
  try {
    // Validar campos requeridos
    if (!driverId || !brandId || !modelId || !plate || !colorId) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: driverId, brandId, modelId, plate, colorId' 
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

    // Validar que el color existe
    const colorCheckResult = await connection.execute(
      `SELECT ID_COL FROM COLOR_VEHICULO WHERE ID_COL = :colorId`,
      { colorId: parseInt(colorId) }
    );

    if (!colorCheckResult.rows || colorCheckResult.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ error: 'El color especificado no existe' });
    }

    // Estado ACTIVO = 1
    const idEstado = 1;

    // Insertar vehículo
    await connection.execute(
      `INSERT INTO VEHICULO (
        ID_VEH, DOCUMENTO_USU_VEH, ID_MM_VEH, ID_COL_VEH,
        ID_EST_VEH, PLACA_VEH, SOAT_URL_VEH, LICENCIA_URL_VEH, TARJETA_URL_VEH,
        VEHICULO_URL_VEH, FECHA_REGISTRO_VEH
      ) VALUES (
        SEQ_VEHICULO.NEXTVAL, :driverId, :idMarcaModelo, :colorId,
        :idEstado, :plate, :soatUrl, :licenciaUrl, :tarjetaUrl,
        :fotoUrl, SYSDATE
      )`,
      {
        driverId,
        idMarcaModelo,
        colorId: parseInt(colorId),
        idEstado,
        plate: plate.toUpperCase(),
        soatUrl: soatUrl || 'https://storage/docs/soat_default.pdf',
        licenciaUrl: licenciaUrl || 'https://storage/docs/licencia_default.pdf',
        tarjetaUrl: tarjetaUrl || 'https://storage/docs/tarjeta_default.pdf',
        fotoUrl: fotoUrl || 'https://storage/fotos/vehiculo_default.jpg'
      }
    );

    await connection.close();

    return res.status(201).json({
      vehiculo: {
        driverId,
        plate: plate.toUpperCase(),
        brandId,
        modelId,
        colorId
      },
      message: 'Vehículo registrado exitosamente'
    });
  } catch (err) {
    console.error('[ERROR] Error en registerVehicle:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
