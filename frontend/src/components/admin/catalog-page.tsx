'use client';

/**
 * Plantilla genérica de página para catálogos
 * Se usa para Perfiles, Marcas, Modelos, Colores, Estados, Métodos de Pago, Tipos de Transacción
 */

import React, { useState, useEffect } from 'react';
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
import { CATALOG_CONFIG } from '@/lib/api-constants';

interface CatalogPageProps {
  tabla: string;
}

export function CatalogPage({ tabla }: CatalogPageProps) {
  const config = CATALOG_CONFIG[tabla as keyof typeof CATALOG_CONFIG];

  if (!config) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">Catálogo no encontrado: {tabla}</p>
      </div>
    );
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);

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
  } = useCrud(config.endpoint, {
    pageSize: 10,
    onSuccess: (msg) => {
      // Toast notification aquí (implementar después)
      console.log(msg);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  // Cargar datos al montar
  useEffect(() => {
    fetchItems(1);
  }, []);

  // Definir columnas dinámicamente
  const columns: DataTableColumn<any>[] = config.fields.map((field) => ({
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
    if (selectedItem?.id) {
      await updateItem(selectedItem.id, data);
    } else {
      await createItem(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm?.id) {
      await deleteItem(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-3xl">{config.icon}</span>
            {config.label}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los registros de {config.label.toLowerCase()}
          </p>
        </div>

        <Button onClick={handleCreateClick} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
        fields={config.fields.map((field) => ({
          name: field,
          label: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
          type:
            field === 'ano'
              ? 'number'
              : field.includes('descripcion')
                ? 'textarea'
                : 'text',
          required: !field.includes('descripcion'),
        }))}
        initialData={selectedItem}
        tabla={tabla}
        loading={loading}
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
