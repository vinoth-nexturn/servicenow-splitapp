import { createContext } from '@lit/context';
import type { GroupSummaryDto, DashboardBalanceDto, ActivityDto, CurrentUserDto } from '../../models';

export type AppRoute =
  | { name: 'dashboard' }
  | { name: 'group'; groupId: string }
  | { name: 'reports' }
  | { name: 'settings' };

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface AppState {
  currentUser: CurrentUserDto | null;
  groups: GroupSummaryDto[];
  route: AppRoute;
  dashboardBalance: DashboardBalanceDto | null;
  recentActivity: ActivityDto[];
  toasts: Toast[];
  isInitializing: boolean;
  initError: string | null;
}

export const appContext = createContext<AppState>('split-app-context');

export const initialAppState: AppState = {
  currentUser:      null,
  groups:           [],
  route:            { name: 'dashboard' },
  dashboardBalance: null,
  recentActivity:   [],
  toasts:           [],
  isInitializing:   true,
  initError:        null,
};

export function createToast(
  type: Toast['type'],
  message: string,
  duration = 4000,
): Toast {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `toast_${Math.random().toString(36).substring(2, 9)}`;
  return { id, type, message, duration };
}
