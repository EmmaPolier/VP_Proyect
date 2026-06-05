'use client';

/**
 * Plantilla genérica de página para catálogos
 * Se usa para Perfiles, Marcas, Modelos, Colores, Estados, Métodos de Pago, Tipos de Transacción
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/dialog';
import { Plus, AlertTriangle } from 'lucide-react';
import { useCrud } from '@/hooks/use-crud';
import { DataTable, DataTableColumn } from '@/components/admin/data-table';
import { CRUDModal } from '@/components/admin/crud-modal';
import { CATALOG_CONFIG, ESTADO_TIPOS } from '@/lib/api-constants';
import { apiClient } from '@/lib/api-client';

interface CatalogPageProps {
  tabla: string;
}

export function CatalogPage({ tabla }: CatalogPageProps) {
  const config = CATALOG_CONFIG[tabla as keyof typeof CATALOG_CONFIG] as {
    label: string;
    icon: string;
    endpoint: string | ((tipo: string) => string);
    fields: string[];
    formFields?: string[];
    fieldTypes?: Record<string, string>;
    requiredFields?: string[];
    tipoOptions?: Array<{ label: string; value: string }>;
    defaultTipo?: string;
  };

  if (!config) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Catálogo no encontrado: {tabla}</p>
      </div>
    );
  }

  const isEstadoCatalog = tabla === 'estados' && Array.isArray(config.tipoOptions);
  const [selectedTipo, setSelectedTipo] = useState(
    isEstadoCatalog ? config.defaultTipo || ESTADO_TIPOS.USUARIO : ''
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);

  const endpoint = isEstadoCatalog
    ? (config.endpoint as (tipo: string) => string)(selectedTipo)
    : (config.endpoint as string);

  const crudOptions = useMemo(
    () => ({
      pageSize: 10,
      onSuccess: (msg: string) => {
        // Toast notification aquí (implementar después)
        console.log(msg);
      },
      onError: (err: Error) => {
        console.error(err);
      },
    }),
    []
  );

  const {
    items,
    loading,
    error,
    page,
    pageSize,
    totalPages,
    total,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    setPage,
  } = useCrud(endpoint, crudOptions);

  // Cargar datos al montar y cuando cambie el tipo de estado
  useEffect(() => {
    fetchItems(1);
  }, [fetchItems, selectedTipo]);

  const visibleFields = config.fields.filter((field) => {
    if (!isEstadoCatalog) {
      return true;
    }

    if (field === 'descripcion' && selectedTipo !== ESTADO_TIPOS.USUARIO) {
      return false;
    }

    return true;
  });

  const formFields = (config.formFields ?? config.fields).filter((field) => {
    if (!isEstadoCatalog) {
      return true;
    }

    if (field === 'descripcion' && selectedTipo !== ESTADO_TIPOS.USUARIO) {
      return false;
    }

    return true;
  });

  // Definir columnas dinámicamente
  const columns: DataTableColumn<any>[] = visibleFields.map((field) => ({
    header:
      field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
    accessor: field,
    render: (value) => value || '-',
  }));

  const handleCreateClick = () => {
    setSelectedItem(null);
    setModalOpen(true);
  };

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleDeleteClick = (item: any) => {
    setDeleteConfirm(item);
  };

  const handleModalSubmit = async (data: any) => {
    try {
      // Limpiar datos vacíos
      let cleanedData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== '' && value !== undefined)
      );

      // Convertir tipos según la configuración
      const fieldTypes = config.fieldTypes || {};
      cleanedData = Object.fromEntries(
        Object.entries(cleanedData).map(([key, value]) => {
          if (fieldTypes[key] === 'number' && value !== null && value !== undefined) {
            return [key, Number(value)];
          }
          if (fieldTypes[key] === 'checkbox') {
            return [key, value === true || value === 'true' || value === 'S'];
          }
          return [key, value];
        })
      );

      console.log('[DEBUG] Datos a enviar:', cleanedData);

      // Manejo especial para permisos (tabla con dos IDs)
      if (tabla === 'permisos' && selectedItem?.id) {
        // El ID es formato "idMenu_idPerfil", extraer ambos
        const [idMenu, idPerfilOriginal] = selectedItem.id.split('_').map(Number);
        
        console.log('[DEBUG] Actualizando permiso:', { 
          idMenu, 
          idPerfilOriginal,
          idPerfilNuevo: cleanedData.idPerfil,
          cleanedData 
        });

        // Si el usuario cambió el perfil, enviarlo como newIdPerfil
        if (cleanedData.idPerfil && Number(cleanedData.idPerfil) !== idPerfilOriginal) {
          cleanedData.newIdPerfil = cleanedData.idPerfil;
        }

        // Remover idPerfil de cleanedData ya que va en la URL
        delete cleanedData.idPerfil;
        delete cleanedData.idMenu;

        const response = await apiClient.put(`${endpoint}/${idMenu}/${idPerfilOriginal}`, cleanedData);
        console.log('[DEBUG] Respuesta de actualización:', response);
        if (response.success) {
          setModalOpen(false);
          setPage(1);
          await fetchItems(1);
        }
        return;
      }

      if (selectedItem?.id) {
        await updateItem(selectedItem.id, cleanedData);
      } else {
        await createItem(cleanedData);
      }
    } catch (err) {
      console.error('[ERROR] Error en handleModalSubmit:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm?.id) {
      // Manejo especial para permisos (tabla con dos IDs)
      if (tabla === 'permisos') {
        const [idMenu, idPerfil] = deleteConfirm.id.split('_').map(Number);
        const response = await apiClient.delete(`${endpoint}/${idMenu}/${idPerfil}`);
        if (response.success) {
          setDeleteConfirm(null);
          setPage(1);
          await fetchItems(1);
        }
      } else {
        await deleteItem(deleteConfirm.id);
        setDeleteConfirm(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-3xl">{config.icon}</span>
            {config.label}
            {isEstadoCatalog && selectedTipo ? ` - ${config.tipoOptions!.find((option) => option.value === selectedTipo)?.label}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los registros de {config.label.toLowerCase()}
            {isEstadoCatalog && selectedTipo ? ` del tipo ${config.tipoOptions!.find((option) => option.value === selectedTipo)?.label.toLowerCase()}` : ''}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isEstadoCatalog && (
            <div className="flex items-center gap-2">
              <label htmlFor="estadoTipo" className="text-sm font-medium">
                Tipo de estado:
              </label>
              <select
                id="estadoTipo"
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {config.tipoOptions!.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button onClick={handleCreateClick} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onPageChange={setPage}
        emptyMessage={`No hay ${config.label.toLowerCase()} registrados`}
      />

      {/* CRUD Modal */}
      <CRUDModal
        open={modalOpen}
        title={selectedItem ? `Editar ${config.label}` : `Nuevo ${config.label}`}
        initialData={selectedItem}
          fields={formFields.map((field) => {
            const type = config.fieldTypes?.[field] ??
              (field === 'ano' ? 'number' :
                field.includes('descripcion') ? 'textarea' :
                  field === 'email' ? 'email' :
                    field.includes('fecha') ? 'date' :
                      field === 'contrasena' ? 'password' :
                        'text');

            const required = config.requiredFields
              ? config.requiredFields.includes(field)
              : !field.includes('descripcion');

            return {
              name: field,
              label: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
              type: type as 'text' | 'number' | 'email' | 'textarea' | 'select' | 'checkbox' | 'date' | 'password',
              required,
              placeholder: field.includes('descripcion') ? 'Opcional' : undefined,
            };
          })}
        tabla={tabla}
        onSubmit={handleModalSubmit}
        onClose={() => setModalOpen(false)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas
              eliminar este registro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialog
            defaultOpen={false}
            onOpenChange={(open) => {
              if (!open) setDeleteConfirm(null);
            }}
          >
            <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialog>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
