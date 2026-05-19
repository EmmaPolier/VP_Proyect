/**
 * Validadores Frontend
 * Deben coincidir con validadores del backend
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validators = {
  // Validador de nombre de perfil
  nombre: (value: string, minLength: number = 1, maxLength: number = 15): ValidationResult => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: `El nombre es requerido` };
    }
    if (value.length < minLength) {
      return { valid: false, error: `El nombre debe tener al menos ${minLength} caracteres` };
    }
    if (value.length > maxLength) {
      return { valid: false, error: `El nombre no puede exceder ${maxLength} caracteres` };
    }
    return { valid: true };
  },

  // Validador de descripción
  descripcion: (value: string | undefined, minLength: number = 0, maxLength: number = 150): ValidationResult => {
    if (!value) return { valid: true }; // Opcional
    if (value.length < minLength) {
      return { valid: false, error: `La descripción debe tener al menos ${minLength} caracteres` };
    }
    if (value.length > maxLength) {
      return { valid: false, error: `La descripción no puede exceder ${maxLength} caracteres` };
    }
    return { valid: true };
  },

  // Validador de año para modelos
  ano: (value: number | string): ValidationResult => {
    const year = typeof value === 'string' ? parseInt(value) : value;
    const currentYear = new Date().getFullYear();

    if (isNaN(year)) {
      return { valid: false, error: 'El año debe ser un número válido' };
    }
    if (year < 1900) {
      return { valid: false, error: 'El año no puede ser menor a 1900' };
    }
    if (year > currentYear + 1) {
      return { valid: false, error: `El año no puede ser mayor a ${currentYear + 1}` };
    }
    return { valid: true };
  },

  // Validador de email
  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Email inválido' };
    }
    return { valid: true };
  },

  // Validador genérico de requerido
  required: (value: any): ValidationResult => {
    if (value === null || value === undefined || value === '') {
      return { valid: false, error: 'Este campo es requerido' };
    }
    return { valid: true };
  },
};

// Validadores específicos por tabla
export const tableValidators = {
  perfiles: {
    nombre: (value: string) => validators.nombre(value, 1, 15),
    descripcion: (value: string) => validators.descripcion(value, 1, 150),
  },
  marcas: {
    nombre: (value: string) => validators.nombre(value, 1, 30),
  },
  modelos: {
    nombre: (value: string) => validators.nombre(value, 1, 50),
    ano: (value: number | string) => validators.ano(value),
  },
  colores: {
    nombre: (value: string) => validators.nombre(value, 1, 30),
  },
  estados: {
    nombre: (value: string) => validators.nombre(value, 1, 20),
    descripcion: (value: string) => validators.descripcion(value, 0, 50),
  },
  'metodos-pago': {
    nombre: (value: string) => validators.nombre(value, 1, 30),
  },
  'tipos-transaccion': {
    nombre: (value: string) => validators.nombre(value, 1, 20),
    descripcion: (value: string) => validators.descripcion(value, 0, 50),
  },
};

/**
 * Valida un objeto completo contra las reglas de su tabla
 */
export function validateFormData(
  tabla: string,
  data: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {};
  const tablaValidators = tableValidators[tabla as keyof typeof tableValidators];

  if (!tablaValidators) {
    return errors;
  }

  for (const [field, validator] of Object.entries(tablaValidators)) {
    const value = data[field];
    const result = validator(value);
    if (!result.valid && result.error) {
      errors[field] = result.error;
    }
  }

  return errors;
}
