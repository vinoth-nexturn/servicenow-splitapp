import type {
  ApiResponse,
  GroupSummaryDto,
  GroupDto,
  GroupMemberDto,
  ExpenseDto,
  SettlementDto,
  ActivityDto,
  DashboardBalanceDto,
  GroupBalanceDto,
  GroupReportDto,
  CreateGroupRequest,
  CreateExpenseRequest,
  CreateSettlementRequest,
  CurrentUserDto
} from '../../models';
import { mockDb, CURRENT_USER } from './mock-db';

export class ApiClientService {
  private baseUrl: string;
  private apiBase: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '').trim();
    this.apiBase = `${this.baseUrl}/api/x_split/v1`;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '').trim();
    this.apiBase = `${this.baseUrl}/api/x_split/v1`;
  }

  isMock(): boolean {
    return !this.baseUrl || this.baseUrl === '/' || this.baseUrl === 'mock';
  }

  async getCurrentUser(): Promise<CurrentUserDto> {
    return CURRENT_USER;
  }

  private wrapResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: null,
      errors: null,
      timestamp: new Date().toISOString(),
      requestId: `req_${Math.random().toString(36).substring(2, 9)}`
    };
  }

  private async fetchHttp<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = `${this.apiBase}${path}`;
    const token = (document.cookie.match(/glide_user_auth=([^;]+)/) ?? [])[1] ?? '';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserToken': token
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          data: null,
          meta: null,
          errors: [{ code: 'INTERNAL_ERROR', message: errorText || response.statusText }],
          timestamp: new Date().toISOString(),
          requestId: 'err_http'
        };
      }

      return await response.json();
    } catch (e) {
      return {
        success: false,
        data: null,
        meta: null,
        errors: [{ code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : String(e) }],
        timestamp: new Date().toISOString(),
        requestId: 'err_network'
      };
    }
  }

  // --- Groups ---
  async getGroups(): Promise<ApiResponse<GroupSummaryDto[]>> {
    if (this.isMock()) {
      return this.wrapResponse(mockDb.getGroups());
    }
    return this.fetchHttp<GroupSummaryDto[]>('GET', '/groups');
  }

  async getGroup(groupId: string): Promise<ApiResponse<GroupDto>> {
    if (this.isMock()) {
      const g = mockDb.getGroup(groupId);
      if (!g) {
        return {
          success: false,
          data: null,
          meta: null,
          errors: [{ code: 'NOT_FOUND', message: 'Group not found' }],
          timestamp: new Date().toISOString(),
          requestId: 'err_not_found'
        };
      }
      return this.wrapResponse(g);
    }
    return this.fetchHttp<GroupDto>('GET', `/groups/${groupId}`);
  }

  async createGroup(req: CreateGroupRequest): Promise<ApiResponse<GroupDto>> {
    if (this.isMock()) {
      return this.wrapResponse(mockDb.createGroup(req, CURRENT_USER));
    }
    return this.fetchHttp<GroupDto>('POST', '/groups', req);
  }

  async updateGroup(groupId: string, req: any): Promise<ApiResponse<GroupDto>> {
    if (this.isMock()) {
      const g = mockDb.updateGroup(groupId, req, CURRENT_USER);
      if (!g) {
        return {
          success: false,
          data: null,
          meta: null,
          errors: [{ code: 'NOT_FOUND', message: 'Group not found' }],
          timestamp: new Date().toISOString(),
          requestId: 'err_not_found'
        };
      }
      return this.wrapResponse(g);
    }
    return this.fetchHttp<GroupDto>('PUT', `/groups/${groupId}`, req);
  }

  async archiveGroup(groupId: string): Promise<ApiResponse<void>> {
    if (this.isMock()) {
      const success = mockDb.archiveGroup(groupId, CURRENT_USER);
      if (!success) {
        return {
          success: false,
          data: null,
          meta: null,
          errors: [{ code: 'NOT_FOUND', message: 'Group not found' }],
          timestamp: new Date().toISOString(),
          requestId: 'err_not_found'
        };
      }
      return this.wrapResponse(undefined);
    }
    return this.fetchHttp<void>('DELETE', `/groups/${groupId}`);
  }

  // --- Members ---
  async getMembers(groupId: string): Promise<ApiResponse<GroupMemberDto[]>> {
    if (this.isMock()) {
      return this.wrapResponse(mockDb.getMembers(groupId));
    }
    return this.fetchHttp<GroupMemberDto[]>('GET', `/groups/${groupId}/members`);
  }

  async addMember(groupId: string, req: { userId: string; role?: 'admin' | 'member' | 'observer' }): Promise<ApiResponse<GroupMemberDto>> {
    if (this.isMock()) {
      const m = mockDb.addMember(groupId, req.userId, req.role || 'member', CURRENT_USER);
      if (!m) {
        return {
          success: false,
          data: null,
          meta: null,
          errors: [{ code: 'NOT_FOUND', message: 'User or group not found' }],
          timestamp: new Date().toISOString(),
          requestId: 'err_not_found'
        };
      }
      return this.wrapResponse(m);
    }
    return this.fetchHttp<GroupMemberDto>('POST', `/groups/${groupId}/members`, req);
  }

  async removeMember(groupId: string, userId: string): Promise<ApiResponse<void>> {
    if (this.isMock()) {
      const res = mockDb.removeMember(groupId, userId, CURRENT_USER);
      if (!res.success) {
        return {
          success: false,
          data: null,
          meta: null,
          errors: [{ code: 'BUSINESS_RULE_VIOLATION', message: res.error || 'Failed to remove member' }],
          timestamp: new Date().toISOString(),
          requestId: 'err_biz'
        };
      }
      return this.wrapResponse(undefined);
    }
    return this.fetchHttp<void>('DELETE', `/groups/${groupId}/members/${userId}`);
  }

  // --- Expenses ---
  async getExpenses(groupId: string): Promise<ApiResponse<ExpenseDto[]>> {
    if (this.isMock()) {
      return this.wrapResponse(mockDb.getExpenses(groupId));
    }
    return this.fetchHttp<ExpenseDto[]>('GET', `/groups/${groupId}/expenses`);
  }

  async createExpense(groupId: string, req: CreateExpenseRequest): Promise<ApiResponse<ExpenseDto>> {
    if (this.isMock()) {
      try {
        const exp = mockDb.createExpense(groupId, req, CURRENT_USER);
        return this.wrapResponse(exp);
      } catch (e) {
        return {
          success: false,
          data: null,
          meta: null,
          errors: [{ code: 'VALIDATION_ERROR', message: e instanceof Error ? e.message : String(e) }],
          timestamp: new Date().toISOString(),
          requestId: 'err_val'
        };
      }
    }
    return this.fetchHttp<ExpenseDto>('POST', `/groups/${groupId}/expenses`, req);
  }

  async deleteExpense(groupId: string, expenseId: string): Promise<ApiResponse<void>> {
    if (this.isMock()) {
      try {
        const success = mockDb.deleteExpense(groupId, expenseId, CURRENT_USER);
        if (!success) {
          return {
            success: false,
            data: null,
            meta: null,
            errors: [{ code: 'NOT_FOUND', message: 'Expense not found' }],
            timestamp: new Date().toISOString(),
            requestId: 'err_not_found'
          };
        }
        return this.wrapResponse(undefined);
      } catch (e) {
        return {
          success: false,
          data: null,
          meta: null,
          errors: [{ code: 'BUSINESS_RULE_VIOLATION', message: e instanceof Error ? e.message : String(e) }],
          timestamp: new Date().toISOString(),
          requestId: 'err_biz'
        };
      }
    }
    return this.fetchHttp<void>('DELETE', `/groups/${groupId}/expenses/${expenseId}`);
  }

  // --- Settlements ---
  async getSettlements(groupId: string): Promise<ApiResponse<SettlementDto[]>> {
    if (this.isMock()) {
      return this.wrapResponse(mockDb.getSettlements(groupId));
    }
    return this.fetchHttp<SettlementDto[]>('GET', `/groups/${groupId}/settlements`);
  }

  async createSettlement(groupId: string, req: CreateSettlementRequest): Promise<ApiResponse<SettlementDto>> {
    if (this.isMock()) {
      return this.wrapResponse(mockDb.createSettlement(groupId, req, CURRENT_USER));
    }
    return this.fetchHttp<SettlementDto>('POST', `/groups/${groupId}/settlements`, req);
  }

  // --- Balances ---
  async getGroupBalance(groupId: string): Promise<ApiResponse<GroupBalanceDto>> {
    if (this.isMock()) {
      const bal = mockDb.getGroupBalance(groupId, 'user_vinoth');
      if (!bal) {
        return {
          success: false,
          data: null,
          meta: null,
          errors: [{ code: 'NOT_FOUND', message: 'Group not found' }],
          timestamp: new Date().toISOString(),
          requestId: 'err_not_found'
        };
      }
      return this.wrapResponse(bal);
    }
    return this.fetchHttp<GroupBalanceDto>('GET', `/groups/${groupId}/balances`);
  }

  async getDashboardBalance(): Promise<ApiResponse<DashboardBalanceDto>> {
    if (this.isMock()) {
      return this.wrapResponse(mockDb.getDashboardBalance('user_vinoth'));
    }
    return this.fetchHttp<DashboardBalanceDto>('GET', '/dashboard/balances');
  }

  // --- Activities ---
  async getGroupActivity(groupId: string): Promise<ApiResponse<ActivityDto[]>> {
    if (this.isMock()) {
      return this.wrapResponse(mockDb.getGroupActivity(groupId));
    }
    return this.fetchHttp<ActivityDto[]>('GET', `/groups/${groupId}/activity`);
  }

  async getDashboardActivity(): Promise<ApiResponse<ActivityDto[]>> {
    if (this.isMock()) {
      return this.wrapResponse(mockDb.getDashboardActivity('user_vinoth'));
    }
    return this.fetchHttp<ActivityDto[]>('GET', '/dashboard/activity');
  }

  // --- Reports ---
  async getGroupReport(groupId: string): Promise<ApiResponse<GroupReportDto>> {
    if (this.isMock()) {
      const rpt = mockDb.getGroupReport(groupId);
      if (!rpt) {
        return {
          success: false,
          data: null,
          meta: null,
          errors: [{ code: 'NOT_FOUND', message: 'Group not found' }],
          timestamp: new Date().toISOString(),
          requestId: 'err_not_found'
        };
      }
      return this.wrapResponse(rpt);
    }
    return this.fetchHttp<GroupReportDto>('GET', `/groups/${groupId}/reports/summary`);
  }
}
