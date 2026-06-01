import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { tw } from './styles/shared.styles';
import { groupContext, expenseContext, settlementContext, uiContext } from './contexts';
import type { GroupStateType, ExpenseStateType, SettlementStateType, UIStateType } from './contexts';
import type { GroupSummaryDto } from './models';
import { ApiClientService } from './services/api/api-client.service';
import { initializeServices, serviceRegistry } from './services/init';
import './components/layout/sp-nav-rail';
import './components/layout/sp-topbar';
import './components/features/dashboard/sp-dashboard-view';
import './components/features/groups/sp-group-view';
import './components/features/reports/sp-reports-view';
import './components/common/sp-toast';
import './components/modals/sp-new-group-modal';

@customElement('split-dashboard-lit')
export class SplitDashboard extends LitElement {
  @property({ type: String, attribute: 'base-url' }) baseUrl = '';
  @state() private route: 'dashboard' | 'groups' | 'reports' = 'dashboard';

  // State providers
  @provide({ context: groupContext })
  @state() groupState!: GroupStateType;

  @provide({ context: expenseContext })
  @state() expenseState!: ExpenseStateType;

  @provide({ context: settlementContext })
  @state() settlementState!: SettlementStateType;

  @provide({ context: uiContext })
  @state() uiState!: UIStateType;

  private apiClient!: ApiClientService;

  static styles = [
    tw,
    css`
      :host {
        --color-brand: var(--color-brand, #0073cf);
        --color-brand-dark: var(--color-brand-dark, #0052a3);
        --color-text: var(--color-text, #171717);
        --color-text-light: var(--color-text-light, #595959);
        --color-background: var(--color-background, #f8fafc);
        --color-border: var(--color-border, #e2e8f0);
        --space-xs: var(--space-xs, 4px);
        --space-sm: var(--space-sm, 8px);
        --space-md: var(--space-md, 16px);
        --space-lg: var(--space-lg, 24px);

        display: flex;
        height: 100vh;
        width: 100%;
        overflow: hidden;
        background: var(--color-background);
      }
      main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .content {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.initializeApp();
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    if (changedProperties.has('baseUrl') && this.apiClient) {
      this.apiClient.setBaseUrl(this.baseUrl);
    }
  }

  private async initializeApp() {
    try {
      this.apiClient = new ApiClientService(this.baseUrl);
      initializeServices(this.apiClient);

      this.initializeGroupState();
      this.initializeExpenseState();
      this.initializeSettlementState();
      this.initializeUIState();

      await this.refreshData();
    } catch (error) {
      console.error('Failed to initialize app', error);
      this._notifyError('Failed to initialize app');
    }
  }

  private initializeGroupState(): void {
    this.groupState = {
      groups: [],
      selectedGroupId: null,
      groupDetails: null,
      dashboardBalance: null,
      recentActivity: [],
      isLoading: false,
      error: null,
      refresh: async () => {
        this.groupState = { ...this.groupState, isLoading: true };
        try {
          const [groups, balance, activity] = await Promise.all([
            serviceRegistry.group.getAll(),
            serviceRegistry.balance.getDashboardBalance(),
            this.apiClient.getDashboardActivity(),
          ]);
          this.groupState = {
            ...this.groupState,
            groups,
            dashboardBalance: balance,
            recentActivity: activity,
            isLoading: false,
          };
        } catch (error: any) {
          this.groupState = { ...this.groupState, error: error.message, isLoading: false };
          this.uiState.addToast(error.message || 'Failed to refresh group list.', 'error');
          this._notifyError(error.message || 'Failed to refresh group list.');
        }
      },
      selectGroup: async (id: string) => {
        this.groupState = { ...this.groupState, selectedGroupId: id, isLoading: true };
        try {
          const group = await serviceRegistry.group.getById(id);
          this.groupState = {
            ...this.groupState,
            groupDetails: group,
            isLoading: false,
          };
          this.expenseState = { ...this.expenseState, groupId: id };
          this.settlementState = { ...this.settlementState, groupId: id };
          await Promise.all([
            this.expenseState.refresh(),
            this.settlementState.refresh(),
          ]);
        } catch (error: any) {
          this.groupState = { ...this.groupState, error: error.message, isLoading: false };
          this.uiState.addToast(error.message || 'Failed to select group.', 'error');
          this._notifyError(error.message || 'Failed to select group.');
        }
      },
      createGroup: async (req) => {
        this.groupState = { ...this.groupState, isLoading: true };
        try {
          const group = await serviceRegistry.group.create(req);
          const summary: GroupSummaryDto = {
            id: group.id,
            name: group.name,
            baseCurrency: group.baseCurrency,
            memberCount: group.memberCount,
            myBalance: group.myBalance,
            myRole: group.myRole,
            isArchived: group.isArchived,
            lastActivityAt: group.updatedAt || group.createdAt || new Date().toISOString(),
            imageUrl: group.imageUrl,
          };
          this.groupState = {
            ...this.groupState,
            groups: [...this.groupState.groups, summary],
            isLoading: false,
          };
          this.uiState.addToast('Group created successfully.', 'success');
          this._notifyAction('create-group', group);
          await this.groupState.refresh();
        } catch (error: any) {
          this.groupState = { ...this.groupState, isLoading: false };
          this.uiState.addToast(error.message || 'Failed to create group.', 'error');
          this._notifyError(error.message || 'Failed to create group.');
          throw error;
        }
      },
      deleteGroup: async (id: string) => {
        this.groupState = { ...this.groupState, isLoading: true };
        try {
          await this.apiClient.archiveGroup(id);
          this.groupState = {
            ...this.groupState,
            groups: this.groupState.groups.filter((g) => g.id !== id),
            isLoading: false,
          };
          this.uiState.addToast('Group archived successfully.', 'success');
          this._notifyAction('delete-group', { id });
          await this.groupState.refresh();
        } catch (error: any) {
          this.groupState = { ...this.groupState, isLoading: false };
          this.uiState.addToast(error.message || 'Failed to archive group.', 'error');
          this._notifyError(error.message || 'Failed to archive group.');
          throw error;
        }
      },
      addMember: async (email: string, role: string) => {
        if (!this.groupState.selectedGroupId) return;
        const groupId = this.groupState.selectedGroupId;
        this.groupState = { ...this.groupState, isLoading: true };
        try {
          let userId = '';
          const emailLower = email.toLowerCase();
          if (emailLower.includes('vivek')) userId = 'user_vivek';
          else if (emailLower.includes('priya')) userId = 'user_priya';
          else if (emailLower.includes('aanchal')) userId = 'user_aanchal';
          else if (emailLower.includes('vinoth')) userId = 'user_vinoth';
          else if (emailLower.includes('pavan')) userId = 'user_pavan';
          else if (emailLower.includes('ananya')) userId = 'user_ananya';
          else if (emailLower.includes('rahul')) userId = 'user_rahul';
          else userId = 'user_rahul';

          await serviceRegistry.group.addMember(groupId, { userId, role: role as any });
          this.uiState.addToast('Member added successfully.', 'success');
          this._notifyAction('add-member', { groupId, email, role });
          
          // Refresh group details to reflect the new member
          const group = await serviceRegistry.group.getById(groupId);
          this.groupState = {
            ...this.groupState,
            groupDetails: group,
            isLoading: false
          };
        } catch (error: any) {
          this.groupState = { ...this.groupState, isLoading: false };
          this.uiState.addToast(error.message || 'Failed to add member.', 'error');
          this._notifyError(error.message || 'Failed to add member.');
          throw error;
        }
      }
    };
  }

  private initializeExpenseState(): void {
    this.expenseState = {
      expenses: [],
      selectedExpenseId: null,
      isLoading: false,
      error: null,
      groupId: null,
      refresh: async () => {
        const groupId = this.expenseState.groupId;
        if (!groupId) return;
        this.expenseState = { ...this.expenseState, isLoading: true };
        try {
          const expenses = await serviceRegistry.expense.getByGroup(groupId);
          this.expenseState = { ...this.expenseState, expenses, isLoading: false };
        } catch (error: any) {
          this.expenseState = { ...this.expenseState, error: error.message, isLoading: false };
          this.uiState.addToast(error.message || 'Failed to load expenses.', 'error');
          this._notifyError(error.message || 'Failed to load expenses.');
        }
      },
      createExpense: async (req) => {
        if (!this.expenseState.groupId) return;
        const currentGroupId = this.expenseState.groupId;
        this.expenseState = { ...this.expenseState, isLoading: true };
        try {
          const expense = await serviceRegistry.expense.create(
            currentGroupId,
            req
          );
          this.expenseState = {
            ...this.expenseState,
            expenses: [...this.expenseState.expenses, expense],
            isLoading: false,
          };
          this.uiState.addToast('Expense added successfully.', 'success');
          this._notifyAction('create-expense', expense);
          
          await Promise.all([
            this.groupState.selectGroup(currentGroupId),
            this.settlementState.refresh(),
            this.groupState.refresh(),
          ]);
        } catch (error: any) {
          this.expenseState = { ...this.expenseState, isLoading: false };
          this.uiState.addToast(error.message || 'Failed to add expense.', 'error');
          this._notifyError(error.message || 'Failed to add expense.');
          throw error;
        }
      },
      deleteExpense: async (id: string) => {
        if (!this.expenseState.groupId) return;
        const currentGroupId = this.expenseState.groupId;
        this.expenseState = { ...this.expenseState, isLoading: true };
        try {
          await serviceRegistry.expense.delete(currentGroupId, id);
          this.expenseState = {
            ...this.expenseState,
            expenses: this.expenseState.expenses.filter((e) => e.id !== id),
            isLoading: false,
          };
          this.uiState.addToast('Expense deleted successfully.', 'success');
          this._notifyAction('delete-expense', { id });
          
          await Promise.all([
            this.groupState.selectGroup(currentGroupId),
            this.settlementState.refresh(),
            this.groupState.refresh(),
          ]);
        } catch (error: any) {
          this.expenseState = { ...this.expenseState, isLoading: false };
          this.uiState.addToast(error.message || 'Failed to delete expense.', 'error');
          this._notifyError(error.message || 'Failed to delete expense.');
          throw error;
        }
      },
    };
  }

  private initializeSettlementState(): void {
    this.settlementState = {
      settlements: [],
      balances: null,
      isLoading: false,
      error: null,
      groupId: null,
      refresh: async () => {
        const groupId = this.settlementState.groupId;
        if (!groupId) return;
        this.settlementState = { ...this.settlementState, isLoading: true };
        try {
          const [settlements, groupBalances] = await Promise.all([
            serviceRegistry.settlement.getByGroup(groupId),
            this.apiClient.getGroupBalances(groupId),
          ]);
          this.settlementState = {
            ...this.settlementState,
            settlements,
            balances: groupBalances[0] || null,
            isLoading: false,
          };
        } catch (error: any) {
          this.settlementState = { ...this.settlementState, error: error.message, isLoading: false };
          this.uiState.addToast(error.message || 'Failed to load settlements.', 'error');
          this._notifyError(error.message || 'Failed to load settlements.');
        }
      },
      recordSettlement: async (req) => {
        if (!this.settlementState.groupId) return;
        const currentGroupId = this.settlementState.groupId;
        this.settlementState = { ...this.settlementState, isLoading: true };
        try {
          const settlement = await serviceRegistry.settlement.create(
            currentGroupId,
            req
          );
          this.settlementState = {
            ...this.settlementState,
            settlements: [...this.settlementState.settlements, settlement],
            isLoading: false,
          };
          this.uiState.addToast('Settlement recorded successfully.', 'success');
          this._notifyAction('record-settlement', settlement);
          
          await Promise.all([
            this.groupState.selectGroup(currentGroupId),
            this.settlementState.refresh(),
            this.groupState.refresh(),
          ]);
        } catch (error: any) {
          this.settlementState = { ...this.settlementState, isLoading: false };
          this.uiState.addToast(error.message || 'Failed to record settlement.', 'error');
          this._notifyError(error.message || 'Failed to record settlement.');
          throw error;
        }
      },
    };
  }

  private initializeUIState(): void {
    this.uiState = {
      isLoading: false,
      showNewGroupModal: false,
      showNewExpenseModal: false,
      showSettlementModal: false,
      toasts: [],
      setLoading: (value: boolean) => {
        this.uiState = { ...this.uiState, isLoading: value };
      },
      openNewGroupModal: () => {
        this.uiState = { ...this.uiState, showNewGroupModal: true };
      },
      closeNewGroupModal: () => {
        this.uiState = { ...this.uiState, showNewGroupModal: false };
      },
      openNewExpenseModal: () => {
        this.uiState = { ...this.uiState, showNewExpenseModal: true };
      },
      closeNewExpenseModal: () => {
        this.uiState = { ...this.uiState, showNewExpenseModal: false };
      },
      openSettlementModal: () => {
        this.uiState = { ...this.uiState, showSettlementModal: true };
      },
      closeSettlementModal: () => {
        this.uiState = { ...this.uiState, showSettlementModal: false };
      },
      addToast: (msg: string, type, duration = 3000) => {
        const id = `toast_${Date.now()}`;
        this.uiState = {
          ...this.uiState,
          toasts: [...this.uiState.toasts, { id, message: msg, type }],
        };
        if (duration > 0) {
          setTimeout(() => this.uiState.removeToast(id), duration);
        }
      },
      removeToast: (id: string) => {
        this.uiState = {
          ...this.uiState,
          toasts: this.uiState.toasts.filter((t) => t.id !== id),
        };
      },
    };
  }

  private async refreshData() {
    await this.groupState.refresh();
  }

  private _handleNavigate(e: CustomEvent<{ route: { name: string; groupId?: string } }>) {
    const { name, groupId } = e.detail.route;
    this._notifyAction('navigate', e.detail.route);
    
    if (name === 'group' && groupId) {
      this.route = 'groups';
      this.groupState.selectGroup(groupId);
    } else if (name === 'dashboard') {
      this.route = 'dashboard';
      this.groupState.refresh();
    } else if (name === 'reports') {
      this.route = 'reports';
      this.groupState.refresh();
    }
  }

  private _handleNewGroup() {
    this.uiState.openNewGroupModal();
  }

  private _notifyError(message: string, code = 'ERROR') {
    this.dispatchEvent(new CustomEvent('app-error', {
      detail: { message, code },
      bubbles: true,
      composed: true,
    }));
  }

  private _notifyAction(action: string, data: any) {
    this.dispatchEvent(new CustomEvent('app-action', {
      detail: { action, data },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const currentRouteObj = this.route === 'groups' && this.groupState.selectedGroupId
      ? { name: 'group' as const, groupId: this.groupState.selectedGroupId }
      : { name: this.route };

    return html`
      <sp-nav-rail
        .route=${currentRouteObj}
        .groups=${this.groupState.groups}
        @navigate=${this._handleNavigate}
        @new-group=${this._handleNewGroup}
      >
      </sp-nav-rail>
      <main>
        <sp-topbar></sp-topbar>
        <div class="content">
          ${this.route === 'dashboard'
            ? html`<sp-dashboard-view @navigate=${this._handleNavigate} @new-group=${this._handleNewGroup}></sp-dashboard-view>`
            : this.route === 'groups'
              ? html`<sp-group-view></sp-group-view>`
              : html`<sp-reports-view></sp-reports-view>`}
        </div>
      </main>

      <sp-toast-container
        .toasts=${this.uiState.toasts}
        @toast-dismiss=${(e: any) => this.uiState.removeToast(e.detail.id)}
      ></sp-toast-container>

      ${this.uiState.showNewGroupModal ? html`
        <sp-new-group-modal @close=${() => this.uiState.closeNewGroupModal()}></sp-new-group-modal>
      ` : ''}
    `;
  }
}

// Register split-dashboard for backward compatibility
if (!customElements.get('split-dashboard')) {
  customElements.define('split-dashboard', class extends SplitDashboard {});
}

declare global {
  interface HTMLElementTagNameMap {
    'split-dashboard-lit': SplitDashboard;
    'split-dashboard': SplitDashboard;
  }
}

