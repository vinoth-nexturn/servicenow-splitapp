/**
 * Centralized Error Handling & Transformation
 * 
 * Enterprise Pattern: Error Strategy + Error Boundary
 * 
 * Provides:
 * - Consistent error types (NetworkError, ValidationError, NotFoundError, etc.)
 * - Error transformation (API errors → Domain errors)
 * - Error context and logging
 * - User-friendly error messages
 * - Error recovery strategies
 */

import { Logger } from './infrastructure';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Standard error codes for all operations
 */
export enum ErrorCode {
  // Network & API
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Business Logic
  BUSINESS_RULE_VIOLATED = 'BUSINESS_RULE_VIOLATED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // State & Context
  STATE_ERROR = 'STATE_ERROR',
  CONTEXT_NOT_FOUND = 'CONTEXT_NOT_FOUND',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public severity: ErrorSeverity = ErrorSeverity.ERROR,
    public context?: Record<string, any>,
    public originalError?: Error | unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  /**
   * Convert to plain object for logging/transmission
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Get user-friendly message (no technical details)
   */
  getUserMessage(): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection.',
      [ErrorCode.TIMEOUT]: 'Request timed out. Please try again.',
      [ErrorCode.BAD_REQUEST]: 'Invalid request. Please check your input.',
      [ErrorCode.UNAUTHORIZED]:
        'Authentication required. Please log in again.',
      [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
      [ErrorCode.NOT_FOUND]: 'The requested item was not found.',
      [ErrorCode.CONFLICT]:
        'The operation conflicts with existing data. Please refresh and try again.',
      [ErrorCode.SERVER_ERROR]:
        'Server error occurred. Please try again later.',
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorCode.INVALID_INPUT]: 'One or more fields have invalid values.',
      [ErrorCode.BUSINESS_RULE_VIOLATED]:
        'This operation violates business rules.',
      [ErrorCode.INSUFFICIENT_BALANCE]: 'Insufficient balance for this operation.',
      [ErrorCode.DUPLICATE_ENTRY]: 'This entry already exists.',
      [ErrorCode.STATE_ERROR]: 'Application state error occurred.',
      [ErrorCode.CONTEXT_NOT_FOUND]: 'Required context not found.',
      [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred.',
    };

    return messages[this.code] || this.message;
  }
}

/**
 * Network error (HTTP, timeout, connectivity)
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    public statusCode?: number,
    originalError?: Error | unknown
  ) {
    super(
      ErrorCode.NETWORK_ERROR,
      message,
      ErrorSeverity.ERROR,
      { statusCode },
      originalError
    );
    this.name = 'NetworkError';
  }
}

/**
 * Validation error (business rule violations)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public violations?: string[],
    originalError?: Error | unknown
  ) {
    super(
      ErrorCode.VALIDATION_ERROR,
      message,
      ErrorSeverity.WARNING,
      { violations },
      originalError
    );
    this.name = 'ValidationError';
  }
}

/**
 * Not found error (resource doesn't exist)
 */
export class NotFoundError extends AppError {
  constructor(
    public resourceType: string,
    public resourceId: string,
    originalError?: Error | unknown
  ) {
    super(
      ErrorCode.NOT_FOUND,
      `${resourceType} not found: ${resourceId}`,
      ErrorSeverity.WARNING,
      { resourceType, resourceId },
      originalError
    );
    this.name = 'NotFoundError';
  }
}

/**
 * Business rule error (insufficient balance, conflicts, etc.)
 */
export class BusinessRuleError extends AppError {
  constructor(
    message: string,
    public ruleCode?: string,
    originalError?: Error | unknown
  ) {
    super(
      ErrorCode.BUSINESS_RULE_VIOLATED,
      message,
      ErrorSeverity.WARNING,
      { ruleCode },
      originalError
    );
    this.name = 'BusinessRuleError';
  }
}

/**
 * Unauthorized error (auth/permission issues)
 */
export class AuthError extends AppError {
  constructor(message: string, originalError?: Error | unknown) {
    super(
      ErrorCode.UNAUTHORIZED,
      message,
      ErrorSeverity.ERROR,
      undefined,
      originalError
    );
    this.name = 'AuthError';
  }
}

/**
 * Error handler & transformer
 * Converts raw errors to AppError types
 */
export class ErrorHandler {
  private logger = new Logger('ErrorHandler');

  /**
   * Transform any error into AppError
   */
  handle(error: unknown, context?: string): AppError {
    this.logger.error(`Handling error in context: ${context}`, error);

    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // HTTP error from API
    if (error instanceof Response) {
      return this.handleHttpError(error);
    }

    // Standard Error
    if (error instanceof Error) {
      // Check for network-specific errors
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        return new NetworkError(error.message, undefined, error);
      }

      if (error.message.includes('timeout')) {
        return new NetworkError('Request timeout', undefined, error);
      }

      // Generic error
      return new AppError(
        ErrorCode.UNKNOWN_ERROR,
        error.message,
        ErrorSeverity.ERROR,
        { context },
        error
      );
    }

    // Unknown error type
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      'An unexpected error occurred',
      ErrorSeverity.CRITICAL,
      { context, errorType: typeof error },
      error as any
    );
  }

  /**
   * Handle HTTP response errors
   */
  private handleHttpError(response: Response): AppError {
    const status = response.status;
    const statusText = response.statusText;

    switch (status) {
      case 400:
        return new ValidationError(
          `Bad request: ${statusText}`,
          undefined,
          response as any
        );

      case 401:
        return new AuthError(
          `Unauthorized: ${statusText}`,
          response as any
        );

      case 403:
        return new AppError(
          ErrorCode.FORBIDDEN,
          `Forbidden: ${statusText}`,
          ErrorSeverity.ERROR,
          undefined,
          response as any
        );

      case 404:
        return new NotFoundError(
          'Resource',
          response.url,
          response as any
        );

      case 409:
        return new AppError(
          ErrorCode.CONFLICT,
          `Conflict: ${statusText}`,
          ErrorSeverity.WARNING,
          undefined,
          response as any
        );

      case 500:
      case 502:
      case 503:
        return new NetworkError(
          `Server error: ${statusText}`,
          status,
          response as any
        );

      default:
        return new NetworkError(
          `HTTP error: ${statusText}`,
          status,
          response as any
        );
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: AppError): boolean {
    const retryableCodes = [
      ErrorCode.TIMEOUT,
      ErrorCode.NETWORK_ERROR,
      ErrorCode.SERVER_ERROR,
    ];

    return retryableCodes.includes(error.code);
  }

  /**
   * Get suggested retry delay in ms
   */
  getRetryDelay(attempt: number = 1): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(Math.pow(2, attempt) * 1000, 30000);
    // Add jitter ±10%
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = new ErrorHandler();

/**
 * Error boundary component wrapper
 * Use this when rendering components that might throw
 */
export class ErrorBoundary {
  constructor(private logger: Logger) {}

  /**
   * Catch and transform errors from operations
   */
  async capture<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const appError = errorHandler.handle(error, context);
      this.logger.error(`Operation failed: ${context}`, appError);
      throw appError;
    }
  }
}
