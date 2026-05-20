/**
 * Cliente HTTP para comunicación con API Backend
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

class ApiClient {
  private timeout = 5000;

  async fetch<T>(
    url: string,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    const { timeout = this.timeout, ...fetchOptions } = options || {};

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP Error: ${response.status}`
        );
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error instanceof Error
        ? error
        : new Error('Unknown error occurred');
    }
  }

  async get<T>(url: string, params?: Record<string, string | number>) {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';

    return this.fetch<T>(`${url}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(url: string, body: any) {
    return this.fetch<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(url: string, body: any) {
    return this.fetch<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(url: string) {
    return this.fetch<T>(url, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
