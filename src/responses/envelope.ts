export interface SuccessEnvelope<T> {
  data: T;
  message: string;
  errors: null;
}

export interface ErrorEnvelope {
  data: null;
  message: string;
  errors: Record<string, string[]> | null;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedEnvelope<T> {
  data: T[];
  meta: PaginationMeta;
  message: string;
  errors: null;
}

export function formatSuccess<T>(data: T, message = "Operation successful."): SuccessEnvelope<T> {
  return {
    data,
    message,
    errors: null,
  };
}

export function formatError(
  message = "An error occurred.",
  errors: Record<string, string[]> | null = null
): ErrorEnvelope {
  return {
    data: null,
    message,
    errors,
  };
}

export function formatPaginated<T>(
  data: T[],
  meta: { currentPage: number; lastPage: number; perPage: number; total: number },
  message = "Operation successful."
): PaginatedEnvelope<T> {
  return {
    data,
    meta: {
      current_page: meta.currentPage,
      last_page: meta.lastPage,
      per_page: meta.perPage,
      total: meta.total,
    },
    message,
    errors: null,
  };
}
