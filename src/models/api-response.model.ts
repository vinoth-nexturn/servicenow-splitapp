export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta: PaginationMeta | null;
  errors: ApiError[] | null;
  timestamp: string;
  requestId: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  offset?: number;
  limit?: number;
}

export interface ApiError {
  code: ErrorCode;
  field?: string;
  message: string;
  details?: Record<string, any>;
  suggestion?: string;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'BUSINESS_RULE_VIOLATION'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST'
  | 'DUPLICATE_ENTRY'
  | 'INVALID_STATE'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RESOURCE_LOCKED';

export interface QueryParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  errors: ApiError[];
  meta: null;
  timestamp: string;
  requestId: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  errors: null;
  meta: PaginationMeta | null;
  timestamp: string;
  requestId: string;
}

export interface BatchOperationResponse {
  successful: number;
  failed: number;
  total: number;
  errors: Array<{ id: string; error: ApiError }>;
}
