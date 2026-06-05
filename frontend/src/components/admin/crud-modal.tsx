'use client';

/**
 * Modal para crear/editar registros CRUD
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { useForm } from '@/hooks/use-form';
import { validateFormData } from '@/lib/validators';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SelectOption {
  id: number;
  nombre: string;
}

interface CRUDModalProps {
  open: boolean;
  title: string;
  fields: Array<{
    name: string;
    label: string;
    type?: 'text' | 'number' | 'email' | 'textarea' | 'select';
    required?: boolean;
    placeholder?: string;
  }>;
  initialData?: Record<string, any>;
  tabla: string;
  loading?: boolean;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export function CRUDModal({
  open,
  title,
  fields,
  initialData,
  tabla,
  loading = false,
  onSubmit,
  onClose,
}: CRUDModalProps) {
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Crear valores iniciales basados en fields
  const createEmptyValues = () => {
    return fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {});
  };

  // Usar initialData si está disponible, sino usar valores vacíos
  const getInitialValues = () => {
    return initialData || createEmptyValues();
  };

  const form = useForm({
    initialValues: getInitialValues(),
    validate: (values) => {
      return validateFormData(tabla, values);
    },
    onSubmit: async (values) => {
      await onSubmit(values);
      form.reset();
      onClose();
    },
  });

  // Cargar marcas si hay un campo select de marca
  useEffect(() => {
    if (open && tabla === 'modelos' && fields.some(f => f.name === 'brandId')) {
      loadBrands();
    }
  }, [open, tabla, fields]);

  // Actualizar los valores del formulario cuando cambia initialData o se abre el modal
  useEffect(() => {
    if (open) {
      const newInitialValues = getInitialValues();
      form.setValues(newInitialValues);
    }
  }, [initialData, open]);

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const response = await axios.get(`${API_URL}/vehicles/brands`);
      setBrandOptions(response.data.brands);
    } catch (err) {
      console.error('Error cargando marcas:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Completa los datos y haz clic en guardar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit} className="space-y-4">
          {fields.map((field) => {
            const fieldError = form.errors[field.name as keyof typeof form.errors];
            const isTouched = form.touched[field.name as keyof typeof form.touched];
            const hasError = isTouched && fieldError;

            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {field.type === 'select' ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={form.values[field.name as keyof typeof form.values] || ''}
                    onChange={(e) =>
                      form.setFieldValue(field.name, e.target.value)
                    }
                    onBlur={form.handleBlur}
                    disabled={loadingBrands}
                    className={`w-full px-3 py-2 border rounded-md text-sm bg-white
                      focus:outline-none focus:ring-2 focus:ring-primary
                      ${hasError ? 'border-red-500' : 'border-gray-300'}
                    `}
                  >
                    <option value="">-- Selecciona una marca --</option>
                    {brandOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.nombre}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <input
                      id={field.name}
                      name={field.name}
                      type="checkbox"
                      checked={form.values[field.name as keyof typeof form.values] === true || form.values[field.name as keyof typeof form.values] === 'S'}
                      onChange={(e) =>
                        form.setFieldValue(field.name, e.target.checked)
                      }
                      onBlur={form.handleBlur}
                      className={`w-4 h-4 border rounded focus:outline-none focus:ring-2 focus:ring-primary
                        ${hasError ? 'border-red-500' : 'border-gray-300'}
                      `}
                    />
                    <label htmlFor={field.name} className="text-sm font-medium cursor-pointer">
                      {field.label}
                    </label>
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={form.values[field.name as keyof typeof form.values] || ''}
                    onChange={(e) =>
                      form.setFieldValue(field.name, e.target.value)
                    }
                    onBlur={form.handleBlur}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md text-sm 
                      focus:outline-none focus:ring-2 focus:ring-primary
                      ${hasError ? 'border-red-500' : 'border-gray-300'}
                    `}
                  />
                ) : (
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type || 'text'}
                    value={form.values[field.name as keyof typeof form.values] || ''}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    placeholder={field.placeholder}
                    className={hasError ? 'border-red-500' : ''}
                  />
                )}

                {hasError && (
                  <div className="flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {fieldError}
                  </div>
                )}
              </div>
            );
          })}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading || loadingBrands}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingBrands}>
              {(loading || loadingBrands) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
