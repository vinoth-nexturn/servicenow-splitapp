import type { UserRefDto } from './user.model';

/**
 * Balance Model (DTOs)
 * Represents balance calculations between users
 */

export interface GroupBalanceDto {
  groupId: string;
  groupName: string;
  baseCurrency: string;
  netBalances: NetBalanceDto[];
  myTotalOwed: number;      // total others owe me
  myTotalOwing: number;     // total I owe others
  netBalance: number;       // myTotalOwed - myTotalOwing
  lastUpdated: string;
}

export interface NetBalanceDto {
  fromUser: UserRefDto;    // owes money
  toUser: UserRefDto;      // is owed money
  amount: number;          // always positive
  currency: string;
  lastSettledAt?: string;
  unsettledExpenses: number;
}

export interface DashboardBalanceDto {
  totalOwed: number;       // across all groups — others owe me
  totalOwing: number;      // across all groups — I owe others
  netBalance: number;      // totalOwed - totalOwing
  currency: string;
  groupBreakdown: GroupBalanceSummaryDto[];
  updatedAt: string;
}

export interface GroupBalanceSummaryDto {
  groupId: string;
  groupName: string;
  myBalance: number;       // positive = owed, negative = owing
  currency: string;
  membersInvolved: number;
  lastActivityAt: string;
}

export interface BalanceRequest {
  groupId: string;
  userId?: string;          // optional: get balance for specific user
}

export interface SettlementSuggestion {
  fromUser: UserRefDto;
  toUser: UserRefDto;
  amount: number;
  expenseCount: number;
  priority: 'high' | 'medium' | 'low';
}
