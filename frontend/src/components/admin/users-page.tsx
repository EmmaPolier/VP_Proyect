'use client';

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
import { UserForm } from '@/components/admin/user-form';
import { API_ENDPOINTS } from '@/lib/api-constants';

interface UserRecord extends Record<string, unknown> {
  id: string | number;
  nombre?: string;
  email?: string;
  telefono?: string;
  idEstado?: number;
  contraseña?: string;
  perfiles?: number[];
  documento?: string;
  idPerfil?: number;
}

interface CatalogOption {
  id: number;
  nombre: string;
}

export function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserRecord | null>(null);
  const [perfiles, setPerfiles] = useState<CatalogOption[]>([]);
  const [estados, setEstados] = useState<CatalogOption[]>([]);

  const {
    items: usuarios,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    page,
    setPage,
    totalPages,
  } = useCrud<UserRecord>(API_ENDPOINTS.USUARIOS);

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        // Cargar perfiles
        const perfilesRes = await fetch(`${API_ENDPOINTS.PERFILES}?pageSize=100`);
        if (perfilesRes.ok) {
          const data = await perfilesRes.json() as { data?: CatalogOption[] };
          setPerfiles(data.data || []);
        }

        // Cargar estados
        const estadosRes = await fetch(`${API_ENDPOINTS.ESTADOS('usuario')}?pageSize=100`);
        if (estadosRes.ok) {
          const data = await estadosRes.json() as { data?: CatalogOption[] };
          setEstados(data.data || []);
        }
      } catch (error) {
        console.error('Error loading catalogs:', error);
      }
    };

    loadCatalogs();
  }, []);

  const handleCreate = async (formData: {
    nombre: string;
    email: string;
    telefono: string;
    contraseña: string;
    idEstado: string | number;
    perfiles: number[];
  }) => {
    await createItem({
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      contraseña: formData.contraseña,
      idEstado: Number(formData.idEstado),
      perfiles: formData.perfiles,
    });
    setShowForm(false);
  };

  const handleUpdate = async (formData: {
    nombre: string;
    email: string;
    telefono: string;
    contraseña: string;
    idEstado: string | number;
    perfiles: number[];
  }) => {
    if (!selectedUser) return;
    await updateItem(selectedUser.id, {
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      idEstado: Number(formData.idEstado),
      perfiles: formData.perfiles,
    });
    setSelectedUser(null);
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteItem(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const columns: DataTableColumn<UserRecord>[] = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Email', accessor: 'email' },
    { header: 'Teléfono', accessor: 'telefono' },
    { header: 'Estado', accessor: 'idEstado' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">👥 Gestión de Usuarios</h1>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setShowForm(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error.message}</p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={usuarios}
        loading={loading}
        onEdit={(user) => {
          setSelectedUser(user);
          setShowForm(true);
        }}
        onDelete={(user) => setDeleteConfirm(user)}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* User Form Modal */}
      <UserForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedUser(null);
        }}
        onSubmit={selectedUser ? handleUpdate : handleCreate}
        initialData={selectedUser}
        perfiles={perfiles}
        estados={estados}
        isLoading={loading}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a {deleteConfirm?.nombre}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            Eliminar
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
