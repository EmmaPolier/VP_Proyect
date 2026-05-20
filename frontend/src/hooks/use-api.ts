'use client';

/**
 * Hook para llamadas HTTP genéricas a la API
 */

import { useEffect, useState } from 'react';
import { apiClient, ApiResponse } from '@/lib/api-client';

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  url: string | null,
  options?: UseApiOptions
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (): Promise<T | null> => {
    if (!url) {
      setError(new Error('URL es requerida'));
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      let response: ApiResponse<T>;

      switch (options?.method) {
        case 'POST':
          response = await apiClient.post<T>(url, options?.body);
          break;
        case 'PUT':
          response = await apiClient.put<T>(url, options?.body);
          break;
        case 'DELETE':
          response = await apiClient.delete<T>(url);
          break;
        default:
          response = await apiClient.get<T>(url);
      }

      if (!response.success) {
        throw new Error(response.message || 'Error en la API');
      }

      const result = response.data || null;
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      setError(error);
      options?.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (options?.immediate !== false && url) {
      execute();
    }
  }, [url]);

  return { data, loading, error, execute, reset };
}
