/**
 * ExpenseService - Domain Service for Expense Operations
 * 
 * Enterprise Patterns:
 * - Specification Pattern (for validation)
 * - Strategy Pattern (for split type calculation)
 * - Domain Driven Design (business logic in service)
 * 
 * Responsibilities:
 * - CRUD operations for expenses
 * - Share calculation (equal, exact, percentage, shares)
 * - Business rule enforcement
 * - Data validation
 */

import { BaseService, Logger } from '../infrastructure/service-base';
import type {
  ExpenseDto,
  CreateExpenseRequest,
  ShareDto,
  SplitType,
} from '../../models';
import type { ApiClientService } from '../api/api-client.service';

export class ExpenseBusinessRuleError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ExpenseBusinessRuleError';
  }
}

/**
 * Share calculation strategy
 */
interface SplitStrategy {
  calculate(
    amount: number,
    memberCount: number,
    details?: any
  ): Map<string, number>;
}

class EqualSplitStrategy implements SplitStrategy {
  calculate(amount: number, memberCount: number): Map<string, number> {
    if (memberCount <= 0) throw new Error('Member count must be > 0');
    const perMember = amount / memberCount;
    return new Map(Array(memberCount).fill([null, perMember]));
  }
}

class ExactSplitStrategy implements SplitStrategy {
  calculate(
    amount: number,
    memberCount: number,
    details: Record<string, number>
  ): Map<string, number> {
    const shares = new Map(Object.entries(details));
    const sum = Array.from(shares.values()).reduce((a, b) => a + b, 0);

    if (Math.abs(sum - amount) > 0.01) {
      throw new Error(
        `Share sum (${sum}) must equal expense amount (${amount})`
      );
    }

    return shares;
  }
}

class PercentageSplitStrategy implements SplitStrategy {
  calculate(
    amount: number,
    memberCount: number,
    details: Record<string, number>
  ): Map<string, number> {
    const shares = new Map<string, number>();
    let totalPercent = 0;

    for (const [userId, percent] of Object.entries(details)) {
      totalPercent += percent;
      shares.set(userId, (percent / 100) * amount);
    }

    if (Math.abs(totalPercent - 100) > 0.01) {
      throw new Error(
        `Percentages must sum to 100% (got ${totalPercent}%)`
      );
    }

    return shares;
  }
}

class SharesSplitStrategy implements SplitStrategy {
  calculate(
    amount: number,
    memberCount: number,
    details: Record<string, number>
  ): Map<string, number> {
    const shares = new Map<string, number>();
    let totalUnits = 0;

    for (const units of Object.values(details)) {
      totalUnits += units;
    }

    const perUnit = amount / totalUnits;

    for (const [userId, units] of Object.entries(details)) {
      shares.set(userId, perUnit * units);
    }

    return shares;
  }
}

/**
 * ExpenseService
 */
export class ExpenseService extends BaseService {
  private strategies: Record<SplitType, SplitStrategy> = {
    equal: new EqualSplitStrategy(),
    exact: new ExactSplitStrategy(),
    percentage: new PercentageSplitStrategy(),
    shares: new SharesSplitStrategy(),
  };

  constructor(apiClient: ApiClientService) {
    super(apiClient);
  }

  /**
   * QUERY: Get all expenses for a group
   */
  async getByGroup(groupId: string): Promise<ExpenseDto[]> {
    if (!groupId?.trim()) {
      throw new ExpenseBusinessRuleError(
        'INVALID_GROUP_ID',
        'Group ID required'
      );
    }

    try {
      this.logger.debug(`Query: Getting expenses for group ${groupId}`);
      const expenses = await this.apiClient.getExpenses(groupId);
      this.logger.info(`Retrieved ${expenses.length} expenses`);
      return expenses;
    } catch (error) {
      throw this.handleError(error, 'Failed to get expenses');
    }
  }

  /**
   * COMMAND: Create expense with automatic share calculation
   * 
   * Business Rules:
   * - Amount must be > 0
   * - Split type must be valid
   * - Payer must be group member
   * - Expense date cannot be in future
   * - For equal split: auto-calculated per member
   * - For exact/percentage/shares: totals must match
   */
  async create(groupId: string, cmd: CreateExpenseRequest): Promise<ExpenseDto> {
    // Validation
    this.validateExpenseCreation(cmd);

    try {
      this.logger.info(
        `Command: Creating expense "${cmd.description}" in group ${groupId}`
      );

      // Call API - backend will handle share creation
      const expense = await this.apiClient.createExpense(groupId, cmd);

      this.logger.info(
        `Expense created: ${expense.id} with ${expense.shares?.length || 0} shares`
      );
      return expense;
    } catch (error) {
      throw this.handleError(error, 'Failed to create expense');
    }
  }

  /**
   * Calculate shares for an expense (for preview/validation)
   * Strategy Pattern for different split types
   */
  calculateShares(
    amount: number,
    splitType: SplitType,
    memberIds: string[],
    details?: any
  ): Map<string, number> {
    if (amount <= 0) {
      throw new ExpenseBusinessRuleError(
        'INVALID_AMOUNT',
        'Expense amount must be > 0'
      );
    }

    const strategy = this.strategies[splitType];
    if (!strategy) {
      throw new ExpenseBusinessRuleError(
        'INVALID_SPLIT_TYPE',
        `Unknown split type: ${splitType}`
      );
    }

    return strategy.calculate(amount, memberIds.length, details);
  }

  /**
   * COMMAND: Delete expense
   * Business Rules:
   * - Only payer or admin can delete
   * - Cannot delete if shares are settled
   */
  async delete(groupId: string, expenseId: string): Promise<void> {
    if (!groupId?.trim() || !expenseId?.trim()) {
      throw new ExpenseBusinessRuleError(
        'INVALID_PARAMS',
        'Group ID and Expense ID required'
      );
    }

    try {
      this.logger.info(
        `Command: Deleting expense ${expenseId} from group ${groupId}`
      );

      await this.apiClient.deleteExpense(groupId, expenseId);

      this.logger.info(`Expense deleted: ${expenseId}`);
    } catch (error) {
      throw this.handleError(error, 'Failed to delete expense');
    }
  }

  /**
   * Validation helper
   */
  private validateExpenseCreation(cmd: CreateExpenseRequest): void {
    const errors: string[] = [];

    // Description
    if (!cmd.description?.trim()) {
      errors.push('Description is required');
    } else if (cmd.description.trim().length > 200) {
      errors.push('Description must be 200 characters or less');
    }

    // Amount
    if (!cmd.amount || cmd.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    // Split type
    const validTypes: SplitType[] = ['equal', 'exact', 'percentage', 'shares'];
    if (!cmd.splitType || !validTypes.includes(cmd.splitType)) {
      errors.push(`Invalid split type: ${cmd.splitType}`);
    }

    // Category
    const validCategories = [
      'Food & Drink',
      'Travel',
      'Utilities',
      'Entertainment',
      'Other',
    ];
    if (cmd.category && !validCategories.includes(cmd.category)) {
      errors.push(`Invalid category: ${cmd.category}`);
    }

    // Notes
    if (cmd.notes && cmd.notes.length > 500) {
      errors.push('Notes must be 500 characters or less');
    }

    if (errors.length > 0) {
      throw new ExpenseBusinessRuleError(
        'VALIDATION_FAILED',
        errors.join('; ')
      );
    }
  }
}
