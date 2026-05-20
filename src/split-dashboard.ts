import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { tw } from './styles/shared.styles';
import { appContext, type AppState, type AppRoute, createToast, initialAppState } from './services/state/app.context';
import { ApiClientService } from './services/api/api-client.service';
import type { SpGroupView } from './components/features/groups/sp-group-view';

import './components/layout/sp-nav-rail';
import './components/layout/sp-topbar';
import './components/common/sp-toast';
import './components/common/sp-modal';
import './components/common/sp-input';
import './components/common/sp-button';
import './components/features/dashboard/sp-dashboard-view';
import './components/features/groups/sp-group-view';
import './components/features/reports/sp-reports-view';

@customElement('split-dashboard')
export class SplitDashboard extends LitElement {
  @property({ type: String, attribute: 'base-url' }) baseUrl = '';

  @provide({ context: appContext })
  @state() private _appState: AppState = initialAppState;

  // New Group Modal State
  @state() private _showNewGroupModal = false;
  @state() private _newGroupName = '';
  @state() private _newGroupDesc = '';
  @state() private _creatingGroup = false;
  @state() private _newGroupError = '';

  private _apiClient!: ApiClientService;

  @query('sp-group-view') private _groupViewEl?: SpGroupView;

  static styles = [
    tw,
    css`
      :host {
        display: flex;
        height: 100vh;
        width: 100%;
        overflow: hidden;
        background: #f8fafc;
      }
      @media (prefers-color-scheme: dark) {
        :host {
          background: #0f172a;
        }
      }
      .main {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
        min-width: 0;
      }
      .content {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }
    `,
  ];

  override connectedCallback() {
    super.connectedCallback();
    this._initializeClient();

    // Check system preference for dark mode
    const storedTheme = localStorage.getItem('split-app-dark-mode');
    if (storedTheme === 'true' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Register global shell event listeners
    this.addEventListener('navigate', this._onNavigate as any);
    this.addEventListener('new-group', this._onNewGroup as any);
    this.addEventListener('load-group', this._onLoadGroup as any);
    this.addEventListener('create-expense', this._onCreateExpense as any);
    this.addEventListener('delete-expense', this._onDeleteExpense as any);
    this.addEventListener('create-settlement', this._onCreateSettlement as any);
    this.addEventListener('add-group-member', this._onAddGroupMember as any);
    this.addEventListener('toast-dismiss', this._onToastDismiss as any);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('navigate', this._onNavigate as any);
    this.removeEventListener('new-group', this._onNewGroup as any);
    this.removeEventListener('load-group', this._onLoadGroup as any);
    this.removeEventListener('create-expense', this._onCreateExpense as any);
    this.removeEventListener('delete-expense', this._onDeleteExpense as any);
    this.removeEventListener('create-settlement', this._onCreateSettlement as any);
    this.removeEventListener('add-group-member', this._onAddGroupMember as any);
    this.removeEventListener('toast-dismiss', this._onToastDismiss as any);
  }

  override updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('baseUrl')) {
      this._initializeClient();
    }
  }

  private _initializeClient() {
    console.log(`🔌 Initializing API Client with base URL: "${this.baseUrl || 'LOCAL MOCK DATABASE'}"`);
    this._apiClient = new ApiClientService(this.baseUrl);
    this._initApp();
  }

  private async _initApp() {
    this._appState = { ...this._appState, isInitializing: true, initError: null };
    try {
      const currentUser = await this._apiClient.getCurrentUser();
      const groupsRes = await this._apiClient.getGroups();
      const groups = groupsRes.data || [];
      const balanceRes = await this._apiClient.getDashboardBalance();
      const dashboardBalance = balanceRes.data || { totalOwed: 0, totalOwing: 0, netBalance: 0, currency: 'USD', groupBreakdown: [], updatedAt: new Date().toISOString() };
      const activityRes = await this._apiClient.getDashboardActivity();
      const recentActivity = activityRes.data || [];

      this._appState = {
        ...this._appState,
        currentUser,
        groups,
        dashboardBalance,
        recentActivity,
        isInitializing: false,
      };
    } catch (err: any) {
      console.error('Initialization error:', err);
      this._appState = {
        ...this._appState,
        isInitializing: false,
        initError: err?.message || 'Failed to initialize application'
      };
      this._pushToast('error', 'App initialization failed. Please reload.');
    }
  }

  render() {
    const state = this._appState;
    if (state.isInitializing) {
      return html`
        <div class="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-3">
          <sp-loader size="lg"></sp-loader>
          <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading SplitApp workspace...</p>
        </div>
      `;
    }

    const activeGroup = state.route.name === 'group'
      ? state.groups.find(g => g.id === (state.route as { groupId: string }).groupId)
      : undefined;

    return html`
      <sp-nav-rail
        .route=${state.route}
        .groups=${state.groups}
      ></sp-nav-rail>

      <div class="main">
        <sp-topbar
          .route=${state.route}
          .currentUser=${state.currentUser}
          groupName=${activeGroup?.name ?? ''}
        ></sp-topbar>

        <div class="content">
          ${this._renderRoute(state.route)}
        </div>
      </div>

      <sp-toast-container
        .toasts=${state.toasts}
      ></sp-toast-container>

      <!-- New Group Modal -->
      <sp-modal
        title="Create New Group"
        size="sm"
        ?open=${this._showNewGroupModal}
        @close=${this._closeNewGroupModal}
      >
        <div class="space-y-4">
          ${this._newGroupError ? html`
            <div class="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs font-semibold text-red-700 dark:text-red-400">
              ${this._newGroupError}
            </div>
          ` : ''}

          <sp-input
            label="Group Name"
            placeholder="e.g. Flatmates 2026, Goa Trip"
            required
            .value=${this._newGroupName}
            @sp-input=${(e: CustomEvent) => this._newGroupName = e.detail.value}
          ></sp-input>

          <sp-input
            label="Description (Optional)"
            placeholder="e.g. Share bills and groceries"
            .value=${this._newGroupDesc}
            @sp-input=${(e: CustomEvent) => this._newGroupDesc = e.detail.value}
          ></sp-input>
        </div>

        <div slot="footer-actions" class="flex gap-2.5">
          <sp-button variant="secondary" size="sm" @click=${this._closeNewGroupModal}>Cancel</sp-button>
          <sp-button size="sm" ?loading=${this._creatingGroup} @click=${this._onCreateGroupSubmit}>Create Group</sp-button>
        </div>
      </sp-modal>
    `;
  }

  private _renderRoute(route: AppRoute) {
    switch (route.name) {
      case 'dashboard':
        return html`<sp-dashboard-view></sp-dashboard-view>`;
      case 'group':
        return html`<sp-group-view .groupId=${route.groupId}></sp-group-view>`;
      case 'reports':
        return html`<sp-reports-view></sp-reports-view>`;
      case 'settings':
        return html`
          <div class="max-w-md mx-auto py-10 space-y-6">
            <h2 class="text-lg font-bold text-slate-800 dark:text-white">Settings</h2>
            <sp-card padding="md">
              <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300">About SplitApp Scoped ServiceNow App</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                This scoped application facilitates collaborative expense splitting, model checks, and settlement routing. Built with Lit 3.x, TypeScript, and TailwindCSS.
              </p>
              <div class="pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-4 flex justify-between text-xs text-slate-400">
                <span>Version</span>
                <span class="font-bold">1.0.0</span>
              </div>
            </sp-card>
          </div>
        `;
      default:
        return html`<sp-dashboard-view></sp-dashboard-view>`;
    }
  }

  // --- Router & Nav Handlers ---
  private _onNavigate(e: CustomEvent<{ route: AppRoute }>) {
    this._appState = {
      ...this._appState,
      route: e.detail.route
    };
  }

  private _onNewGroup() {
    this._showNewGroupModal = true;
  }

  private _closeNewGroupModal() {
    this._showNewGroupModal = false;
    this._newGroupName = '';
    this._newGroupDesc = '';
    this._newGroupError = '';
    this._creatingGroup = false;
  }

  private async _onCreateGroupSubmit() {
    if (!this._newGroupName.trim()) {
      this._newGroupError = 'Please enter a group name.';
      return;
    }
    this._newGroupError = '';
    this._creatingGroup = true;
    try {
      const groupRes = await this._apiClient.createGroup({ name: this._newGroupName.trim(), description: this._newGroupDesc.trim() });
      const g = groupRes.data;
      if (!g) throw new Error(groupRes.errors?.[0]?.message || 'Failed to create group');

      this._pushToast('success', `Group "${g.name}" created successfully!`);
      this._closeNewGroupModal();

      // Refresh list and navigate
      await this._refreshBaseData();
      this._appState = {
        ...this._appState,
        route: { name: 'group', groupId: g.id }
      };
    } catch (err: any) {
      this._newGroupError = err?.message || 'Failed to create group.';
    } finally {
      this._creatingGroup = false;
    }
  }

  private async _onLoadGroup(e: CustomEvent<{ groupId: string }>) {
    const { groupId } = e.detail;
    const originalTarget = e.composedPath?.()?.[0] || e.target;
    const targetView = (originalTarget === this ? this._groupViewEl : originalTarget) as any;
    try {
      const groupRes = await this._apiClient.getGroup(groupId);
      const group = groupRes.data;
      if (!group) throw new Error(groupRes.errors?.[0]?.message || 'Group not found');

      const expensesRes = await this._apiClient.getExpenses(groupId);
      const expenses = expensesRes.data || [];

      const balancesRes = await this._apiClient.getGroupBalance(groupId);
      const balances = balancesRes.data;
      if (!balances) throw new Error(balancesRes.errors?.[0]?.message || 'Balances not found');

      if (targetView && targetView.groupId === groupId && typeof targetView.setGroupData === 'function') {
        targetView.setGroupData(group, expenses, balances);
      }
    } catch (err: any) {
      console.error('Error loading group:', err);
      if (targetView && targetView.groupId === groupId && typeof targetView.setError === 'function') {
        targetView.setError(err?.message || 'Failed to load group details.');
      }
    }
  }

  private async _onCreateExpense(e: CustomEvent<any>) {
    const payload = e.detail;
    const route = this._appState.route;
    if (route.name !== 'group') return;

    try {
      await this._apiClient.createExpense(route.groupId, payload);
      this._pushToast('success', 'Expense added successfully.');
      await this._refreshAll();
    } catch (err: any) {
      this._pushToast('error', err?.message || 'Failed to add expense.');
    }
  }

  private async _onDeleteExpense(e: CustomEvent<{ expenseId: string }>) {
    const { expenseId } = e.detail;
    const route = this._appState.route;
    if (route.name !== 'group') return;
    try {
      const res = await this._apiClient.deleteExpense(route.groupId, expenseId);
      if (!res.success) throw new Error(res.errors?.[0]?.message || 'Failed to delete expense');
      this._pushToast('success', 'Expense deleted.');
      await this._refreshAll();
    } catch (err: any) {
      this._pushToast('error', err?.message || 'Failed to delete expense.');
    }
  }

  private async _onCreateSettlement(e: CustomEvent<any>) {
    const payload = e.detail;
    const route = this._appState.route;
    if (route.name !== 'group') return;

    try {
      const res = await this._apiClient.createSettlement(route.groupId, payload);
      if (!res.success) throw new Error(res.errors?.[0]?.message || 'Failed to record settlement');
      this._pushToast('success', 'Settlement recorded.');
      await this._refreshAll();
    } catch (err: any) {
      this._pushToast('error', err?.message || 'Failed to record settlement.');
    }
  }

  private async _onAddGroupMember(e: CustomEvent<{ groupId: string; email: string; role: string }>) {
    const { groupId, email, role } = e.detail;
    const originalTarget = e.composedPath?.()?.[0] || e.target;
    const targetView = (originalTarget === this ? this._groupViewEl : originalTarget) as any;
    try {
      // Map email to mock user ID
      let userId = '';
      if (email.includes('vivek')) userId = 'user_vivek';
      else if (email.includes('priya')) userId = 'user_priya';
      else if (email.includes('aanchal')) userId = 'user_aanchal';
      else if (email.includes('vinoth')) userId = 'user_vinoth';
      else if (email.includes('pavan')) userId = 'user_pavan';
      else if (email.includes('ananya')) userId = 'user_ananya';
      else if (email.includes('rahul')) userId = 'user_rahul';
      else {
        // Fallback for demo simulation
        userId = 'user_rahul';
      }

      const res = await this._apiClient.addMember(groupId, { userId, role: role as any });
      if (!res.success) throw new Error(res.errors?.[0]?.message || 'Failed to add group member');

      this._pushToast('success', `Added member successfully.`);
      if (targetView && typeof targetView.handleAddMemberResponse === 'function') {
        targetView.handleAddMemberResponse(true);
      }
      await this._refreshAll();
    } catch (err: any) {
      if (targetView && typeof targetView.handleAddMemberResponse === 'function') {
        targetView.handleAddMemberResponse(false, err?.message || 'Failed to add group member.');
      }
    }
  }

  // --- Helper state refreshes ---
  private async _refreshBaseData() {
    const groupsRes = await this._apiClient.getGroups();
    const groups = groupsRes.data || [];
    const balanceRes = await this._apiClient.getDashboardBalance();
    const dashboardBalance = balanceRes.data || { totalOwed: 0, totalOwing: 0, netBalance: 0, currency: 'USD', groupBreakdown: [], updatedAt: new Date().toISOString() };
    const activityRes = await this._apiClient.getDashboardActivity();
    const recentActivity = activityRes.data || [];
    this._appState = {
      ...this._appState,
      groups,
      dashboardBalance,
      recentActivity
    };
  }

  private async _refreshAll() {
    await this._refreshBaseData();
    const route = this._appState.route;
    if (route.name === 'group') {
      // Re-trigger load event to populate group detail sub-views
      this._onLoadGroup(new CustomEvent('load-group', { detail: { groupId: route.groupId } }));
    }
  }

  // --- Toast Manager ---
  private _pushToast(type: AppState['toasts'][0]['type'], message: string) {
    const toast = createToast(type, message);
    this._appState = {
      ...this._appState,
      toasts: [...this._appState.toasts, toast]
    };
    // Auto dismiss
    setTimeout(() => {
      this._dismissToast(toast.id);
    }, toast.duration || 4000);
  }

  private _onToastDismiss(e: CustomEvent<{ id: string }>) {
    this._dismissToast(e.detail.id);
  }

  private _dismissToast(id: string) {
    this._appState = {
      ...this._appState,
      toasts: this._appState.toasts.filter(t => t.id !== id)
    };
  }
}
