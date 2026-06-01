/**
 * SettlementService - Domain Service for Settlement Operations
 * 
 * Enterprise Patterns:
 * - Command Pattern (settlement commands)
 * - Event Sourcing concepts (track all settlements)
 * - State Machine (settlement states)
 * 
 * Responsibilities:
 * - Record settlement payments
 * - Calculate settlement suggestions
 * - Verify settlement validity
 * - Handle partial settlements
 */

import { BaseService, Logger } from '../infrastructure/service-base';
import type {
  SettlementDto,
  CreateSettlementRequest,
  SettlementProposal,
} from '../../models';
import type { ApiClientService } from '../api/api-client.service';

export class SettlementBusinessRuleError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'SettlementBusinessRuleError';
  }
}

export class SettlementService extends BaseService {
  constructor(apiClient: ApiClientService) {
    super(apiClient);
  }

  /**
   * QUERY: Get settlement history for a group
   */
  async getByGroup(groupId: string): Promise<SettlementDto[]> {
    if (!groupId?.trim()) {
      throw new SettlementBusinessRuleError(
        'INVALID_GROUP_ID',
        'Group ID required'
      );
    }

    try {
      this.logger.debug(`Query: Getting settlements for group ${groupId}`);
      const settlements = await this.apiClient.getSettlements(groupId);
      this.logger.info(`Retrieved ${settlements.length} settlements`);
      return settlements;
    } catch (error) {
      throw this.handleError(error, 'Failed to get settlements');
    }
  }

  /**
   * QUERY: Get settlement suggestions for a group
   * Shows who owes whom and suggested settlement amounts
   */
  async getSuggestions(groupId: string): Promise<SettlementProposal[]> {
    if (!groupId?.trim()) {
      throw new SettlementBusinessRuleError(
        'INVALID_GROUP_ID',
        'Group ID required'
      );
    }

    try {
      this.logger.debug(`Query: Getting settlement suggestions for ${groupId}`);
      // In real implementation, would calculate from balances
      // For now, return empty
      return [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get settlement suggestions');
    }
  }

  /**
   * COMMAND: Record a settlement payment
   * 
   * Business Rules:
   * - Payer and payee must be group members
   * - Amount must be > 0
   * - Amount should not exceed outstanding balance (warning only)
   * - Settlement date should be <= today
   * - Payment method must be valid
   * - Backend auto-settles affected expense shares
   */
  async create(
    groupId: string,
    cmd: CreateSettlementRequest
  ): Promise<SettlementDto> {
    // Validation
    this.validateSettlementCreation(cmd);

    try {
      this.logger.info(
        `Command: Recording settlement of ${cmd.amount} in group ${groupId}`
      );

      const settlement = await this.apiClient.createSettlement(groupId, cmd);

      this.logger.info(`Settlement created: ${settlement.id}`);
      return settlement;
    } catch (error) {
      throw this.handleError(error, 'Failed to create settlement');
    }
  }

  /**
   * QUERY: Get balance between two users
   * Returns: Amount and direction (A owes B, or B owes A)
   */
  async getBalance(
    groupId: string,
    userId1: string,
    userId2: string
  ): Promise<{
    amount: number;
    direction: 'owes' | 'owed' | 'settled';
  }> {
    if (!groupId?.trim() || !userId1?.trim() || !userId2?.trim()) {
      throw new SettlementBusinessRuleError(
        'INVALID_PARAMS',
        'Group ID and both user IDs required'
      );
    }

    try {
      this.logger.debug(
        `Query: Getting balance between ${userId1} and ${userId2} in ${groupId}`
      );
      // In real implementation, would calculate from balances API
      return { amount: 0, direction: 'settled' };
    } catch (error) {
      throw this.handleError(error, 'Failed to get balance');
    }
  }

  /**
   * Validation helper
   */
  private validateSettlementCreation(cmd: CreateSettlementRequest): void {
    const errors: string[] = [];

    // Payee
    if (!cmd.payeeId?.trim()) {
      errors.push('Payee ID is required');
    }

    // Amount
    if (!cmd.amount || cmd.amount <= 0) {
      errors.push('Settlement amount must be greater than 0');
    }

    // Payment method
    const validMethods = [
      'cash',
      'bank_transfer',
      'upi',
      'credit_card',
      'other',
    ];
    if (!cmd.paymentMethod || !validMethods.includes(cmd.paymentMethod)) {
      errors.push(`Invalid payment method: ${cmd.paymentMethod}`);
    }

    // Settlement date
    if (cmd.settlementDate) {
      const settleDate = new Date(cmd.settlementDate);
      if (settleDate > new Date()) {
        errors.push('Settlement date cannot be in the future');
      }
    }

    // Notes
    if (cmd.notes && cmd.notes.length > 500) {
      errors.push('Notes must be 500 characters or less');
    }

    if (errors.length > 0) {
      throw new SettlementBusinessRuleError(
        'VALIDATION_FAILED',
        errors.join('; ')
      );
    }
  }
}
