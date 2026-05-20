/**
 * Utilidad para estandarizar respuestas de la API
 */

export const successResponse = (res, data, message = 'Operación exitosa', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const errorResponse = (res, error, message = 'Error en la operación', statusCode = 400) => {
  console.error('[ERROR]', message, error);
  
  res.status(statusCode).json({
    success: false,
    message,
    error: error?.message || error,
    timestamp: new Date().toISOString()
  });
};

export const paginatedResponse = (res, data, page, pageSize, total, message = 'Datos obtenidos') => {
  const totalPages = Math.ceil(total / pageSize);
  
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
    timestamp: new Date().toISOString()
  });
};
