/**
 * BalanceService - Domain Service for Balance Calculations
 * 
 * Enterprise Patterns:
 * - Aggregate Pattern (calculates across multiple entities)
 * - Query Object Pattern (for balance queries)
 * 
 * Responsibilities:
 * - Calculate group balances
 * - Calculate dashboard balance (across all groups)
 * - Determine who owes whom
 * - Optimize settlement suggestions
 */

import { BaseService, Logger } from '../infrastructure/service-base';
import type {
  GroupBalanceDto,
  DashboardBalanceDto,
  NetBalanceDto,
} from '../../models';
import type { ApiClientService } from '../api/api-client.service';

export class BalanceBusinessRuleError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'BalanceBusinessRuleError';
  }
}

/**
 * Balance query object - encapsulates balance calculation parameters
 */
interface BalanceQuery {
  groupId?: string;
  userId?: string;
  includeSettled?: boolean;
}

export class BalanceService extends BaseService {
  constructor(apiClient: ApiClientService) {
    super(apiClient);
  }

  /**
   * QUERY: Get all balances in a group
   * Returns list of { userId, amount, direction }
   * Positive = they owe you
   * Negative = you owe them
   */
  async getGroupBalances(groupId: string): Promise<GroupBalanceDto[]> {
    if (!groupId?.trim()) {
      throw new BalanceBusinessRuleError('INVALID_GROUP_ID', 'Group ID required');
    }

    try {
      this.logger.debug(`Query: Getting balances for group ${groupId}`);
      const balances = await this.apiClient.getGroupBalances(groupId);
      this.logger.info(`Retrieved balances for ${balances.length} members`);
      return balances;
    } catch (error) {
      throw this.handleError(error, 'Failed to get group balances');
    }
  }

  /**
   * QUERY: Get personal dashboard balance
   * Total across all groups
   * 
   * Returns:
   * - totalOwed: Total amount owed to you
   * - totalOwing: Total amount you owe
   * - netBalance: totalOwed - totalOwing
   */
  async getDashboardBalance(): Promise<DashboardBalanceDto> {
    try {
      this.logger.debug('Query: Getting dashboard balance');
      const balance = await this.apiClient.getDashboardBalance();
      this.logger.info(
        `Dashboard balance: owed=${balance.totalOwed}, owing=${balance.totalOwing}`
      );
      return balance;
    } catch (error) {
      throw this.handleError(error, 'Failed to get dashboard balance');
    }
  }

  /**
   * QUERY: Get net balance between two users in a group
   * 
   * Returns amount and direction:
   * - fromUser: The user who owes money
   * - toUser: The user who is owed money
   * - amount: How much is owed (always positive)
   */
  async getNetBalance(
    groupId: string,
    userId1: string,
    userId2: string
  ): Promise<NetBalanceDto | null> {
    if (!groupId?.trim() || !userId1?.trim() || !userId2?.trim()) {
      throw new BalanceBusinessRuleError(
        'INVALID_PARAMS',
        'Group ID and both user IDs required'
      );
    }

    try {
      this.logger.debug(
        `Query: Net balance between ${userId1} and ${userId2} in ${groupId}`
      );

      // Get all group balances
      const balances = await this.getGroupBalances(groupId);

      // Find balance entry for these two users
      for (const balance of balances) {
        for (const netBalance of balance.netBalances) {
          if (
            (netBalance.fromUser.id === userId1 &&
              netBalance.toUser.id === userId2) ||
            (netBalance.fromUser.id === userId2 &&
              netBalance.toUser.id === userId1)
          ) {
            return netBalance;
          }
        }
      }

      // No balance found (they're settled up)
      return null;
    } catch (error) {
      throw this.handleError(error, 'Failed to calculate net balance');
    }
  }

  /**
   * QUERY: Check if balance is positive (owed money)
   */
  isPositiveBalance(balance: GroupBalanceDto): boolean {
    return (balance as any).amount > 0;
  }

  /**
   * QUERY: Format balance for display
   * "You are owed $50" or "You owe $30"
   */
  formatBalanceMessage(balance: GroupBalanceDto, userName: string = 'They'): string {
    const amount = Math.abs((balance as any).amount).toFixed(2);
    const isOwed = this.isPositiveBalance(balance);

    return isOwed ? `${userName} owes you $${amount}` : `You owe ${userName} $${amount}`;
  }

  /**
   * QUERY: Get balance color indicator (CSS class)
   * Green = owed money, Red = owe money, Gray = settled
   */
  getBalanceColor(balance: GroupBalanceDto): 'positive' | 'negative' | 'neutral' {
    const amount = (balance as any).amount;

    if (Math.abs(amount) < 0.01) return 'neutral';
    return amount > 0 ? 'positive' : 'negative';
  }

  /**
   * Determine if a balance requires settlement
   */
  requiresSettlement(balance: GroupBalanceDto): boolean {
    return Math.abs((balance as any).amount) > 0.01;
  }
}
