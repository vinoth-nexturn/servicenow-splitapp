/**
 * ValidationService - Domain Service for Business Logic Validation
 * 
 * Enterprise Patterns:
 * - Specification Pattern
 * - Composite Pattern (for complex validations)
 * - Strategy Pattern (for different validation rules)
 * 
 * Responsibilities:
 * - Cross-domain validation logic
 * - Business rule enforcement
 * - Pre-operation validation
 * - Custom validation rules
 */

import { BaseService, Logger } from '../infrastructure/service-base';
import type {
  CreateExpenseRequest,
  CreateGroupRequest,
  CreateSettlementRequest,
} from '../../models';
import type { ApiClientService } from '../api/api-client.service';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Specification pattern - represents a business rule
 */
interface Specification {
  isSatisfied(value: any): boolean;
  reason(): string;
}

class RangeSpecification implements Specification {
  constructor(private min: number, private max: number, private name: string) {}

  isSatisfied(value: number): boolean {
    return value >= this.min && value <= this.max;
  }

  reason(): string {
    return `${this.name} must be between ${this.min} and ${this.max}`;
  }
}

class RegexSpecification implements Specification {
  constructor(private pattern: RegExp, private name: string) {}

  isSatisfied(value: string): boolean {
    return this.pattern.test(value);
  }

  reason(): string {
    return `${this.name} format is invalid`;
  }
}

class NotEmptySpecification implements Specification {
  constructor(private name: string) {}

  isSatisfied(value: any): boolean {
    return value != null && value !== '';
  }

  reason(): string {
    return `${this.name} cannot be empty`;
  }
}

export class ValidationService extends BaseService {
  // Common specifications
  private readonly nameSpec = new NotEmptySpecification('Name');
  private readonly amountSpec = new RangeSpecification(
    0.01,
    999999.99,
    'Amount'
  );
  private readonly currencySpec = new RegexSpecification(
    /^[A-Z]{3}$/,
    'Currency'
  );
  private readonly emailSpec = new RegexSpecification(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    'Email'
  );

  constructor(apiClient: ApiClientService) {
    super(apiClient);
  }

  /**
   * Validate expense creation
   */
  validateExpense(cmd: CreateExpenseRequest): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Description validation
      if (!cmd.description?.trim()) {
        result.errors.push('Description is required');
      } else if (cmd.description.trim().length > 200) {
        result.errors.push('Description must be ≤ 200 characters');
      }

      // Amount validation
      if (!this.amountSpec.isSatisfied(cmd.amount)) {
        result.errors.push(this.amountSpec.reason());
      }

      // Split type validation
      const validTypes = ['equal', 'exact', 'percentage', 'shares'];
      if (!validTypes.includes(cmd.splitType)) {
        result.errors.push(`Split type must be: ${validTypes.join(', ')}`);
      }

      // Category validation
      const validCategories = [
        'Food & Drink',
        'Travel',
        'Utilities',
        'Entertainment',
        'Other',
      ];
      if (cmd.category && !validCategories.includes(cmd.category)) {
        result.warnings.push(
          `Category "${cmd.category}" is not standard`
        );
      }

      // Notes validation
      if (cmd.notes && cmd.notes.length > 500) {
        result.errors.push('Notes must be ≤ 500 characters');
      }

      // Set isValid based on errors
      result.isValid = result.errors.length === 0;
    } catch (error) {
      this.logger.error('Error during expense validation', error);
      result.isValid = false;
      result.errors.push('Validation error occurred');
    }

    return result;
  }

  /**
   * Validate group creation
   */
  validateGroup(cmd: CreateGroupRequest): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Name validation
      if (!this.nameSpec.isSatisfied(cmd.name)) {
        result.errors.push(this.nameSpec.reason());
      } else if (cmd.name.trim().length > 100) {
        result.errors.push('Group name must be ≤ 100 characters');
      }

      // Description validation
      if (cmd.description && cmd.description.length > 500) {
        result.errors.push('Description must be ≤ 500 characters');
      }

      // Currency validation
      if (cmd.baseCurrency && !this.currencySpec.isSatisfied(cmd.baseCurrency)) {
        result.errors.push(this.currencySpec.reason());
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      this.logger.error('Error during group validation', error);
      result.isValid = false;
      result.errors.push('Validation error occurred');
    }

    return result;
  }

  /**
   * Validate settlement creation
   */
  validateSettlement(cmd: CreateSettlementRequest): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Payee validation
      if (!cmd.payeeId?.trim()) {
        result.errors.push('Payee is required');
      }

      // Amount validation
      if (!this.amountSpec.isSatisfied(cmd.amount)) {
        result.errors.push(this.amountSpec.reason());
      }

      // Payment method validation
      const validMethods = [
        'cash',
        'bank_transfer',
        'upi',
        'credit_card',
        'other',
      ];
      if (!cmd.paymentMethod || !validMethods.includes(cmd.paymentMethod)) {
        result.errors.push(
          `Payment method must be: ${validMethods.join(', ')}`
        );
      }

      // Settlement date validation
      if (cmd.settlementDate) {
        const settleDate = new Date(cmd.settlementDate);
        if (settleDate > new Date()) {
          result.errors.push('Settlement date cannot be in the future');
        }

        // Warn if very old
        const daysSince = Math.floor(
          (Date.now() - settleDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince > 90) {
          result.warnings.push(
            `Settlement is ${daysSince} days old, was this intentional?`
          );
        }
      }

      // Notes validation
      if (cmd.notes && cmd.notes.length > 500) {
        result.errors.push('Notes must be ≤ 500 characters');
      }

      result.isValid = result.errors.length === 0;
    } catch (error) {
      this.logger.error('Error during settlement validation', error);
      result.isValid = false;
      result.errors.push('Validation error occurred');
    }

    return result;
  }

  /**
   * Cross-domain validation
   * Example: Ensure settling member has outstanding balance
   */
  validateSettlementAgainstBalance(
    currentBalance: number,
    settlementAmount: number
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (settlementAmount > Math.abs(currentBalance)) {
      result.warnings.push(
        `Settlement amount exceeds the ${currentBalance > 0 ? 'owed' : 'owing'} balance`
      );
    }

    if (settlementAmount === Math.abs(currentBalance)) {
      result.warnings.push('This settlement will completely clear the balance');
    }

    result.isValid = true; // Allow overpayment/underpayment with warning
    return result;
  }

  /**
   * Generic async validator
   * Can be extended for backend validation (e.g., check if user exists)
   */
  async validateWithServer(
    entityType: 'group' | 'user' | 'expense',
    entityId: string
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Example: could call API to verify entity exists
      // For now, just return valid
      return result;
    } catch (error) {
      this.logger.error(`Server validation failed for ${entityType}`, error);
      result.isValid = false;
      result.errors.push(`Server validation failed for ${entityType}`);
      return result;
    }
  }

  /**
   * Composite validation - run multiple validators
   */
  validateAll(...validators: ValidationResult[]): ValidationResult {
    const combined: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    for (const result of validators) {
      combined.errors.push(...result.errors);
      combined.warnings.push(...result.warnings);
      combined.isValid = combined.isValid && result.isValid;
    }

    return combined;
  }
}
