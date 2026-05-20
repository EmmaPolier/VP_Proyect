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

export const validateUsuario = (data, allowPartial = false) => {
  const required = ['DOCUMENTO_USU', 'NOMBRES_USU', 'PRIMER_APELLIDO_USU', 'CORREO_USU', 'NUMERO_TELEFONO_USU', 'FECHA_NACIMIENTO_USU', 'ID_EST_USU', 'ID_PER_UPE'];
  const validation = validateRequired(data, allowPartial ? [] : required);
  if (!validation.valid) {
    return { valid: false, error: `Campos requeridos: ${validation.missingFields.join(', ')}` };
  }

  if (data.DOCUMENTO_USU && !validateString(data.DOCUMENTO_USU, 3, 30)) {
    return { valid: false, error: 'El documento debe tener entre 3 y 30 caracteres' };
  }

  if (data.NOMBRES_USU && !validateString(data.NOMBRES_USU, 1, 50)) {
    return { valid: false, error: 'El nombre debe tener entre 1 y 50 caracteres' };
  }

  if (data.PRIMER_APELLIDO_USU && !validateString(data.PRIMER_APELLIDO_USU, 1, 50)) {
    return { valid: false, error: 'El primer apellido debe tener entre 1 y 50 caracteres' };
  }

  if (data.CORREO_USU && !validateEmail(data.CORREO_USU)) {
    return { valid: false, error: 'El email no es válido' };
  }

  if (data.NUMERO_TELEFONO_USU && !validateString(data.NUMERO_TELEFONO_USU, 7, 20)) {
    return { valid: false, error: 'El teléfono debe tener entre 7 y 20 caracteres' };
  }

  if (data.FECHA_NACIMIENTO_USU && !validateDate(data.FECHA_NACIMIENTO_USU)) {
    return { valid: false, error: 'La fecha de nacimiento no es válida' };
  }

  if (data.CONTRASENA_USU && !validateString(data.CONTRASENA_USU, 6, 128)) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  if (data.ID_EST_USU && !validateNumber(data.ID_EST_USU, 1)) {
    return { valid: false, error: 'El estado del usuario es inválido' };
  }

  if (data.ID_PER_UPE && !validateNumber(data.ID_PER_UPE, 1)) {
    return { valid: false, error: 'El perfil del usuario es inválido' };
  }

  return { valid: true };
};

export const validateVehiculo = (data, allowPartial = false) => {
  const required = ['PLACA_VEH', 'ID_MAR_VEH', 'ID_MOD_VEH', 'ID_COL_VEH', 'ID_EST_VEH', 'DOCUMENTO_USU_VEH', 'SOAT_URL_VEH', 'LICENCIA_URL_VEH', 'TARJETA_URL_VEH', 'VEHICULO_URL_VEH'];
  const validation = validateRequired(data, allowPartial ? [] : required);
  if (!validation.valid) {
    return { valid: false, error: `Campos requeridos: ${validation.missingFields.join(', ')}` };
  }

  if (data.PLACA_VEH && !validateString(data.PLACA_VEH, 3, 20)) {
    return { valid: false, error: 'La placa debe tener entre 3 y 20 caracteres' };
  }

  const numericFields = ['ID_MAR_VEH', 'ID_MOD_VEH', 'ID_COL_VEH', 'ID_EST_VEH'];
  for (const field of numericFields) {
    if (data[field] && !validateNumber(data[field], 1)) {
      return { valid: false, error: `El campo ${field} es inválido` };
    }
  }

  if (data.DOCUMENTO_USU_VEH && !validateString(data.DOCUMENTO_USU_VEH, 3, 30)) {
    return { valid: false, error: 'El documento del propietario es inválido' };
  }

  if (data.FECHA_REGISTRO_VEH && !validateDate(data.FECHA_REGISTRO_VEH)) {
    return { valid: false, error: 'La fecha de registro no es válida' };
  }

  return { valid: true };
};
