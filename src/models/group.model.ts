import type { UserRefDto } from './user.model';

/**
 * Group Model (DTOs)
 * Represents expense-sharing group entities
 */

export type GroupRole = 'admin' | 'member' | 'observer';

export interface GroupDto {
  id: string;
  name: string;
  description?: string;
  baseCurrency: string;
  isArchived: boolean;
  memberCount: number;
  myBalance: number;          // positive = owed, negative = owing
  myRole: GroupRole;
  members: GroupMemberDto[];
  createdBy: UserRefDto;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  budgetLimit?: number;
}

export interface GroupMemberDto {
  userId: string;
  user: UserRefDto;
  role: GroupRole;
  joinedAt: string;
  isActive: boolean;
  status: 'active' | 'removed';
}

export interface GroupDetailDto extends GroupDto {
  totalExpenses: number;
  totalSettled: number;
  balances: BalanceDto[];
  recentActivity: ActivityDto[];
  statistics: GroupStatistics;
}

export interface GroupStatistics {
  totalExpenses: number;
  totalAmount: number;
  expensesByCategory: Record<string, number>;
  expensesByMember: Array<{ userId: string; amount: number }>;
  unsettledAmount: number;
}

export interface GroupSummaryDto {
  id: string;
  name: string;
  baseCurrency: string;
  memberCount: number;
  myBalance: number;
  myRole: GroupRole;
  isArchived: boolean;
  lastActivityAt: string;
  imageUrl?: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  baseCurrency?: string;
  imageUrl?: string;
  budgetLimit?: number;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  baseCurrency?: string;
  imageUrl?: string;
  budgetLimit?: number;
}

export interface AddGroupMemberRequest {
  userId: string;
  role: GroupRole;
}

export interface UpdateGroupMemberRequest {
  role: GroupRole;
}

export interface BalanceDto {
  userFrom: UserRefDto;
  userTo: UserRefDto;
  amount: number;
  settledAmount: number;
  unsettledAmount: number;
  lastUpdatedAt: string;
}

export interface ActivityDto {
  id: string;
  actor: UserRefDto;
  actionType: string;
  entityType: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AddMemberRequest {
  userId: string;
  role?: GroupRole;
}
