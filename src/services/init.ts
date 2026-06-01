/**
 * Service Initialization & Setup
 * 
 * This module initializes the service container and registers all domain services.
 * Called once during application startup.
 * 
 * Usage:
 *   import { initializeServices } from './services/init';
 *   const container = initializeServices(apiClient);
 */

import type { ApiClientService } from './api/api-client.service';
import { ServiceFactory, ServiceContainer } from './infrastructure';
import {
  GroupService,
  ExpenseService,
  SettlementService,
  BalanceService,
  ValidationService,
} from './domain';

let serviceContainer: ServiceContainer | null = null;

/**
 * Initialize the service container with all domain services
 * Should be called once during app startup
 * 
 * @param apiClient - Configured API client service
 * @returns ServiceContainer singleton instance
 */
export function initializeServices(
  apiClient: ApiClientService
): ServiceContainer {
  // Prevent double initialization
  if (serviceContainer) {
    console.warn('Services already initialized, returning existing container');
    return serviceContainer;
  }

  // Initialize factory (this creates the container)
  serviceContainer = ServiceFactory.initialize(apiClient);

  // Register all domain services
  serviceContainer.register('group', (api) => new GroupService(api));
  serviceContainer.register('expense', (api) => new ExpenseService(api));
  serviceContainer.register('settlement', (api) => new SettlementService(api));
  serviceContainer.register('balance', (api) => new BalanceService(api));
  serviceContainer.register('validation', (api) => new ValidationService(api));

  return serviceContainer;
}

/**
 * Get the initialized service container
 * Throws if not initialized
 */
export function getServiceContainer(): ServiceContainer {
  return ServiceFactory.getInstance();
}

/**
 * Access specific services (type-safe)
 */
export const serviceRegistry = {
  get group(): GroupService {
    return getServiceContainer().get<GroupService>('group');
  },

  get expense(): ExpenseService {
    return getServiceContainer().get<ExpenseService>('expense');
  },

  get settlement(): SettlementService {
    return getServiceContainer().get<SettlementService>('settlement');
  },

  get balance(): BalanceService {
    return getServiceContainer().get<BalanceService>('balance');
  },

  get validation(): ValidationService {
    return getServiceContainer().get<ValidationService>('validation');
  },
};

/**
 * Cleanup services (useful for testing and app shutdown)
 */
export function destroyServices(): void {
  if (serviceContainer) {
    serviceContainer.destroy();
    serviceContainer = null;
    ServiceFactory.reset();
  }
}
