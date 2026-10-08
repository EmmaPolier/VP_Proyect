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
  private timeout = 15000;

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const currentUserStr = window.localStorage.getItem('currentUser')
      if (currentUserStr) {
        const parsed = JSON.parse(currentUserStr)
        if (parsed?.token) {
          return parsed.token
        }
      }

      const authToken = window.localStorage.getItem('authToken')
      if (authToken) {
        return authToken
      }

      return null
    } catch {
      return null
    }
  }

  async fetch<T>(
    url: string,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    const { timeout = this.timeout, ...fetchOptions } = options || {}

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const token = this.getAuthToken()

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...fetchOptions?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Partial<Record<'message' | 'error', string>>;
        const backendMessage = typeof errorData.message === 'string'
          ? errorData.message
          : typeof errorData.error === 'string'
            ? errorData.error
            : `HTTP Error: ${response.status}`;
        throw new Error(backendMessage);
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`La solicitud a ${url} excedió el tiempo límite de ${timeout} ms.`);
      }
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

  async post<T>(url: string, body?: unknown) {
    return this.fetch<T>(url, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(url: string, body?: unknown) {
    return this.fetch<T>(url, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(url: string, body?: unknown) {
    return this.fetch<T>(url, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(url: string) {
    return this.fetch<T>(url, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
