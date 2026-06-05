import { getConnection } from '../db.js';

// Obtener todas las marcas
export async function getBrands(req, res) {
  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT ID_MAR, NOMBRE_MAR 
       FROM MARCA_VEHICULO 
       ORDER BY NOMBRE_MAR ASC`,
      []
    );

    await connection.close();

    const brands = result.rows.map(row => ({
      id: row[0],
      nombre: row[1]
    }));

    return res.json({ 
      success: true,
      message: 'Marcas obtenidas correctamente',
      data: { brands },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[ERROR] Error en getBrands:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error al obtener marcas', details: err.message });
  }
}

// Obtener modelos por marca
export async function getModelsByBrand(req, res) {
  const { brandId } = req.query;

  let connection;
  try {
    if (!brandId) {
      return res.status(400).json({ error: 'brandId es requerido' });
    }

    connection = await getConnection();

    // Obtener modelos que pertenecen a esta marca a través de MARCA_MODELO_VEH
    const result = await connection.execute(
      `SELECT DISTINCT m.ID_MOD, m.NOMBRE_MOD, m.ANIO_MOD
       FROM MODELO_VEHICULO m
       INNER JOIN MARCA_MODELO_VEH mm ON m.ID_MOD = mm.ID_MOD_MMV
       WHERE mm.ID_MAR_MMV = :brandId
       ORDER BY m.NOMBRE_MOD ASC`,
      { brandId: parseInt(brandId) }
    );

    await connection.close();

    const models = result.rows.map(row => ({
      id: row[0],
      nombre: row[1],
      año: row[2]
    }));

    return res.json({ 
      success: true,
      message: 'Modelos obtenidos correctamente',
      data: { models },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[ERROR] Error en getModelsByBrand:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error al obtener modelos', details: err.message });
  }
}

// Crear un nuevo modelo (requiere marca)
export async function createModel(req, res) {
  const { nombre, anio, brandId } = req.body;

  let connection;
  try {
    // Validar campos requeridos
    if (!nombre || !anio || !brandId) {
      return res.status(400).json({ 
        error: 'nombre, anio y brandId son requeridos' 
      });
    }

    if (isNaN(anio) || anio < 1990 || anio > 2100) {
      return res.status(400).json({ 
        error: 'Año debe estar entre 1990 y 2100' 
      });
    }

    connection = await getConnection();

    // Verificar que la marca existe
    const brandCheck = await connection.execute(
      `SELECT ID_MAR FROM MARCA_VEHICULO WHERE ID_MAR = :brandId`,
      { brandId }
    );

    if (!brandCheck.rows || brandCheck.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ error: 'La marca no existe' });
    }

    // Crear modelo
    const seqModelo = await connection.execute(
      `SELECT SEQ_MODELO_VEHICULO.NEXTVAL as nextId FROM DUAL`
    );
    const modelId = seqModelo.rows[0][0];

    await connection.execute(
      `INSERT INTO MODELO_VEHICULO (ID_MOD, NOMBRE_MOD, ANIO_MOD)
       VALUES (:id, :nombre, :anio)`,
      { id: modelId, nombre, anio },
      { autoCommit: false }
    );

    // Crear relación MARCA_MODELO_VEH
    const seqMM = await connection.execute(
      `SELECT SEQ_MARCA_MODELO_VEH.NEXTVAL as nextId FROM DUAL`
    );
    const mmId = seqMM.rows[0][0];

    await connection.execute(
      `INSERT INTO MARCA_MODELO_VEH (ID_MM_VEH, ID_MAR_MMV, ID_MOD_MMV, FECHA_CREACION_MMV)
       VALUES (:id, :brandId, :modelId, SYSDATE)`,
      { id: mmId, brandId, modelId }
    );

    await connection.commit();
    await connection.close();

    return res.status(201).json({
      id: modelId,
      nombre,
      anio,
      brandId,
      message: 'Modelo creado exitosamente'
    });
  } catch (err) {
    console.error('[ERROR] Error en createModel:', err);
    if (connection) {
      await connection.rollback();
      await connection.close();
    }
    return res.status(500).json({ error: 'Error al crear modelo', details: err.message });
  }
}

// Obtener colores
export async function getColors(req, res) {
  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT ID_COL, NOMBRE_COL 
       FROM COLOR_VEHICULO 
       ORDER BY NOMBRE_COL ASC`,
      []
    );

    await connection.close();

    const colors = result.rows.map(row => ({
      id: row[0],
      nombre: row[1]
    }));

    return res.json({ 
      success: true,
      message: 'Colores obtenidos correctamente',
      data: { colors },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[ERROR] Error en getColors:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error al obtener colores', details: err.message });
  }
}
