'use client';

/**
 * Componente DataTable reutilizable con paginación y acciones
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: number }>({
  columns,
  data,
  loading = false,
  page = 1,
  pageSize = 10,
  total = 0,
  totalPages = 0,
  onEdit,
  onDelete,
  onPageChange,
  emptyMessage = 'No hay datos disponibles',
}: DataTableProps<T>) {
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} style={{ width: col.width }}>
                  {col.header}
                </TableHead>
              ))}
              {(onEdit || onDelete) && (
                <TableHead className="w-24">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Cargando...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx}>
                      {col.render
                        ? col.render(row[col.accessor], row)
                        : String(row[col.accessor] || '-')}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell>
                      <div className="flex gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(row)}
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(row)}
                            title="Eliminar"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border">
          <div className="text-sm text-muted-foreground">
            {data.length > 0 ? (
              <>
                Mostrando <strong>{startIndex}</strong> a <strong>{endIndex}</strong> de{' '}
                <strong>{total}</strong> registros
              </>
            ) : (
              'Sin registros'
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange?.(p)}
                    disabled={loading}
                  >
                    {p}
                  </Button>
                );
              })}
              {totalPages > 5 && <span className="text-sm">...</span>}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages || loading}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
