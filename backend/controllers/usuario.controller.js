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
    
    console.log('[USUARIO-CONTROLLER] getUserTravelHistory called for:', userDoc);
    
    if (!userDoc) {
      console.error('[USUARIO-CONTROLLER] No documento found in req.user');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const query = `
      SELECT 
        r.ID_RUT,
        NULL as SOL_ID_HIS,
        r.ID_RUT as RUT_ID_HIS,
        up.DOCUMENTO_USU_UPE as DOCUMENTO_USU_HIS,
        'CONDUCTOR' as ROL_VIAJE_HIS,
        TRUNC(r.FECHA_CREACION_RUT) as FECHA_VIAJE_HIS,
        r.LATITUD_ORIGEN_RUT,
        r.LONGITUD_ORIGEN_RUT,
        r.LATITUD_DESTINO_RUT,
        r.LONGITUD_DESTINO_RUT,
        r.HORA_SALIDA_RUT,
        r.PRECIO_CUPO_RUT,
        r.DISTANCIA_KM_RUT,
        r.CUPOS_DISPONIBLES_RUT,
        r.ID_UPE_RUT
      FROM RUTA r
      JOIN USUARIO_PERFIL up ON r.ID_UPE_RUT = up.ID_UPE
      JOIN ESTADO_RUTA er ON r.ID_EST_RUT = er.ID_ERU
      WHERE up.DOCUMENTO_USU_UPE = :documento 
        AND er.NOMBRE_ERU IN ('COMPLETADA', 'EN_CURSO')
      ORDER BY r.FECHA_CREACION_RUT DESC
    `;

    connection = await getConnection();
    const result = await connection.execute(query, { documento: userDoc });

    console.log('[USUARIO-CONTROLLER] Query executed successfully. Rows found:', result.rows?.length || 0);

    // Función para encontrar el nombre de la ubicación más cercano
    const getLocationName = (lat, lng) => {
      const LOCATION_PRESETS = [
        { name: 'San Cristóbal', lat: 6.251839, lng: -75.581228 },
        { name: 'Belén', lat: 6.242200, lng: -75.590780 },
        { name: 'Politécnico', lat: 6.197458, lng: -75.567108 },
        { name: 'Politécnico Sur', lat: 6.181200, lng: -75.570000 },
      ];

      if (!lat || !lng) return 'Ubicación desconocida';

      const distances = LOCATION_PRESETS.map(preset => ({
        name: preset.name,
        distance: Math.sqrt(Math.pow(lat - preset.lat, 2) + Math.pow(lng - preset.lng, 2))
      }));

      const closest = distances.sort((a, b) => a.distance - b.distance)[0];
      return closest && closest.distance <= 0.015 ? closest.name : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    };

    // Convertir resultado de Oracle a formato JSON amigable
    const travels = (result.rows || []).map(row => {
      try {
        // Función segura para parsear fecha
        const parseTime = (dateVal) => {
          if (!dateVal) return 'N/A';
          try {
            const date = new Date(dateVal);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
          } catch (e) {
            console.warn('[USUARIO-CONTROLLER] PARSE_TIME_ERROR:', e.message);
            return 'N/A';
          }
        };

        return {
          id: row[0],                    // ID_RUT
          solicitud_id: row[1],          // NULL (no hay solicitud cuando es conductor)
          ruta_id: row[2],               // RUT_ID_HIS (same as ID_RUT)
          documento_usuario: row[3],     // DOCUMENTO_USU_UPE
          rol: row[4],                   // 'CONDUCTOR'
          fecha_viaje: row[5],           // FECHA_CREACION_RUT
          ruta_info: {
            salida: getLocationName(row[6], row[7]),
            destino: getLocationName(row[8], row[9]),
            hora_salida: parseTime(row[10]),
            precio: row[11],
            distancia: row[12],
            cupos_disponibles: row[13],
            id_upe_rut: row[14]
          }
        };
      } catch (mapError) {
        console.error('[USUARIO-CONTROLLER] ROW_MAP_ERROR:', mapError.message);
        throw mapError;
      }
    });

    console.log('[USUARIO-CONTROLLER] Base travels mapped. Count:', travels.length);

    // Ahora obtener nombres y calificaciones para cada viaje
    const travelsWithDetails = await Promise.all(
      travels.map(async (travel) => {
        try {
          // El conductor es el usuario mismo (en la nueva consulta)
          const conductorQuery = `
            SELECT u.NOMBRES_USU 
            FROM USUARIO u
            WHERE u.DOCUMENTO_USU = :documento
          `;
          
          const conductorResult = await connection.execute(conductorQuery, { 
            documento: travel.documento_usuario
          });
          
          const nombre_conductor = conductorResult.rows?.[0]?.[0] || 'Desconocido';

          // Obtener pasajeros que usaron esta ruta (desde SOLICITUD_CUPO)
          let nombre_pasajero = 'Desconocido';
          let calificacion = null;
          let comentario = null;

          const solicitudQuery = `
            SELECT up.DOCUMENTO_USU_UPE, u.NOMBRES_USU
            FROM SOLICITUD_CUPO sc
            JOIN USUARIO_PERFIL up ON sc.ID_UPE_SOL = up.ID_UPE
            JOIN USUARIO u ON up.DOCUMENTO_USU_UPE = u.DOCUMENTO_USU
            WHERE sc.ID_RUT_SOL = :ruta_id
            FETCH FIRST 1 ROWS ONLY
          `;
          
          const solicitudResult = await connection.execute(solicitudQuery, { 
            ruta_id: travel.ruta_id 
          });
          
          if (solicitudResult.rows?.[0]) {
            nombre_pasajero = solicitudResult.rows[0][1] || 'Desconocido';

            // Obtener calificación
            const calQuery = `
              SELECT PUNTAJE_CAL, COMENTARIO_CAL
              FROM CALIFICACION
              WHERE RUT_ID_CAL = :ruta_id AND SOL_ID_CAL = :solicitud_id
            `;
            
            const calResult = await connection.execute(calQuery, {
              ruta_id: travel.ruta_id,
              solicitud_id: solicitudResult.rows[0][0]
            });
            
            if (calResult.rows?.[0]) {
              calificacion = calResult.rows[0][0];
              comentario = calResult.rows[0][1];
            }
          }

          // Retornar solo los campos que espera el frontend
          return {
            id: travel.id,
            rol: travel.rol,
            fecha_viaje: travel.fecha_viaje,
            ruta_id: travel.ruta_id,
            ruta_info: {
              salida: travel.ruta_info.salida,
              destino: travel.ruta_info.destino,
              hora_salida: travel.ruta_info.hora_salida,
              precio: travel.ruta_info.precio,
              distancia: travel.ruta_info.distancia,
              nombre_conductor,
              nombre_pasajero
            },
            calificacion,
            comentario
          };
        } catch (detailError) {
          console.error('[USUARIO-CONTROLLER] Error getting details for travel', travel.id, ':', detailError.message);
          return {
            id: travel.id,
            rol: travel.rol,
            fecha_viaje: travel.fecha_viaje,
            ruta_id: travel.ruta_id,
            ruta_info: {
              salida: travel.ruta_info.salida,
              destino: travel.ruta_info.destino,
              hora_salida: travel.ruta_info.hora_salida,
              precio: travel.ruta_info.precio,
              distancia: travel.ruta_info.distancia,
              nombre_conductor: 'Desconocido',
              nombre_pasajero: 'Desconocido'
            }
          };
        }
      })
    );

    console.log('[USUARIO-CONTROLLER] Travels with details completed. Count:', travelsWithDetails.length);
    console.log('[USUARIO-CONTROLLER] First travel data:', JSON.stringify(travelsWithDetails[0], null, 2));

    return res.status(200).json({
      success: true,
      data: travelsWithDetails,
      message: `Se encontraron ${travelsWithDetails.length} viajes`
    });
  } catch (error) {
    console.error('[USUARIO-CONTROLLER] ERROR in getUserTravelHistory:', error.message);
    console.error('[USUARIO-CONTROLLER] Stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener historial: ' + error.message
    });
  } finally {
    if (connection) await connection.close();
  }
}