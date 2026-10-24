import { getConnection } from '../db.js';

export async function listTypeEmergencies(req, res) {
    let connection;

    try {
        connection = await getConnection();

        const result = await connection.execute(
            `SELECT ID_TEM, NOMBRE_TEM
            FROM TIPO_EMERGENCIA
            WHERE ACTIVO_TEM = 'S'
            ORDER BY ORDEN_TEM`
        );

        return res.status(200).json({
            success: true,
            message: 'Tipos de emergencia obtenidos correctamente',
            data: (result.rows || []).map((row) => ({
                id: row[0],
                nombre: row[1],
            })),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[EMERGENCY-TYPES] No fue posible consultar el catálogo');
        return res.status(500).json({
        success: false,
        message: 'No fue posible obtener los tipos de emergencia',
        error: 'ERROR_INTERNO',
        timestamp: new Date().toISOString(),
        });
    } finally {
        if (connection) await connection.close();
    }
}