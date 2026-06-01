import { createContext } from '@lit/context';
import type { GroupSummaryDto, GroupDto, CreateGroupRequest, DashboardBalanceDto, ActivityDto } from '../models';

export interface GroupStateType {
  groups: GroupSummaryDto[];
  selectedGroupId: string | null;
  groupDetails: GroupDto | null;
  dashboardBalance: DashboardBalanceDto | null;
  recentActivity: ActivityDto[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  selectGroup: (id: string) => Promise<void>;
  createGroup: (req: CreateGroupRequest) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addMember: (email: string, role: string) => Promise<void>;
}

export const groupContext = createContext<GroupStateType>('group-context');
