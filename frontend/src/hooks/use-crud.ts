'use client';

/**
 * Hook para operaciones CRUD genéricas
 */

import { useState, useCallback } from 'react';
import { apiClient, PaginatedResponse } from '@/lib/api-client';
import { PAGE_SIZE } from '@/lib/api-constants';

export interface CrudOptions {
  pageSize?: number;
  onSuccess?: (message: string) => void;
  onError?: (error: Error) => void;
}

interface UseCrudReturn<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // Acciones
  fetchItems: (page?: number) => Promise<void>;
  createItem: (data: Omit<T, 'id'>) => Promise<T | null>;
  updateItem: (id: number, data: Partial<T>) => Promise<T | null>;
  deleteItem: (id: number) => Promise<boolean>;
  setPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useCrud<T extends { id?: number }>(
  endpoint: string,
  options?: CrudOptions
): UseCrudReturn<T> {
  const pageSize = options?.pageSize || PAGE_SIZE;
  
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPageState] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const calculatePagination = (total: number) => {
    const pages = Math.ceil(total / pageSize);
    return {
      totalPages: pages,
      hasNextPage: page < pages,
      hasPreviousPage: page > 1,
    };
  };

  const fetchItems = useCallback(
    async (pageNum: number = 1) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<T[]>(endpoint, {
          page: pageNum,
          pageSize,
        });

        if (!response.success) {
          throw new Error(response.message || 'Error al cargar datos');
        }

        const paginatedRes = response as PaginatedResponse<T[]>;
        const data = Array.isArray(response.data) ? response.data : [];
        
        setItems(data);
        setPageState(pageNum);

        if (paginatedRes.pagination) {
          setTotal(paginatedRes.pagination.total);
          setTotalPages(paginatedRes.pagination.totalPages);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        setError(error);
        options?.onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, pageSize, options]
  );

  const createItem = useCallback(
    async (data: Omit<T, 'id'>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<T>(endpoint, data);

        if (!response.success) {
          throw new Error(response.message || 'Error al crear');
        }

        options?.onSuccess?.(response.message || 'Creado exitosamente');
        await fetchItems(1);
        return response.data || null;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        setError(error);
        options?.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, fetchItems, options]
  );

  const updateItem = useCallback(
    async (id: number, data: Partial<T>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.put<T>(`${endpoint}/${id}`, data);

        if (!response.success) {
          throw new Error(response.message || 'Error al actualizar');
        }

        options?.onSuccess?.(response.message || 'Actualizado exitosamente');
        await fetchItems(page);
        return response.data || null;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        setError(error);
        options?.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, fetchItems, page, options]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.delete(`${endpoint}/${id}`);

        if (!response.success) {
          throw new Error(response.message || 'Error al eliminar');
        }

        options?.onSuccess?.(response.message || 'Eliminado exitosamente');
        
        // Si es el último item y no estamos en página 1, ir a página anterior
        if (items.length === 1 && page > 1) {
          await fetchItems(page - 1);
        } else {
          await fetchItems(page);
        }
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        setError(error);
        options?.onError?.(error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, fetchItems, page, items.length, options]
  );

  const setPage = useCallback(
    async (newPage: number) => {
      if (newPage > 0 && newPage <= totalPages) {
        await fetchItems(newPage);
      }
    },
    [fetchItems, totalPages]
  );

  const refresh = useCallback(() => fetchItems(page), [fetchItems, page]);

  const reset = () => {
    setItems([]);
    setLoading(false);
    setError(null);
    setPageState(1);
    setTotal(0);
    setTotalPages(0);
  };

  const pagination = calculatePagination(total);

  return {
    items,
    loading,
    error,
    total,
    page,
    pageSize,
    totalPages: pagination.totalPages,
    hasNextPage: pagination.hasNextPage,
    hasPreviousPage: pagination.hasPreviousPage,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    setPage,
    refresh,
    reset,
  };
}
