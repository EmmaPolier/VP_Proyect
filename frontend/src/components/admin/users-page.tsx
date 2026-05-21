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
import { Plus, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { useCrud } from '@/hooks/use-crud';
import { DataTable, DataTableColumn } from '@/components/admin/data-table';
import { UserForm } from '@/components/admin/user-form';
import { API_ENDPOINTS } from '@/lib/api-constants';

export function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [estados, setEstados] = useState<any[]>([]);

  const {
    items: usuarios,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    fetchItems,
    page,
    setPage,
    totalPages,
  } = useCrud(API_ENDPOINTS.USUARIOS);

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        // Cargar perfiles
        const perfilesRes = await fetch(`${API_ENDPOINTS.PERFILES}?pageSize=100`);
        if (perfilesRes.ok) {
          const data = await perfilesRes.json();
          setPerfiles(data.data || []);
        }

        // Cargar estados
        const estadosRes = await fetch(`${API_ENDPOINTS.ESTADOS('usuario')}?pageSize=100`);
        if (estadosRes.ok) {
          const data = await estadosRes.json();
          setEstados(data.data || []);
        }
      } catch (error) {
        console.error('Error loading catalogs:', error);
      }
    };

    loadCatalogs();
  }, []);

  const handleCreate = async (formData: any) => {
    await createItem({
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      contraseña: formData.contraseña,
      idEstado: parseInt(formData.idEstado),
      perfiles: formData.perfiles,
    });
    setShowForm(false);
  };

  const handleUpdate = async (formData: any) => {
    if (!selectedUser) return;
    await updateItem(selectedUser.id, {
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      idEstado: parseInt(formData.idEstado),
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

  const columns: DataTableColumn[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'idEstado', label: 'Estado' },
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
            <p className="text-red-700 text-sm">{error}</p>
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
        currentPage={page}
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
