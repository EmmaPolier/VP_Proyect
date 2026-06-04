'use client';

/**
 * Hook para manejo de formularios con validación
 */

import { useState, useCallback } from 'react';

export interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Record<keyof T, string>;
  onSubmit: (values: T) => void | Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  loading: boolean;
  
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setValues: (values: T) => void;
  reset: () => void;
  validateField: (field: keyof T) => string;
}

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const [values, setValues] = useState<T>(options.initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [loading, setLoading] = useState(false);

  const validateField = useCallback(
    (field: keyof T): string => {
      if (!options.validate) return '';
      
      const validationErrors = options.validate(values);
      return validationErrors[field] || '';
    },
    [values, options]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      
      let newValue: any = value;
      if (type === 'number') {
        newValue = value === '' ? '' : Number(value);
      }

      setValues(prev => ({
        ...prev,
        [name]: newValue,
      }));

      // Validar en tiempo real si el campo fue tocado
      if (touched[name as keyof T]) {
        const error = options.validate?.({
          ...values,
          [name]: newValue,
        })?.[name as keyof T] || '';
        
        setErrors(prev => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [values, touched, options]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      
      setTouched(prev => ({
        ...prev,
        [name]: true,
      }));

      const error = validateField(name as keyof T);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validar todos los campos
      const newErrors = options.validate?.(values) || {};
      setErrors(newErrors as Record<keyof T, string>);

      // Marcar todos como tocados
      const newTouched = Object.keys(values).reduce(
        (acc, key) => ({
          ...acc,
          [key]: true,
        }),
        {} as Record<keyof T, boolean>
      );
      setTouched(newTouched);

      if (Object.values(newErrors).some(error => error)) {
        return;
      }

      setLoading(true);
      try {
        await options.onSubmit(values);
      } finally {
        setLoading(false);
      }
    },
    [values, options]
  );

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const setValuesMethod = useCallback((newValues: T) => {
    setValues(newValues);
    setErrors({} as Record<keyof T, string>);
    setTouched({} as Record<keyof T, boolean>);
  }, []);

  const reset = useCallback(() => {
    setValues(options.initialValues);
    setErrors({} as Record<keyof T, string>);
    setTouched({} as Record<keyof T, boolean>);
    setLoading(false);
  }, [options.initialValues]);

  return {
    values,
    errors,
    touched,
    loading,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setValues: setValuesMethod,
    reset,
    validateField,
  };
}
