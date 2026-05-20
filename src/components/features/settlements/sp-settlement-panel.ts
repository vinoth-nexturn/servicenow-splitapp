import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tw } from '../../../styles/shared.styles';
import type { GroupBalanceDto, CreateSettlementRequest, GroupMemberDto } from '../../../models';
import { formatCurrency } from '../../../utils/currency';
import '../../common/sp-input';
import '../../common/sp-select';
import '../../common/sp-button';
import '../../common/sp-card';
import '../../common/sp-avatar';

@customElement('sp-settlement-panel')
export class SpSettlementPanel extends LitElement {
  @property({ type: String }) groupId = '';
  @property({ type: Object }) balances: GroupBalanceDto | null = null;
  @property({ type: Array }) members: GroupMemberDto[] = [];
  @property({ type: Boolean }) embedded = false;

  @state() private _payerId = '';
  @state() private _payeeId = '';
  @state() private _amount = 0;
  @state() private _paymentDate = new Date().toISOString().substring(0, 10);
  @state() private _validationError: string | null = null;
  @state() private _submitting = false;

  static styles = [tw, css`:host { display: block; }`];

  override willUpdate(changedProperties: Map<string, any>) {
    if (changedProperties.has('members') && this.members.length > 0) {
      const active = this._activeMembers;
      if (!this._payerId && active.length > 0) {
        this._payerId = active[0].userId;
      }
      if (!this._payeeId && active.length > 1) {
        this._payeeId = active[1].userId;
      }
    }
  }

  private get _activeMembers() {
    return this.members.filter(m => m.status === 'active');
  }

  render() {
    const active = this._activeMembers;
    const payerOptions = active.map(m => ({ value: m.userId, label: m.user.displayName }));
    const payeeOptions = active
      .filter(m => m.userId !== this._payerId)
      .map(m => ({ value: m.userId, label: m.user.displayName }));

    const suggestions = this.balances?.netBalances || [];

    return html`
      <div class="space-y-5">
        <!-- Error Banner -->
        ${this._validationError ? html`
          <div class="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs font-semibold text-red-700 dark:text-red-400">
            ${this._validationError}
          </div>
        ` : ''}

        <!-- Suggestions Section -->
        ${suggestions.length > 0 ? html`
          <div class="space-y-2.5">
            <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
              Quick Settle Suggestions
            </p>
            <div class="grid grid-cols-1 gap-2.5">
              ${suggestions.map(s => html`
                <div
                  class="flex items-center justify-between p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60 hover:border-brand-300 dark:hover:border-brand-500 bg-white dark:bg-slate-800 transition-all cursor-pointer"
                  @click=${() => this._applySuggestion(s.fromUser.id, s.toUser.id, s.amount)}
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <sp-avatar name=${s.fromUser.displayName} userId=${s.fromUser.id} size="xs"></sp-avatar>
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-28">${s.fromUser.displayName}</span>
                    <span class="text-slate-300 dark:text-slate-600 font-bold">➜</span>
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-28">${s.toUser.displayName}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-brand-600 dark:text-brand-400 tabular-nums">${formatCurrency(s.amount)}</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full select-none">
                      Settle
                    </span>
                  </div>
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        <!-- Manual Form -->
        <form @submit=${this._handleSubmit} class="space-y-4 pt-1">
          <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
            Manual Settlement
          </p>

          <div class="grid grid-cols-2 gap-4">
            <sp-select
              label="Payer (Who Paid)"
              .options=${payerOptions}
              .value=${this._payerId}
              @sp-change=${this._handlePayerChange}
            ></sp-select>

            <sp-select
              label="Payee (Who Received)"
              .options=${payeeOptions}
              .value=${this._payeeId}
              @sp-change=${(e: CustomEvent) => this._payeeId = e.detail.value}
            ></sp-select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <sp-input
              label="Amount ($)"
              type="number"
              placeholder="0.00"
              required
              prefix="$"
              .value=${this._amount ? String(this._amount) : ''}
              @sp-input=${(e: CustomEvent) => this._amount = parseFloat(e.detail.value) || 0}
            ></sp-input>

            <sp-input
              label="Date"
              type="date"
              required
              .value=${this._paymentDate}
              @sp-input=${(e: CustomEvent) => this._paymentDate = e.detail.value}
            ></sp-input>
          </div>

          ${!this.embedded ? html`
            <div class="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <sp-button type="button" variant="secondary" @click=${this._onCancel}>Cancel</sp-button>
              <sp-button type="submit" ?loading=${this._submitting} ?disabled=${this._amount <= 0}>
                Record Settlement
              </sp-button>
            </div>
          ` : ''}
        </form>
      </div>
    `;
  }

  private _handlePayerChange(e: CustomEvent) {
    this._payerId = e.detail.value;
    // Auto-update payee if it overlaps
    if (this._payeeId === this._payerId) {
      const active = this._activeMembers.filter(m => m.userId !== this._payerId);
      this._payeeId = active.length > 0 ? active[0].userId : '';
    }
  }

  private _applySuggestion(fromUserId: string, toUserId: string, amount: number) {
    this._payerId = fromUserId;
    this._payeeId = toUserId;
    this._amount = amount;
    this._validationError = null;
  }

  private _onCancel() {
    this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
  }

  private async _handleSubmit(e: Event) {
    e.preventDefault();
    if (this._submitting) return;

    this._validationError = null;

    if (!this._payerId || !this._payeeId) {
      this._validationError = 'Please select both a payer and payee.';
      return;
    }

    if (this._payerId === this._payeeId) {
      this._validationError = 'Payer and payee cannot be the same member.';
      return;
    }

    if (this._amount <= 0.005) {
      this._validationError = 'Please enter an amount greater than $0.';
      return;
    }

    this._submitting = true;

    const payload: CreateSettlementRequest = {
      payerId: this._payerId,
      payeeId: this._payeeId,
      amount: this._amount,
      settlementDate: new Date(this._paymentDate).toISOString()
    };

    this.dispatchEvent(new CustomEvent('submit-settlement', {
      detail: payload,
      bubbles: true,
      composed: true
    }));
  }

  reset() {
    this._amount = 0;
    this._paymentDate = new Date().toISOString().substring(0, 10);
    this._validationError = null;
    this._submitting = false;

    const active = this._activeMembers;
    if (active.length > 0) {
      this._payerId = active[0].userId;
    }
    if (active.length > 1) {
      this._payeeId = active[1].userId;
    }
  }
}
