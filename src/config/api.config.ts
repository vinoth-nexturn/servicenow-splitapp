export const API_CONFIG = {
  version: 'v1',
  basePath: '/api/x_split/v1',
  timeout: 15_000,
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

export const API_PATHS = {
  groups:                   '/groups',
  group:                    (id: string) => `/groups/${id}`,
  groupMembers:             (id: string) => `/groups/${id}/members`,
  groupMember:              (id: string, uid: string) => `/groups/${id}/members/${uid}`,
  groupExpenses:            (id: string) => `/groups/${id}/expenses`,
  groupExpense:             (id: string, eid: string) => `/groups/${id}/expenses/${eid}`,
  groupBalances:            (id: string) => `/groups/${id}/balances`,
  groupSettlements:         (id: string) => `/groups/${id}/settlements`,
  groupActivity:            (id: string) => `/groups/${id}/activity`,
  groupReports:             (id: string) => `/groups/${id}/reports/summary`,
  dashboardBalances:        '/dashboard/balances',
  dashboardActivity:        '/dashboard/activity',
  dashboardReports:         '/dashboard/reports',
} as const;
