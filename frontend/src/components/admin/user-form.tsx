'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { validators } from '@/lib/validators';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  perfiles: { id: number; nombre: string }[];
  estados: { id: number; nombre: string }[];
  isLoading?: boolean;
}

export function UserForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  perfiles,
  estados,
  isLoading = false,
}: UserFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    contraseña: '',
    idEstado: '',
    perfiles: [] as number[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        email: initialData.email || '',
        telefono: initialData.telefono || '',
        contraseña: '',
        idEstado: initialData.idEstado || '',
        perfiles: initialData.perfiles?.map((p: any) => p.id) || [],
      });
    } else {
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        contraseña: '',
        idEstado: '',
        perfiles: [],
      });
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen]);

  const validateField = (name: string, value: any) => {
    switch (name) {
      case 'nombre':
        if (!value || value.trim().length === 0) return 'El nombre es requerido';
        if (value.length < 1 || value.length > 50) return 'El nombre debe tener entre 1 y 50 caracteres';
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'El email no es válido';
        break;
      case 'telefono':
        if (value && (value.length < 7 || value.length > 15)) {
          return 'El teléfono debe tener entre 7 y 15 caracteres';
        }
        break;
      case 'contraseña':
        if (!this.initialData && !value) {
          return 'La contraseña es requerida';
        }
        if (value && value.length < 8) {
          return 'La contraseña debe tener mínimo 8 caracteres';
        }
        break;
      case 'idEstado':
        if (!value) {
          return 'El estado es requerido';
        }
        break;
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePerfilToggle = (perfilId: number) => {
    setFormData(prev => ({
      ...prev,
      perfiles: prev.perfiles.includes(perfilId)
        ? prev.perfiles.filter(p => p !== perfilId)
        : [...prev.perfiles, perfilId],
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'perfiles') {
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Actualiza los datos del usuario' : 'Ingresa los datos del nuevo usuario'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ingresa el nombre"
                disabled={isLoading}
              />
              {errors.nombre && touched.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="usuario@ejemplo.com"
                disabled={isLoading}
              />
              {errors.email && touched.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+1 234 567 8900"
                disabled={isLoading}
              />
              {errors.telefono && touched.telefono && (
                <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
              )}
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="idEstado">Estado *</Label>
              <Select value={formData.idEstado} onValueChange={(value) => handleSelectChange('idEstado', value)}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map(estado => (
                    <SelectItem key={estado.id} value={String(estado.id)}>
                      {estado.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.idEstado && <p className="text-red-500 text-sm mt-1">{errors.idEstado}</p>}
            </div>

            {/* Contraseña */}
            {!initialData && (
              <div className="col-span-2">
                <Label htmlFor="contraseña">Contraseña *</Label>
                <Input
                  id="contraseña"
                  name="contraseña"
                  type="password"
                  value={formData.contraseña}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Mín. 8 caracteres (mayús, minús, números)"
                  disabled={isLoading}
                />
                {errors.contraseña && touched.contraseña && (
                  <p className="text-red-500 text-sm mt-1">{errors.contraseña}</p>
                )}
              </div>
            )}
          </div>

          {/* Perfiles/Roles */}
          <div>
            <Label>Roles/Perfiles</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {perfiles.map(perfil => (
                <div key={perfil.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`perfil-${perfil.id}`}
                    checked={formData.perfiles.includes(perfil.id)}
                    onChange={() => handlePerfilToggle(perfil.id)}
                    disabled={isLoading}
                    className="rounded"
                  />
                  <Label htmlFor={`perfil-${perfil.id}`} className="font-normal cursor-pointer">
                    {perfil.nombre}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
