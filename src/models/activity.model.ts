import type { UserRefDto } from './user.model';

/**
 * Activity Model (DTOs)
 * Represents activity logs and feed events
 */

export type ActivityAction =
  | 'expense_added'
  | 'expense_edited'
  | 'expense_deleted'
  | 'expense_finalized'
  | 'settlement_proposed'
  | 'settlement_accepted'
  | 'settlement_rejected'
  | 'settlement_completed'
  | 'member_added'
  | 'member_removed'
  | 'member_role_changed'
  | 'group_created'
  | 'group_updated'
  | 'group_archived'
  | 'balance_updated';

export type ActivityEntityType = 'expense' | 'settlement' | 'member' | 'group' | 'balance';

export interface ActivityDto {
  id: string;
  groupId: string;
  groupName: string;
  actor: UserRefDto;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityName?: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityFeedDto {
  activities: ActivityDto[];
  hasMore: boolean;
  nextOffset?: number;
}

export interface ActivityFilterRequest {
  groupId: string;
  action?: ActivityAction[];
  entityType?: ActivityEntityType[];
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  offset?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivitySummaryDto {
  totalActivities: number;
  byAction: Record<ActivityAction, number>;
  byActor: Array<{ actor: UserRefDto; count: number }>;
  lastActivityAt: string;
  periodStart: string;
  periodEnd: string;
}

export interface GroupActivityStatsDto {
  groupId: string;
  totalActivities: number;
  activeMembers: number;
  mostActive: UserRefDto;
  recentActivity: ActivityDto[];
}
