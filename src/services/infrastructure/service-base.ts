/**
 * Service Layer Infrastructure
 * Enterprise Application Pattern: Base abstractions for dependency injection
 * 
 * This layer provides:
 * - Service container (IoC - Inversion of Control)
 * - Base service class with lifecycle management
 * - Service factory for creating instances
 * - Error handling boundary
 * - Logging integration point
 */

import type { ApiClientService } from '../api/api-client.service';

/**
 * Service lifecycle events
 */
export enum ServiceLifecycle {
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  ERROR = 'error',
  DESTROYED = 'destroyed',
}

/**
 * Base class for all domain services
 * Provides:
 * - Dependency injection
 * - Lifecycle management
 * - Logging hooks
 * - Error handling context
 */
export abstract class BaseService {
  protected loggerInstance: Logger;
  protected lifecycle = ServiceLifecycle.INITIALIZING;

  constructor(protected apiClient: ApiClientService) {
    this.loggerInstance = new Logger(this.constructor.name);
    this.loggerInstance.info('Service initializing');
    this.lifecycle = ServiceLifecycle.INITIALIZED;
  }

  /**
   * Get logger (for subclasses)
   */
  protected get logger(): Logger {
    return this.loggerInstance;
  }

  /**
   * Handle service errors with context
   */
  protected handleError(error: Error | unknown, context: string): Error {
    if (error instanceof Error) {
      this.logger.error(`${context}: ${error.message}`, error);
      return error;
    }

    const err = new Error(`${context}: Unknown error`);
    this.logger.error(err.message, { originalError: error });
    return err;
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    this.lifecycle = ServiceLifecycle.DESTROYED;
    this.logger.info('Service destroyed');
  }
}

/**
 * Simple logger (can be replaced with Winston, Pino, etc.)
 */
export class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor(private context: string) {}

  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.info(`[${this.context}] ${message}`, data);
    }
  }

  warn(message: string, data?: any): void {
    console.warn(`[${this.context}] ${message}`, data);
  }

  error(message: string, error?: any): void {
    console.error(`[${this.context}] ${message}`, error);
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(`[${this.context}] ${message}`, data);
    }
  }
}

/**
 * Service Container - IoC Container for managing service instances
 * 
 * Usage:
 *   const container = new ServiceContainer(apiClient);
 *   const groupService = container.get('group'); // Singleton instance
 */
export class ServiceContainer {
  private services = new Map<string, BaseService>();
  private logger = new Logger('ServiceContainer');

  constructor(private apiClient: ApiClientService) {
    this.logger.info('ServiceContainer initialized');
  }

  /**
   * Register a service factory
   */
  register<T extends BaseService>(
    key: string,
    factory: (api: ApiClientService) => T
  ): void {
    if (this.services.has(key)) {
      this.logger.warn(`Service ${key} already registered, overwriting`);
    }

    const instance = factory(this.apiClient);
    this.services.set(key, instance as BaseService);
    this.logger.info(`Service registered: ${key}`);
  }

  /**
   * Get a service instance (singleton pattern)
   */
  get<T extends BaseService>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service not found: ${key}`);
    }
    return service as T;
  }

  /**
   * Check if service is registered
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Cleanup all services
   */
  destroy(): void {
    this.services.forEach((service) => service.destroy());
    this.services.clear();
    this.logger.info('ServiceContainer destroyed');
  }
}

/**
 * Service factory - creates and configures all services
 * 
 * Enterprise Pattern: Factory Pattern + Registry Pattern
 * 
 * Benefits:
 * - Single source of truth for service instantiation
 * - Easy to mock/replace for testing
 * - Clear dependency declarations
 */
export class ServiceFactory {
  private static instance: ServiceContainer | null = null;
  private static logger = new Logger('ServiceFactory');

  /**
   * Initialize the service container (singleton)
   */
  static initialize(apiClient: ApiClientService): ServiceContainer {
    if (ServiceFactory.instance) {
      ServiceFactory.logger.warn('ServiceContainer already initialized');
      return ServiceFactory.instance;
    }

    const container = new ServiceContainer(apiClient);

    // Register all services
    // Import actual service implementations when created
    // container.register('group', (api) => new GroupService(api));
    // container.register('expense', (api) => new ExpenseService(api));
    // ... etc

    ServiceFactory.instance = container;
    ServiceFactory.logger.info('ServiceFactory initialized with all services');

    return container;
  }

  /**
   * Get the singleton container
   */
  static getInstance(): ServiceContainer {
    if (!ServiceFactory.instance) {
      throw new Error(
        'ServiceFactory not initialized. Call initialize() first.'
      );
    }
    return ServiceFactory.instance;
  }

  /**
   * Reset for testing
   */
  static reset(): void {
    if (ServiceFactory.instance) {
      ServiceFactory.instance.destroy();
      ServiceFactory.instance = null;
    }
  }
}

/**
 * Export service symbols for dependency injection
 * Can be used with decorators in future
 */
export const ServiceTokens = {
  GROUP_SERVICE: Symbol('GroupService'),
  EXPENSE_SERVICE: Symbol('ExpenseService'),
  SETTLEMENT_SERVICE: Symbol('SettlementService'),
  BALANCE_SERVICE: Symbol('BalanceService'),
  VALIDATION_SERVICE: Symbol('ValidationService'),
  API_CLIENT: Symbol('ApiClientService'),
} as const;

export type ServiceToken = (typeof ServiceTokens)[keyof typeof ServiceTokens];
