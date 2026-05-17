import { getConnection } from '../db.js';

export async function registerVehicle(req, res) {
  const { driverId, brand, model, plate, color, soatUrl, licenciaUrl, tarjetaUrl, fotoUrl } = req.body;

  let connection;
  try {
    // Validar campos requeridos
    if (!driverId || !brand || !model || !plate || !color) {
      return res.status(400).json({ error: 'Faltan campos requeridos: driverId, brand, model, plate, color' });
    }

    connection = await getConnection();

    // Obtener ID de marca
    const brandResult = await connection.execute(
      `SELECT ID_MAR FROM MARCA_VEHICULO WHERE UPPER(NOMBRE_MAR) = UPPER(:brand)`,
      { brand }
    );

    if (!brandResult.rows || brandResult.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ error: `Marca de vehículo no encontrada: ${brand}` });
    }
    const idMarca = brandResult.rows[0][0];

    // Obtener ID de modelo
    const modelResult = await connection.execute(
      `SELECT ID_MOD FROM MODELO_VEHICULO WHERE UPPER(NOMBRE_MOD) = UPPER(:model)`,
      { model }
    );

    if (!modelResult.rows || modelResult.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ error: `Modelo de vehículo no encontrado: ${model}` });
    }
    const idModelo = modelResult.rows[0][0];

    // Obtener ID de color
    const colorResult = await connection.execute(
      `SELECT ID_COL FROM COLOR_VEHICULO WHERE UPPER(NOMBRE_COL) = UPPER(:color)`,
      { color }
    );

    if (!colorResult.rows || colorResult.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ error: `Color no encontrado: ${color}` });
    }
    const idColor = colorResult.rows[0][0];

    // Estado ACTIVO = 1
    const idEstado = 1;

    // Obtener siguiente ID de vehículo
    const seqResult = await connection.execute(
      `SELECT SEQ_VEHICULO.NEXTVAL FROM DUAL`
    );
    const idVehiculo = seqResult.rows[0][0];

    // Insertar vehículo
    await connection.execute(
      `INSERT INTO VEHICULO (
        ID_VEH, DOCUMENTO_USU_VEH, ID_MAR_VEH, ID_MOD_VEH, ID_COL_VEH,
        ID_EST_VEH, PLACA_VEH, SOAT_URL_VEH, LICENCIA_URL_VEH, TARJETA_URL_VEH,
        VEHICULO_URL_VEH, FECHA_REGISTRO_VEH
      ) VALUES (
        :idVehiculo, :driverId, :idMarca, :idModelo, :idColor,
        :idEstado, :plate, :soatUrl, :licenciaUrl, :tarjetaUrl,
        :fotoUrl, SYSDATE
      )`,
      {
        idVehiculo,
        driverId,
        idMarca,
        idModelo,
        idColor,
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
        id: idVehiculo,
        driverId,
        plate: plate.toUpperCase(),
        brand,
        model,
        color
      },
      message: 'Vehículo registrado exitosamente'
    });
  } catch (err) {
    console.error('[ERROR] Error en registerVehicle:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
