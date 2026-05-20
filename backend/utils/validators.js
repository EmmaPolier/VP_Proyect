/**
 * Validadores para datos de entrada
 */

export const validateRequired = (data, fields) => {
  const missing = fields.filter(field => !data[field] || data[field].toString().trim() === '');
  return {
    valid: missing.length === 0,
    missingFields: missing
  };
};

export const validateString = (value, minLength = 1, maxLength = 255) => {
  if (typeof value !== 'string') return false;
  const length = value.trim().length;
  return length >= minLength && length <= maxLength;
};

export const validateNumber = (value, min = null, max = null) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validateDate = (date) => {
  return date instanceof Date || !isNaN(Date.parse(date));
};

export const validateEnum = (value, enumValues) => {
  return enumValues.includes(value);
};

// Validadores específicos por tabla
export const validatePerfil = (data) => {
  const validation = validateRequired(data, ['NOMBRE_PER', 'DESCRIPCION_PER']);
  if (!validation.valid) {
    return { valid: false, error: `Campos requeridos: ${validation.missingFields.join(', ')}` };
  }
  
  if (!validateString(data.NOMBRE_PER, 1, 15)) {
    return { valid: false, error: 'El nombre debe tener entre 1 y 15 caracteres' };
  }
  
  if (!validateString(data.DESCRIPCION_PER, 1, 150)) {
    return { valid: false, error: 'La descripción debe tener entre 1 y 150 caracteres' };
  }
  
  return { valid: true };
};

export const validateMarcaVehiculo = (data) => {
  const validation = validateRequired(data, ['NOMBRE_MAR']);
  if (!validation.valid) {
    return { valid: false, error: `Campos requeridos: ${validation.missingFields.join(', ')}` };
  }
  
  if (!validateString(data.NOMBRE_MAR, 1, 30)) {
    return { valid: false, error: 'El nombre debe tener entre 1 y 30 caracteres' };
  }
  
  return { valid: true };
};

export const validateModeloVehiculo = (data) => {
  const validation = validateRequired(data, ['NOMBRE_MOD', 'ANIO_MOD']);
  if (!validation.valid) {
    return { valid: false, error: `Campos requeridos: ${validation.missingFields.join(', ')}` };
  }
  
  if (!validateString(data.NOMBRE_MOD, 1, 50)) {
    return { valid: false, error: 'El nombre debe tener entre 1 y 50 caracteres' };
  }
  
  if (!validateNumber(data.ANIO_MOD, 1900, new Date().getFullYear() + 1)) {
    return { valid: false, error: `El año debe estar entre 1900 y ${new Date().getFullYear() + 1}` };
  }
  
  return { valid: true };
};

export const validateColorVehiculo = (data) => {
  const validation = validateRequired(data, ['NOMBRE_COL']);
  if (!validation.valid) {
    return { valid: false, error: `Campos requeridos: ${validation.missingFields.join(', ')}` };
  }
  
  if (!validateString(data.NOMBRE_COL, 1, 30)) {
    return { valid: false, error: 'El nombre debe tener entre 1 y 30 caracteres' };
  }
  
  return { valid: true };
};

export const validateEstado = (data, type) => {
  const validation = validateRequired(data, ['NOMBRE']);
  if (!validation.valid) {
    return { valid: false, error: `Campos requeridos: ${validation.missingFields.join(', ')}` };
  }
  
  if (!validateString(data.NOMBRE, 1, 20)) {
    return { valid: false, error: 'El nombre debe tener entre 1 y 20 caracteres' };
  }
  
  return { valid: true };
};

export const validateMetodoPago = (data) => {
  const validation = validateRequired(data, ['NOMBRE_MPA']);
  if (!validation.valid) {
    return { valid: false, error: `Campos requeridos: ${validation.missingFields.join(', ')}` };
  }
  
  if (!validateString(data.NOMBRE_MPA, 1, 30)) {
    return { valid: false, error: 'El nombre debe tener entre 1 y 30 caracteres' };
  }
  
  return { valid: true };
};

export const validateTipoTransaccion = (data) => {
  const validation = validateRequired(data, ['NOMBRE_TTR']);
  if (!validation.valid) {
    return { valid: false, error: `Campos requeridos: ${validation.missingFields.join(', ')}` };
  }
  
  if (!validateString(data.NOMBRE_TTR, 1, 20)) {
    return { valid: false, error: 'El nombre debe tener entre 1 y 20 caracteres' };
  }
  
  if (data.DESCRIPCION_TTR && !validateString(data.DESCRIPCION_TTR, 0, 50)) {
    return { valid: false, error: 'La descripción debe tener máximo 50 caracteres' };
  }
  
  return { valid: true };
};
