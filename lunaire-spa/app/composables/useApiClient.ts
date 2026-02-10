/**
 * Centralized API Client with Error Handling
 *
 * Provides consistent error handling, loading states, and toast notifications
 * for all API calls in the application.
 */

import type { ToastType } from "~/stores/toast";
import { useToastStore } from "~/stores/toast";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiRequestOptions {
  /** Show toast on error (default: true) */
  showErrorToast?: boolean;
  /** Show toast on success */
  showSuccessToast?: boolean;
  /** Success message to show */
  successMessage?: string;
  /** Custom error message (overrides API error) */
  errorMessage?: string;
  /** Retry failed requests (default: false) */
  retry?: boolean;
  /** Number of retry attempts (default: 3) */
  retryAttempts?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Silent mode - no toasts at all */
  silent?: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
  ok: boolean;
}

const DEFAULT_OPTIONS: Required<ApiRequestOptions> = {
  showErrorToast: true,
  showSuccessToast: false,
  successMessage: "Success!",
  errorMessage: "",
  retry: false,
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000,
  silent: false,
};

/**
 * Get the base URL for API requests
 */
function getBaseUrl(): string {
  const config = useRuntimeConfig();
  return (config.public.apiBase as string) || "http://localhost:5001/api";
}

/**
 * Parse error from response
 */
async function parseError(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();
    return {
      message:
        data.error ||
        data.message ||
        `Request failed with status ${response.status}`,
      status: response.status,
      code: data.code,
      details: data.details,
    };
  } catch {
    return {
      message: `Request failed with status ${response.status}`,
      status: response.status,
    };
  }
}

/**
 * Create a timeout promise
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), ms);
  });
}

/**
 * Delay for retry
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Use the centralized API client
 */
export function useApiClient() {
  const toastStore = useToastStore();
  const baseUrl = getBaseUrl();

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: ToastType = "info") => {
    toastStore.show(message, type);
  };

  /**
   * Make an API request with error handling
   */
  async function request<T>(
    endpoint: string,
    init?: RequestInit,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${baseUrl}${endpoint}`;

    let lastError: ApiError | null = null;
    let attempts = opts.retry ? opts.retryAttempts : 1;

    while (attempts > 0) {
      attempts--;

      try {
        const fetchPromise = fetch(url, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...init?.headers,
          },
        });

        const response = await Promise.race([
          fetchPromise,
          createTimeout(opts.timeout),
        ]);

        if (!response.ok) {
          lastError = await parseError(response);

          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            break;
          }

          // Retry server errors (5xx) if retries remaining
          if (attempts > 0 && opts.retry) {
            await delay(opts.retryDelay);
            continue;
          }

          break;
        }

        // Parse successful response
        const data = (await response.json()) as T;

        // Show success toast if requested
        if (!opts.silent && opts.showSuccessToast && opts.successMessage) {
          showToast(opts.successMessage, "success");
        }

        return {
          data,
          error: null,
          status: response.status,
          ok: true,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        lastError = {
          message:
            message === "Request timeout"
              ? "Request timed out"
              : "Network error - please check your connection",
          code: message === "Request timeout" ? "TIMEOUT" : "NETWORK_ERROR",
        };

        // Retry on network errors if retries remaining
        if (attempts > 0 && opts.retry) {
          await delay(opts.retryDelay);
          continue;
        }
      }
    }

    // Show error toast
    if (!opts.silent && opts.showErrorToast && lastError) {
      const errorMsg = opts.errorMessage || lastError.message;
      showToast(errorMsg, "error");
    }

    return {
      data: null,
      error: lastError,
      status: lastError?.status || 0,
      ok: false,
    };
  }

  /**
   * GET request
   */
  async function get<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: "GET" }, options);
  }

  /**
   * POST request
   */
  async function post<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>(
      endpoint,
      {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      },
      options,
    );
  }

  /**
   * PUT request
   */
  async function put<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>(
      endpoint,
      {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      },
      options,
    );
  }

  /**
   * DELETE request
   */
  async function del<T>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: "DELETE" }, options);
  }

  /**
   * PATCH request
   */
  async function patch<T>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return request<T>(
      endpoint,
      {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      },
      options,
    );
  }

  return {
    request,
    get,
    post,
    put,
    delete: del,
    patch,
    showToast,
    baseUrl,
  };
}

// Export type for use in other modules
export type ApiClient = ReturnType<typeof useApiClient>;
