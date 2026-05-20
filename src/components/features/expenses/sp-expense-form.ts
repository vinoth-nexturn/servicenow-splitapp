import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tw } from '../../../styles/shared.styles';
import type { GroupMemberDto, SplitType, ExpenseCategory, CreateExpenseRequest, CreateShareRequest } from '../../../models';
import { APP_CONFIG } from '../../../config/app.config';
import '../../common/sp-input';
import '../../common/sp-select';
import '../../common/sp-button';
import '../../common/sp-card';

@customElement('sp-expense-form')
export class SpExpenseForm extends LitElement {
  @property({ type: String }) groupId = '';
  @property({ type: Array }) members: GroupMemberDto[] = [];

  @state() private _description = '';
  @state() private _amount = 0;
  @state() private _expenseDate = new Date().toISOString().substring(0, 10);
  @state() private _payerId = '';
  @state() private _splitType: SplitType = 'equal';
  @state() private _category: ExpenseCategory = 'other';
  @state() private _selectedMembers: Record<string, boolean> = {}; // for equal split selection
  @state() private _splitValues: Record<string, number> = {}; // exact, percentage, shares values
  @state() private _validationError: string | null = null;
  @state() private _submitting = false;

  static styles = [
    tw,
    css`
      :host { display: block; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `
  ];

  override willUpdate(changedProperties: Map<string, any>) {
    if (changedProperties.has('members') && this.members.length > 0) {
      // Default selections
      if (!this._payerId) {
        // default payer is Vinoth if present, else first member
        const vinoth = this.members.find(m => m.userId === 'user_vinoth');
        this._payerId = vinoth ? vinoth.userId : (this.members[0]?.userId || '');
      }

      // Initialize all members to active for equal split
      this.members.forEach(m => {
        if (this._selectedMembers[m.userId] === undefined) {
          this._selectedMembers[m.userId] = true;
        }
        if (this._splitValues[m.userId] === undefined) {
          this._splitValues[m.userId] = 0;
        }
      });
    }
  }

  private get _activeMembers() {
    return this.members.filter(m => m.status === 'active');
  }

  render() {
    const categories = APP_CONFIG.categories.map(c => ({ value: c.value, label: `${c.icon} ${c.label}` }));
    const splitTypes = APP_CONFIG.splitTypes.map(s => ({ value: s.value, label: s.label }));
    const payers = this._activeMembers.map(m => ({ value: m.userId, label: m.user.displayName }));

    const sumValues = Object.entries(this._splitValues)
      .filter(([uid]) => this._activeMembers.some(m => m.userId === uid))
      .reduce((sum, [, val]) => sum + (val || 0), 0);

    let splitStatusText = '';
    let isValidSplit = true;

    if (this._splitType === 'exact') {
      const diff = Number((this._amount - sumValues).toFixed(2));
      isValidSplit = Math.abs(diff) < 0.005;
      splitStatusText = isValidSplit
        ? '✅ Sum matches total amount exactly.'
        : `❌ Sum of shares is $${sumValues.toFixed(2)} (${diff > 0 ? `$${diff.toFixed(2)} remaining` : `$${Math.abs(diff).toFixed(2)} over`})`;
    } else if (this._splitType === 'percentage') {
      const diff = Number((100 - sumValues).toFixed(2));
      isValidSplit = Math.abs(diff) < 0.005;
      splitStatusText = isValidSplit
        ? '✅ Sum is 100%.'
        : `❌ Sum is ${sumValues.toFixed(1)}% (${diff > 0 ? `${diff.toFixed(1)}% remaining` : `${Math.abs(diff).toFixed(1)}% over`})`;
    } else if (this._splitType === 'shares') {
      isValidSplit = sumValues > 0;
      splitStatusText = isValidSplit
        ? `✅ Total units assigned: ${sumValues} shares.`
        : '❌ Please assign at least 1 share unit.';
    } else if (this._splitType === 'equal') {
      const count = Object.values(this._selectedMembers).filter(Boolean).length;
      isValidSplit = count > 0;
      splitStatusText = isValidSplit
        ? `✅ Split equally among ${count} selected members ($${(this._amount / count).toFixed(2)} each).`
        : '❌ Please select at least one member to split.';
    }

    return html`
      <form @submit=${this._handleSubmit} class="space-y-5">
        <!-- Error Banner -->
        ${this._validationError ? html`
          <div class="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs font-semibold text-red-700 dark:text-red-400">
            ${this._validationError}
          </div>
        ` : ''}

        <!-- Details -->
        <sp-input
          label="Description"
          placeholder="e.g. Grocery dinner, taxi"
          required
          .value=${this._description}
          @sp-input=${(e: CustomEvent) => this._description = e.detail.value}
        ></sp-input>

        <div class="grid grid-cols-2 gap-4">
          <sp-input
            label="Amount ($)"
            type="number"
            placeholder="0.00"
            required
            prefix="$"
            .value=${this._amount ? String(this._amount) : ''}
            @sp-input=${this._handleAmountInput}
          ></sp-input>

          <sp-input
            label="Date"
            type="date"
            required
            .value=${this._expenseDate}
            @sp-input=${(e: CustomEvent) => this._expenseDate = e.detail.value}
          ></sp-input>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <sp-select
            label="Category"
            .options=${categories}
            .value=${this._category}
            @sp-change=${(e: CustomEvent) => this._category = e.detail.value as ExpenseCategory}
          ></sp-select>

          <sp-select
            label="Paid By"
            .options=${payers}
            .value=${this._payerId}
            @sp-change=${(e: CustomEvent) => this._payerId = e.detail.value}
          ></sp-select>
        </div>

        <!-- Split Strategy -->
        <sp-select
          label="Split Strategy"
          .options=${splitTypes}
          .value=${this._splitType}
          @sp-change=${this._handleSplitTypeChange}
        ></sp-select>

        <!-- Dynamic Split Strategy Inputs -->
        <div class="border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-3 max-h-60 overflow-y-auto no-scrollbar bg-slate-50/30 dark:bg-slate-800/10">
          <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Configure Splits
          </p>

          <div class="space-y-3 pt-1">
            ${this._activeMembers.map(m => {
              const checked = !!this._selectedMembers[m.userId];
              const value = this._splitValues[m.userId] || 0;

              return html`
                <div class="flex items-center gap-3 justify-between">
                  <div class="flex items-center gap-2">
                    ${this._splitType === 'equal' ? html`
                      <input
                        type="checkbox"
                        .checked=${checked}
                        class="w-4 h-4 text-brand-600 border-slate-300 dark:border-slate-700 rounded focus:ring-brand-500 cursor-pointer"
                        @change=${(e: Event) => this._handleCheckboxChange(m.userId, e)}
                      />
                    ` : ''}
                    <sp-avatar name=${m.user.displayName} userId=${m.userId} size="xs"></sp-avatar>
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-40">${m.user.displayName}</span>
                  </div>

                  <!-- Share inputs depending on Split strategy -->
                  ${this._splitType !== 'equal' ? html`
                    <div class="relative w-28 flex items-center">
                      ${this._splitType === 'exact' ? html`
                        <span class="absolute left-3 text-slate-400 text-xs font-semibold">$</span>
                      ` : ''}
                      <input
                        type="number"
                        step=${this._splitType === 'exact' ? '0.01' : '1'}
                        .value=${value ? String(value) : ''}
                        class="w-full text-right text-xs font-bold border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 dark:text-white
                          ${this._splitType === 'exact' ? 'pl-6 pr-3' : 'pr-6 pl-3'}"
                        placeholder="0"
                        @input=${(e: Event) => this._handleSplitValueInput(m.userId, e)}
                      />
                      ${this._splitType === 'percentage' ? html`
                        <span class="absolute right-3 text-slate-400 text-xs font-semibold">%</span>
                      ` : ''}
                      ${this._splitType === 'shares' ? html`
                        <span class="absolute right-3 text-slate-400 text-xs font-semibold">sh</span>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              `;
            })}
          </div>
        </div>

        <!-- Strategy status validation note -->
        <p class="text-xs font-semibold ${isValidSplit ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}">
          ${splitStatusText}
        </p>

        <!-- Form Actions -->
        <div class="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <sp-button type="button" variant="secondary" @click=${this._onCancel}>Cancel</sp-button>
          <sp-button type="submit" ?loading=${this._submitting} ?disabled=${!isValidSplit}>
            Add Expense
          </sp-button>
        </div>
      </form>
    `;
  }

  private _handleAmountInput(e: CustomEvent) {
    this._amount = parseFloat(e.detail.value) || 0;
    if (this._splitType === 'percentage' || this._splitType === 'shares') {
      // no need to reset
    } else if (this._splitType === 'exact') {
      // Reset values if amount changes so they don't submit mismatched
    }
  }

  private _handleSplitTypeChange(e: CustomEvent) {
    this._splitType = e.detail.value as SplitType;
    this._validationError = null;

    // Reset weights
    this.members.forEach(m => {
      this._splitValues[m.userId] = 0;
    });

    // For percentage, prefill 100/N equally as initial helper
    if (this._splitType === 'percentage') {
      const activeCount = this._activeMembers.length;
      if (activeCount > 0) {
        const val = Number((100 / activeCount).toFixed(2));
        this._activeMembers.forEach((m, idx) => {
          // Last member gets remainder to sum exactly to 100
          if (idx === activeCount - 1) {
            this._splitValues[m.userId] = Number((100 - val * (activeCount - 1)).toFixed(2));
          } else {
            this._splitValues[m.userId] = val;
          }
        });
      }
    } else if (this._splitType === 'shares') {
      // Default to 1 share unit each
      this._activeMembers.forEach(m => {
        this._splitValues[m.userId] = 1;
      });
    }
  }

  private _handleCheckboxChange(userId: string, e: Event) {
    this._selectedMembers = {
      ...this._selectedMembers,
      [userId]: (e.target as HTMLInputElement).checked
    };
  }

  private _handleSplitValueInput(userId: string, e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value) || 0;
    this._splitValues = {
      ...this._splitValues,
      [userId]: val
    };
  }

  private _onCancel() {
    this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
  }

  private async _handleSubmit(e: Event) {
    e.preventDefault();
    if (this._submitting) return;

    this._validationError = null;

    if (!this._description.trim()) {
      this._validationError = 'Please enter an expense description.';
      return;
    }

    if (this._amount <= 0.005) {
      this._validationError = 'Please enter a valid expense amount greater than $0.';
      return;
    }

    // Build the request shares payload
    const shares: CreateShareRequest[] = [];
    if (this._splitType === 'equal') {
      const selectedList = Object.entries(this._selectedMembers).filter(([, sel]) => sel).map(([uid]) => uid);
      if (selectedList.length === 0) {
        this._validationError = 'Please select at least one member to split the expense.';
        return;
      }
      // Payer creates equal share requests
      selectedList.forEach(uid => {
        shares.push({ memberId: uid });
      });
    } else {
      const entries = Object.entries(this._splitValues).filter(([uid]) => this._activeMembers.some(m => m.userId === uid));
      const totalSum = entries.reduce((s, [, val]) => s + val, 0);

      if (this._splitType === 'exact') {
        const diff = Math.abs(this._amount - totalSum);
        if (diff > 0.005) {
          this._validationError = `The sum of exact amounts ($${totalSum.toFixed(2)}) must equal the total expense amount ($${this._amount.toFixed(2)}).`;
          return;
        }
        entries.forEach(([uid, val]) => {
          shares.push({ memberId: uid, amount: val });
        });
      } else if (this._splitType === 'percentage') {
        const diff = Math.abs(100 - totalSum);
        if (diff > 0.005) {
          this._validationError = `The sum of percentages (${totalSum.toFixed(1)}%) must equal 100%.`;
          return;
        }
        entries.forEach(([uid, val]) => {
          shares.push({ memberId: uid, percentage: val });
        });
      } else if (this._splitType === 'shares') {
        if (totalSum <= 0) {
          this._validationError = 'The total units assigned must be greater than 0.';
          return;
        }
        entries.forEach(([uid, val]) => {
          shares.push({ memberId: uid, shareUnits: val });
        });
      }
    }

    this._submitting = true;

    const payload: CreateExpenseRequest = {
      description: this._description.trim(),
      amount: this._amount,
      expenseDate: new Date(this._expenseDate).toISOString(),
      payerId: this._payerId,
      splitType: this._splitType,
      category: this._category,
      shares
    };

    this.dispatchEvent(new CustomEvent('submit-expense', {
      detail: payload,
      bubbles: true,
      composed: true
    }));
  }

  // Reset form helper
  reset() {
    this._description = '';
    this._amount = 0;
    this._expenseDate = new Date().toISOString().substring(0, 10);
    this._splitType = 'equal';
    this._category = 'other';
    this._selectedMembers = {};
    this._splitValues = {};
    this._validationError = null;
    this._submitting = false;

    if (this.members.length > 0) {
      const vinoth = this.members.find(m => m.userId === 'user_vinoth');
      this._payerId = vinoth ? vinoth.userId : this.members[0].userId;

      this.members.forEach(m => {
        this._selectedMembers[m.userId] = true;
        this._splitValues[m.userId] = 0;
      });
    }
  }
}
