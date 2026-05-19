/**
 * Controller genérico para gestión de ESTADOS
 * Tablas: ESTADO_USUARIO, ESTADO_VEHICULO, ESTADO_RUTA, ESTADO_SOLICITUD, ESTADO_CUPO_RUTA
 */

import { getConnection } from '../../db.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { validateEstado } from '../../utils/validators.js';

// Mapeo de tipos de estado a tabla y columnas
const estadoConfig = {
  usuario: {
    tabla: 'ESTADO_USUARIO',
    idCol: 'ID_EUS',
    nombreCol: 'NOMBRE_EUS',
    descCol: 'DESCRIPCION_EUS',
    seq: 'SEQ_ESTADO_USUARIO'
  },
  vehiculo: {
    tabla: 'ESTADO_VEHICULO',
    idCol: 'ID_EVE',
    nombreCol: 'NOMBRE_EVE',
    descCol: null,
    seq: 'SEQ_ESTADO_VEHICULO'
  },
  ruta: {
    tabla: 'ESTADO_RUTA',
    idCol: 'ID_ERU',
    nombreCol: 'NOMBRE_ERU',
    descCol: null,
    seq: 'SEQ_ESTADO_RUTA'
  },
  solicitud: {
    tabla: 'ESTADO_SOLICITUD',
    idCol: 'ID_ESO',
    nombreCol: 'NOMBRE_ESO',
    descCol: null,
    seq: 'SEQ_ESTADO_SOLICITUD'
  },
  cupo: {
    tabla: 'ESTADO_CUPO_RUTA',
    idCol: 'ID_ECU',
    nombreCol: 'NOMBRE_ECU',
    descCol: null,
    seq: 'SEQ_ESTADO_CUPO_RUTA'
  }
};

function getConfig(tipo) {
  if (!estadoConfig[tipo]) {
    throw new Error(`Tipo de estado no válido: ${tipo}`);
  }
  return estadoConfig[tipo];
}

export async function getAllEstados(req, res) {
  const { tipo } = req.params;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;

  try {
    const config = getConfig(tipo);
    let connection;

    try {
      connection = await getConnection();

      const totalResult = await connection.execute(
        `SELECT COUNT(*) as total FROM ${config.tabla}`
      );
      const total = totalResult.rows[0][0];

      let query = `SELECT ${config.idCol}, ${config.nombreCol}`;
      if (config.descCol) {
        query += `, ${config.descCol}`;
      }
      query += ` FROM ${config.tabla} ORDER BY ${config.idCol}
                OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;

      const result = await connection.execute(query, { offset, pageSize });

      const data = result.rows.map(row => {
        const obj = {
          id: row[0],
          nombre: row[1]
        };
        if (config.descCol) {
          obj.descripcion = row[2];
        }
        return obj;
      });

      paginatedResponse(res, data, page, pageSize, total, `Estados de ${tipo} obtenidos exitosamente`);
    } finally {
      if (connection) await connection.close();
    }
  } catch (error) {
    errorResponse(res, error, `Error al obtener estados de ${req.params.tipo}`, 500);
  }
}

export async function getEstadoById(req, res) {
  const { tipo, id } = req.params;

  try {
    const config = getConfig(tipo);
    let connection;

    try {
      connection = await getConnection();
      
      let query = `SELECT ${config.idCol}, ${config.nombreCol}`;
      if (config.descCol) {
        query += `, ${config.descCol}`;
      }
      query += ` FROM ${config.tabla} WHERE ${config.idCol} = :id`;

      const result = await connection.execute(query, { id });

      if (result.rows.length === 0) {
        return errorResponse(res, null, `Estado no encontrado`, 404);
      }

      const row = result.rows[0];
      const data = {
        id: row[0],
        nombre: row[1]
      };
      if (config.descCol) {
        data.descripcion = row[2];
      }

      successResponse(res, data, `Estado obtenido exitosamente`);
    } finally {
      if (connection) await connection.close();
    }
  } catch (error) {
    errorResponse(res, error, `Error al obtener estado de ${req.params.tipo}`, 500);
  }
}

export async function createEstado(req, res) {
  const { tipo } = req.params;
  const { nombre, descripcion } = req.body;

  const validation = validateEstado({ NOMBRE: nombre }, tipo);
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  try {
    const config = getConfig(tipo);
    let connection;

    try {
      connection = await getConnection();

      const checkResult = await connection.execute(
        `SELECT COUNT(*) as count FROM ${config.tabla} WHERE ${config.nombreCol} = :nombre`,
        { nombre }
      );

      if (checkResult.rows[0][0] > 0) {
        return errorResponse(res, null, 'El estado ya existe', 409);
      }

      let insertQuery = `INSERT INTO ${config.tabla} (${config.idCol}, ${config.nombreCol}`;
      let values = `:nombre`;
      const params = { nombre };

      if (config.descCol && descripcion) {
        insertQuery += `, ${config.descCol}`;
        values += `, :descripcion`;
        params.descripcion = descripcion;
      }

      insertQuery += `) VALUES (${config.seq}.NEXTVAL, ${values})`;

      await connection.execute(insertQuery, params);

      const responseData = { nombre };
      if (config.descCol && descripcion) {
        responseData.descripcion = descripcion;
      }

      successResponse(res, responseData, 'Estado creado exitosamente', 201);
    } finally {
      if (connection) await connection.close();
    }
  } catch (error) {
    errorResponse(res, error, `Error al crear estado de ${tipo}`, 500);
  }
}

export async function updateEstado(req, res) {
  const { tipo, id } = req.params;
  const { nombre, descripcion } = req.body;

  const validation = validateEstado({ NOMBRE: nombre }, tipo);
  if (!validation.valid) {
    return errorResponse(res, null, validation.error, 400);
  }

  try {
    const config = getConfig(tipo);
    let connection;

    try {
      connection = await getConnection();

      const checkResult = await connection.execute(
        `SELECT COUNT(*) as count FROM ${config.tabla} WHERE ${config.idCol} = :id`,
        { id }
      );

      if (checkResult.rows[0][0] === 0) {
        return errorResponse(res, null, 'Estado no encontrado', 404);
      }

      let updateQuery = `UPDATE ${config.tabla} SET ${config.nombreCol} = :nombre`;
      const params = { id, nombre };

      if (config.descCol && descripcion) {
        updateQuery += `, ${config.descCol} = :descripcion`;
        params.descripcion = descripcion;
      }

      updateQuery += ` WHERE ${config.idCol} = :id`;

      await connection.execute(updateQuery, params);

      const responseData = { id, nombre };
      if (config.descCol && descripcion) {
        responseData.descripcion = descripcion;
      }

      successResponse(res, responseData, 'Estado actualizado exitosamente');
    } finally {
      if (connection) await connection.close();
    }
  } catch (error) {
    errorResponse(res, error, `Error al actualizar estado de ${tipo}`, 500);
  }
}

export async function deleteEstado(req, res) {
  const { tipo, id } = req.params;

  try {
    const config = getConfig(tipo);
    let connection;

    try {
      connection = await getConnection();

      const checkResult = await connection.execute(
        `SELECT COUNT(*) as count FROM ${config.tabla} WHERE ${config.idCol} = :id`,
        { id }
      );

      if (checkResult.rows[0][0] === 0) {
        return errorResponse(res, null, 'Estado no encontrado', 404);
      }

      await connection.execute(
        `DELETE FROM ${config.tabla} WHERE ${config.idCol} = :id`,
        { id }
      );

      successResponse(res, { id }, 'Estado eliminado exitosamente');
    } finally {
      if (connection) await connection.close();
    }
  } catch (error) {
    errorResponse(res, error, `Error al eliminar estado de ${tipo}`, 500);
  }
}
