import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { tw } from '../../../styles/shared.styles';
import type { ExpenseDto } from '../../../models';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import '../../common/sp-empty-state';
import '../../common/sp-badge';
import '../../common/sp-avatar';
import '../../common/sp-button';

const CATEGORY_ICONS: Record<string, string> = {
  food_drink: '🍽️', travel: '✈️', utilities: '💡', entertainment: '🎬', healthcare: '🏥', subscription: '📱', other: '📦',
};

@customElement('sp-expense-list')
export class SpExpenseList extends LitElement {
  @property({ type: Array })  expenses: ExpenseDto[] = [];
  @property({ type: String }) groupId = '';

  @state() private _expanded: string | null = null;
  @state() private _deletingId: string | null = null;

  static styles = [tw, css`:host { display: block; }`];

  render() {
    if (this.expenses.length === 0) {
      return html`
        <sp-empty-state
          icon="💸"
          title="No expenses yet"
          message="Add the first expense for this group."
        ></sp-empty-state>`;
    }

    return html`
      <div class="space-y-3">
        ${repeat(this.expenses, e => e.id, e => this._renderExpense(e))}
      </div>
    `;
  }

  private _renderExpense(expense: ExpenseDto) {
    const isExpanded = this._expanded === expense.id;
    const icon = CATEGORY_ICONS[expense.category] ?? '📦';

    return html`
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden transition-all duration-200 hover:shadow-sm">
        <!-- Main row -->
        <button
          class="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer"
          @click=${() => this._toggleExpand(expense.id)}
        >
          <span class="text-xl shrink-0 select-none">${icon}</span>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">${expense.description}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">${formatDate(expense.expenseDate)}</span>
              <span class="text-slate-200 dark:text-slate-700 select-none">•</span>
              <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">paid by ${expense.payer.displayName}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            ${expense.isFullySettled
              ? html`<sp-badge variant="success" dot>Settled</sp-badge>`
              : html`<sp-badge variant="warning" dot>Unsettled</sp-badge>`}
            <span class="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              ${formatCurrency(expense.amount)}
            </span>
            <svg class="w-4 h-4 text-slate-300 dark:text-slate-600 transition-transform duration-200
              ${isExpanded ? 'rotate-180' : ''}"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </button>

        <!-- Expanded shares -->
        ${isExpanded ? html`
          <div class="border-t border-slate-100 dark:border-slate-700/50 px-5 py-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Split Type · ${expense.splitType}
              </p>
              ${!expense.isFullySettled ? html`
                <sp-button
                  variant="outline"
                  size="sm"
                  class="!w-auto !py-1"
                  ?loading=${this._deletingId === expense.id}
                  @click=${() => this._deleteExpense(expense.id)}
                >
                  <span class="text-red-600 dark:text-red-400 text-xs">Delete Expense</span>
                </sp-button>
              ` : ''}
            </div>

            <div class="space-y-2.5 pt-1">
              ${expense.shares.map(share => html`
                <div class="flex items-center gap-2">
                  <sp-avatar name=${share.member.displayName} userId=${share.member.id} size="xs"></sp-avatar>
                  <span class="flex-1 text-xs text-slate-700 dark:text-slate-300 font-semibold">${share.member.displayName}</span>
                  <span class="text-xs font-bold tabular-nums
                    ${share.isSettled ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'}">
                    ${formatCurrency(share.amount)}
                  </span>
                  ${share.isSettled
                    ? html`<span class="text-[10px] text-green-500 dark:text-green-400 font-semibold">✓ paid</span>`
                    : html`<span class="text-[10px] text-amber-500 dark:text-amber-400 font-semibold">pending</span>`}
                </div>
              `)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private _toggleExpand(id: string) {
    this._expanded = this._expanded === id ? null : id;
  }

  private async _deleteExpense(expenseId: string) {
    if (confirm('Are you sure you want to delete this expense? This cannot be undone.')) {
      this._deletingId = expenseId;
      try {
        this.dispatchEvent(new CustomEvent('expense-deleted', {
          detail: { expenseId },
          bubbles: true,
          composed: true
        }));
      } finally {
        this._deletingId = null;
      }
    }
  }
}
