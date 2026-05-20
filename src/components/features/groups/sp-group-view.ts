import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tw } from '../../../styles/shared.styles';
import type { GroupDto, ExpenseDto, GroupBalanceDto } from '../../../models';
import '../../common/sp-tabs';
import '../../common/sp-button';
import '../../common/sp-loader';
import '../../common/sp-empty-state';
import '../../common/sp-skeleton';
import '../../common/sp-modal';
import '../../common/sp-input';
import '../../common/sp-select';
import '../../common/sp-badge';
import '../expenses/sp-expense-list';
import '../expenses/sp-expense-form';
import '../balances/sp-balance-summary';
import '../settlements/sp-settlement-panel';

type GroupTab = 'expenses' | 'balances' | 'settlements' | 'members';

@customElement('sp-group-view')
export class SpGroupView extends LitElement {
  @property({ type: String }) groupId = '';

  @state() private _group: GroupDto | null = null;
  @state() private _expenses: ExpenseDto[] = [];
  @state() private _balances: GroupBalanceDto | null = null;
  @state() private _activeTab: GroupTab = 'expenses';
  @state() private _loading = true;
  @state() private _error: string | null = null;
  @state() private _showExpenseForm = false;
  @state() private _showSettlePanel = false;
  @state() private _showAddMemberModal = false;

  // Add member form state
  @state() private _memberEmail = '';
  @state() private _memberRole = 'member';
  @state() private _addMemberError = '';
  @state() private _addingMember = false;

  static styles = [tw, css`:host { display: block; }`];

  render() {
    if (this._loading) return html`<sp-loader size="lg"></sp-loader>`;
    if (this._error) return html`
      <sp-error-state message=${this._error}>
        <sp-button @click=${this._load} size="sm" variant="secondary" class="mt-2">Retry</sp-button>
      </sp-error-state>`;
    if (!this._group) return html``;

    const tabs = [
      { key: 'expenses',    label: 'Expenses',    count: this._expenses.length },
      { key: 'balances',    label: 'Balances' },
      { key: 'settlements', label: 'Quick Settle' },
      { key: 'members',     label: 'Members',     count: this._group.memberCount },
    ];

    return html`
      <div class="space-y-6">
        <!-- Group Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/10 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center shrink-0 shadow-sm border border-brand-100/50 dark:border-brand-900/20">
              <span class="text-lg font-bold text-brand-700 dark:text-brand-400">${this._group.name[0]?.toUpperCase()}</span>
            </div>
            <div>
              <h1 class="text-lg font-bold text-slate-800 dark:text-white leading-tight">${this._group.name}</h1>
              ${this._group.description
                ? html`<p class="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">${this._group.description}</p>`
                : html`<p class="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">Splitwise Expense Group</p>`}
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <sp-button variant="outline" size="sm" @click=${() => this._showSettlePanel = true}>
              Settle Up
            </sp-button>
            <sp-button size="sm" @click=${() => this._showExpenseForm = true}>
              + Add Expense
            </sp-button>
          </div>
        </div>

        <!-- Tabs -->
        <sp-tabs
          .tabs=${tabs}
          active=${this._activeTab}
          @tab-change=${(e: CustomEvent<{ key: string }>) => this._activeTab = e.detail.key as GroupTab}
        ></sp-tabs>

        <!-- Tab Content -->
        <div class="pt-2">
          ${this._renderTab()}
        </div>

        <!-- Add Expense Modal/Drawer -->
        <sp-modal
          title="Add Expense"
          size="lg"
          ?open=${this._showExpenseForm}
          @close=${() => this._showExpenseForm = false}
        >
          <sp-expense-form
            .groupId=${this.groupId}
            .members=${this._group.members}
            @cancel=${() => this._showExpenseForm = false}
            @submit-expense=${this._onExpenseSubmit}
          ></sp-expense-form>
          <div slot="footer" class="hidden"></div>
        </sp-modal>

        <!-- Settle Up Modal/Drawer -->
        <sp-modal
          title="Record Settlement"
          size="md"
          ?open=${this._showSettlePanel}
          @close=${() => this._showSettlePanel = false}
        >
          <sp-settlement-panel
            .groupId=${this.groupId}
            .balances=${this._balances}
            .members=${this._group.members}
            @cancel=${() => this._showSettlePanel = false}
            @submit-settlement=${this._onSettlementSubmit}
          ></sp-settlement-panel>
          <div slot="footer" class="hidden"></div>
        </sp-modal>

        <!-- Add Member Modal -->
        <sp-modal
          title="Add Group Member"
          size="sm"
          ?open=${this._showAddMemberModal}
          @close=${this._closeAddMemberModal}
        >
          <div class="space-y-4">
            ${this._addMemberError ? html`
              <div class="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs font-semibold text-red-700 dark:text-red-400">
                ${this._addMemberError}
              </div>
            ` : ''}

            <sp-input
              label="Email Address"
              type="email"
              placeholder="friend@example.com"
              required
              .value=${this._memberEmail}
              @sp-input=${(e: CustomEvent) => this._memberEmail = e.detail.value}
            ></sp-input>

            <sp-select
              label="Group Role"
              .options=${[{ value: 'member', label: 'Group Member' }, { value: 'admin', label: 'Group Admin' }]}
              .value=${this._memberRole}
              @sp-change=${(e: CustomEvent) => this._memberRole = e.detail.value}
            ></sp-select>
          </div>

          <div slot="footer-actions" class="flex gap-2">
            <sp-button variant="secondary" size="sm" @click=${this._closeAddMemberModal}>Cancel</sp-button>
            <sp-button size="sm" ?loading=${this._addingMember} @click=${this._onAddMemberSubmit}>Add Member</sp-button>
          </div>
        </sp-modal>
      </div>
    `;
  }

  private _renderTab() {
    switch (this._activeTab) {
      case 'expenses':
        return html`
          <sp-expense-list
            .expenses=${this._expenses}
            .groupId=${this.groupId}
            @expense-deleted=${this._onExpenseDeleted}
          ></sp-expense-list>`;
      case 'balances':
        return html`<sp-balance-summary .balances=${this._balances} .groupId=${this.groupId}></sp-balance-summary>`;
      case 'settlements':
        return html`
          <div class="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/60 p-6">
            <sp-settlement-panel
              .groupId=${this.groupId}
              .balances=${this._balances}
              .members=${this._group?.members || []}
              embedded
              @submit-settlement=${this._onSettlementSubmit}
            ></sp-settlement-panel>
          </div>
        `;
      case 'members':
        return this._renderMembers();
      default:
        return html``;
    }
  }

  private _renderMembers() {
    if (!this._group) return html``;
    return html`
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest pl-1">
            Group Members (${this._group.members.length})
          </h3>
          <sp-button size="sm" class="!w-auto !py-1.5" @click=${() => this._showAddMemberModal = true}>
            + Add Member
          </sp-button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${this._group.members.map(m => html`
            <div class="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 transition-all hover:shadow-sm">
              <sp-avatar name=${m.user.displayName} userId=${m.userId} size="md"></sp-avatar>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">${m.user.displayName}</p>
                <p class="text-xs text-slate-400 dark:text-slate-500 font-semibold truncate">${m.user.email}</p>
              </div>
              <sp-badge variant=${m.role === 'admin' ? 'brand' : 'default'}>${m.role}</sp-badge>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  override async connectedCallback() {
    super.connectedCallback();
  }

  override async updated(changed: Map<string, unknown>) {
    if (changed.has('groupId') && this.groupId) {
      this._activeTab = 'expenses';
      await this._load();
    }
  }

  private async _load() {
    this._loading = true;
    this._error   = null;
    this.dispatchEvent(new CustomEvent('load-group', {
      detail: { groupId: this.groupId },
      bubbles: true, composed: true,
    }));
  }

  /** Called by root when data arrives */
  setGroupData(group: GroupDto, expenses: ExpenseDto[], balances: GroupBalanceDto) {
    this._group    = group;
    this._expenses = expenses;
    this._balances = balances;
    this._loading  = false;
  }

  setError(message: string) {
    this._error   = message;
    this._loading = false;
  }

  private _onExpenseSubmit(e: CustomEvent) {
    this._showExpenseForm = false;
    this.dispatchEvent(new CustomEvent('create-expense', { detail: e.detail, bubbles: true, composed: true }));
  }

  private _onSettlementSubmit(e: CustomEvent) {
    this._showSettlePanel = false;
    this.dispatchEvent(new CustomEvent('create-settlement', { detail: e.detail, bubbles: true, composed: true }));
  }

  private _onExpenseDeleted(e: CustomEvent<{ expenseId: string }>) {
    this.dispatchEvent(new CustomEvent('delete-expense', { detail: e.detail, bubbles: true, composed: true }));
  }

  // Add Member Modal handlers
  private _closeAddMemberModal() {
    this._showAddMemberModal = false;
    this._memberEmail = '';
    this._memberRole = 'member';
    this._addMemberError = '';
    this._addingMember = false;
  }

  private _onAddMemberSubmit() {
    if (!this._memberEmail.trim()) {
      this._addMemberError = 'Please enter an email address.';
      return;
    }
    this._addMemberError = '';
    this._addingMember = true;
    this.dispatchEvent(new CustomEvent('add-group-member', {
      detail: {
        groupId: this.groupId,
        email: this._memberEmail.trim().toLowerCase(),
        role: this._memberRole
      },
      bubbles: true,
      composed: true
    }));
  }

  // API callback for adding member success/fail
  handleAddMemberResponse(success: boolean, message?: string) {
    this._addingMember = false;
    if (success) {
      this._closeAddMemberModal();
    } else {
      this._addMemberError = message || 'Failed to add member.';
    }
  }
}
