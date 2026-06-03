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
import { Logger } from '../infrastructure';

/**
 * Request/Response Interceptor Interface
 */
interface RequestInterceptor {
  (request: RequestInit): RequestInit | Promise<RequestInit>;
}

interface ResponseInterceptor {
  (response: Response): Response | Promise<Response>;
}

interface ErrorInterceptor {
  (error: Error): Error | Promise<Error>;
}

/**
 * Enhanced ApiClientService with interceptors, retry logic, and error handling
 * 
 * Enterprise Patterns:
 * - Interceptor Pattern (for request/response transformation)
 * - Retry Pattern (exponential backoff)
 * - Factory Pattern (response unwrapping)
 */
export class ApiClientService {
  private baseUrl: string;
  private apiBase: string;
  private logger = new Logger('ApiClientService');

  // Interceptors
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  // Retry configuration
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '').trim();
    this.apiBase = `${this.baseUrl}/api/x_split/v1`;

    // Initialize default interceptors
    this.initializeDefaultInterceptors();
  }

  /**
   * Initialize default interceptors
   */
  private initializeDefaultInterceptors(): void {
    // Request logging
    this.addRequestInterceptor((req) => {
      this.logger.debug(`API Request: ${req.method}`);
      return req;
    });

    // Response logging
    this.addResponseInterceptor((res) => {
      this.logger.debug(`API Response: ${res.status} ${res.statusText}`);
      return res;
    });

    // Error logging
    this.addErrorInterceptor((err) => {
      this.logger.error(`API Error: ${err.message}`, err);
      return err;
    });
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add an error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Execute all request interceptors
   */
  private async executeRequestInterceptors(
    request: RequestInit
  ): Promise<RequestInit> {
    let req = request;
    for (const interceptor of this.requestInterceptors) {
      req = await Promise.resolve(interceptor(req));
    }
    return req;
  }

  /**
   * Execute all response interceptors
   */
  private async executeResponseInterceptors(
    response: Response
  ): Promise<Response> {
    let res = response;
    for (const interceptor of this.responseInterceptors) {
      res = await Promise.resolve(interceptor(res));
    }
    return res;
  }

  /**
   * Execute all error interceptors
   */
  private async executeErrorInterceptors(error: Error): Promise<Error> {
    let err = error;
    for (const interceptor of this.errorInterceptors) {
      err = await Promise.resolve(interceptor(err));
    }
    return err;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '').trim();
    this.apiBase = `${this.baseUrl}/api/x_split/v1`;
  }

  async discoverApiBase(): Promise<string> {
    if (this.isMock()) {
      return '';
    }
    if (typeof window !== 'undefined' && (window as any).g_ck) {
      try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        headers['X-UserToken'] = (window as any).g_ck;
        const res = await fetch(
          '/api/now/table/sys_ws_definition?sysparm_query=name=split_api&sysparm_fields=base_uri&sysparm_limit=1',
          { headers, credentials: 'include' }
        );
        const data = await res.json();
        if (data.result && data.result.length > 0 && data.result[0].base_uri) {
          this.apiBase = data.result[0].base_uri;
          return this.apiBase;
        }
      } catch (e) {
        console.error('Failed to discover API base, falling back to scope default', e);
      }
      this.apiBase = '/api/x_snc_split_app_2/split_api';
      return this.apiBase;
    }
    this.apiBase = `${this.baseUrl}/api/x_split/v1`;
    return this.apiBase;
  }

  isMock(): boolean {
    return !this.baseUrl || this.baseUrl === '/' || this.baseUrl === 'mock';
  }

  async getCurrentUser(): Promise<CurrentUserDto> {
    return CURRENT_USER;
  }

  /**
   * Unwrap successful response data
   * Throws if response contains errors
   */
  private unwrapResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      const errors = response.errors?.map((e) => e.message).join(', ') || 'Unknown error';
      throw new Error(errors);
    }

    if (!response.data) {
      throw new Error('No data in response');
    }

    return response.data;
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

  /**
   * Execute HTTP request with retries and interceptors
   * Implements exponential backoff on retryable errors
   */
  private async fetchHttp<T>(
    method: string,
    path: string,
    body?: unknown,
    attempt: number = 0
  ): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const token =
      (document.cookie.match(/glide_user_auth=([^;]+)/) ?? [])[1] ?? '';

    let request: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-UserToken': token,
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    try {
      // Execute request interceptors
      request = await this.executeRequestInterceptors(request);

      // Execute fetch
      let response = await fetch(url, request);

      // Execute response interceptors
      response = await this.executeResponseInterceptors(response);

      if (!response.ok) {
        // Check if error is retryable and we haven't exceeded max retries
        if (
          this.isRetryableStatus(response.status) &&
          attempt < this.maxRetries
        ) {
          const delay = this.getExponentialBackoffDelay(attempt);
          this.logger.info(
            `Retrying request (attempt ${attempt + 1}/${this.maxRetries}) after ${delay}ms`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.fetchHttp<T>(method, path, body, attempt + 1);
        }

        const errorText = await response.text();
        const error = new Error(
          `HTTP ${response.status}: ${errorText || response.statusText}`
        );
        throw error;
      }

      const responseData = await response.json();
      return this.unwrapResponse(responseData);
    } catch (error) {
      // Execute error interceptors
      const processedError = await this.executeErrorInterceptors(
        error instanceof Error ? error : new Error(String(error))
      );

      throw processedError;
    }
  }

  /**
   * Check if HTTP status code is retryable
   */
  private isRetryableStatus(status: number): boolean {
    return (
      status === 408 || // Request Timeout
      status === 429 || // Too Many Requests
      status >= 500 // Server errors
    );
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private getExponentialBackoffDelay(attempt: number): number {
    const exponentialDelay = Math.pow(2, attempt) * this.retryDelay;
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30s
  }

  // --- Groups ---
  async getGroups(): Promise<GroupSummaryDto[]> {
    if (this.isMock()) {
      return mockDb.getGroups();
    }
    return this.fetchHttp<GroupSummaryDto[]>('GET', '/groups');
  }

  async getGroup(groupId: string): Promise<GroupDto | null> {
    if (this.isMock()) {
      return mockDb.getGroup(groupId);
    }
    try {
      return await this.fetchHttp<GroupDto>('GET', `/groups/${groupId}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createGroup(req: CreateGroupRequest): Promise<GroupDto> {
    if (this.isMock()) {
      return mockDb.createGroup(req, CURRENT_USER);
    }
    return this.fetchHttp<GroupDto>('POST', '/groups', req);
  }

  async updateGroup(groupId: string, req: any): Promise<GroupDto> {
    if (this.isMock()) {
      const g = mockDb.updateGroup(groupId, req, CURRENT_USER);
      if (!g) throw new Error('Group not found');
      return g;
    }
    return this.fetchHttp<GroupDto>('PUT', `/groups/${groupId}`, req);
  }

  async archiveGroup(groupId: string): Promise<void> {
    if (this.isMock()) {
      const success = mockDb.archiveGroup(groupId, CURRENT_USER);
      if (!success) throw new Error('Group not found');
      return;
    }
    return this.fetchHttp<void>('DELETE', `/groups/${groupId}`);
  }

  // --- Members ---
  async getMembers(groupId: string): Promise<GroupMemberDto[]> {
    if (this.isMock()) {
      return mockDb.getMembers(groupId);
    }
    return this.fetchHttp<GroupMemberDto[]>('GET', `/groups/${groupId}/members`);
  }

  async addGroupMember(
    groupId: string,
    req: { userId: string; role?: 'admin' | 'member' | 'observer' }
  ): Promise<GroupMemberDto> {
    if (this.isMock()) {
      const m = mockDb.addMember(groupId, req.userId, req.role || 'member', CURRENT_USER);
      if (!m) throw new Error('User or group not found');
      return m;
    }
    return this.fetchHttp<GroupMemberDto>('POST', `/groups/${groupId}/members`, req);
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    if (this.isMock()) {
      const res = mockDb.removeMember(groupId, userId, CURRENT_USER);
      if (!res.success) throw new Error(res.error || 'Failed to remove member');
      return;
    }
    return this.fetchHttp<void>('DELETE', `/groups/${groupId}/members/${userId}`);
  }

  // --- Expenses ---
  async getExpenses(groupId: string): Promise<ExpenseDto[]> {
    if (this.isMock()) {
      return mockDb.getExpenses(groupId);
    }
    return this.fetchHttp<ExpenseDto[]>('GET', `/groups/${groupId}/expenses`);
  }

  async createExpense(
    groupId: string,
    req: CreateExpenseRequest
  ): Promise<ExpenseDto> {
    if (this.isMock()) {
      return mockDb.createExpense(groupId, req, CURRENT_USER);
    }
    return this.fetchHttp<ExpenseDto>('POST', `/groups/${groupId}/expenses`, req);
  }

  async deleteExpense(groupId: string, expenseId: string): Promise<void> {
    if (this.isMock()) {
      const success = mockDb.deleteExpense(groupId, expenseId, CURRENT_USER);
      if (!success) throw new Error('Expense not found');
      return;
    }
    return this.fetchHttp<void>('DELETE', `/groups/${groupId}/expenses/${expenseId}`);
  }

  // --- Settlements ---
  async getSettlements(groupId: string): Promise<SettlementDto[]> {
    if (this.isMock()) {
      return mockDb.getSettlements(groupId);
    }
    return this.fetchHttp<SettlementDto[]>('GET', `/groups/${groupId}/settlements`);
  }

  async createSettlement(
    groupId: string,
    req: CreateSettlementRequest
  ): Promise<SettlementDto> {
    if (this.isMock()) {
      return mockDb.createSettlement(groupId, req, CURRENT_USER);
    }
    return this.fetchHttp<SettlementDto>('POST', `/groups/${groupId}/settlements`, req);
  }

  // --- Balances ---
  async getGroupBalances(groupId: string): Promise<GroupBalanceDto[]> {
    if (this.isMock()) {
      const bal = mockDb.getGroupBalance(groupId, 'user_vinoth');
      return bal ? [bal] : [];
    }
    return this.fetchHttp<GroupBalanceDto[]>('GET', `/groups/${groupId}/balances`);
  }

  async getDashboardBalance(): Promise<DashboardBalanceDto> {
    if (this.isMock()) {
      return mockDb.getDashboardBalance('user_vinoth');
    }
    return this.fetchHttp<DashboardBalanceDto>('GET', '/dashboard/balances');
  }

  // --- Activities ---
  async getGroupActivity(groupId: string): Promise<ActivityDto[]> {
    if (this.isMock()) {
      return mockDb.getGroupActivity(groupId);
    }
    return this.fetchHttp<ActivityDto[]>('GET', `/groups/${groupId}/activity`);
  }

  async getDashboardActivity(): Promise<ActivityDto[]> {
    if (this.isMock()) {
      return mockDb.getDashboardActivity('user_vinoth');
    }
    return this.fetchHttp<ActivityDto[]>('GET', '/dashboard/activity');
  }

  // --- Reports ---
  async getGroupReport(groupId: string): Promise<GroupReportDto | null> {
    if (this.isMock()) {
      return mockDb.getGroupReport(groupId);
    }
    try {
      return await this.fetchHttp<GroupReportDto>(
        'GET',
        `/groups/${groupId}/reports/summary`
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }
}
