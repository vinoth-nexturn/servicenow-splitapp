import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../../styles/shared.styles';
import type { GroupBalanceDto } from '../../../models';
import { formatCurrency } from '../../../utils/currency';
import '../../common/sp-card';
import '../../common/sp-avatar';
import '../../common/sp-badge';
import '../../common/sp-empty-state';

@customElement('sp-balance-summary')
export class SpBalanceSummary extends LitElement {
  @property({ type: Object }) balances: GroupBalanceDto | null = null;
  @property({ type: String }) groupId = '';

  static styles = [tw, css`:host { display: block; }`];

  render() {
    if (!this.balances || !this.balances.netBalances || this.balances.netBalances.length === 0) {
      return html`
        <sp-card>
          <sp-empty-state
            icon="🤝"
            title="Everyone is settled up!"
            message="No outstanding balances or debts in this group."
          ></sp-empty-state>
        </sp-card>
      `;
    }

    const { netBalances, myTotalOwed, myTotalOwing, netBalance } = this.balances;

    return html`
      <div class="space-y-5">
        <!-- My Net Overview -->
        <sp-card padding="md" class="bg-slate-50/50 dark:bg-slate-800/20">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Your Status</p>
              <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                ${netBalance > 0.005
                  ? `You are owed a net total of ${formatCurrency(netBalance)}`
                  : netBalance < -0.005
                    ? `You owe a net total of ${formatCurrency(Math.abs(netBalance))}`
                    : 'You are completely settled up in this group'}
              </h4>
            </div>
            <div class="flex gap-4">
              <div class="text-right">
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Owed</span>
                <p class="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">${formatCurrency(myTotalOwed)}</p>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Owing</span>
                <p class="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">${formatCurrency(myTotalOwing)}</p>
              </div>
            </div>
          </div>
        </sp-card>

        <!-- Debt Matrix Grid -->
        <div class="space-y-3">
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider pl-1">
            Outstanding Debts
          </h3>

          <div class="space-y-3">
            ${netBalances.map(debt => html`
              <sp-card padding="sm">
                <div class="flex items-center justify-between gap-3">
                  <!-- Debtor (owes money) -->
                  <div class="flex items-center gap-2.5 flex-1 min-w-0">
                    <sp-avatar name=${debt.fromUser.displayName} userId=${debt.fromUser.id} size="sm"></sp-avatar>
                    <div class="truncate">
                      <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${debt.fromUser.displayName}</p>
                      <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Debtor</p>
                    </div>
                  </div>

                  <!-- Debt Flow arrow and Amount -->
                  <div class="flex flex-col items-center shrink-0 px-2 min-w-28 text-center">
                    <span class="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums">
                      owes ${formatCurrency(debt.amount)}
                    </span>
                    <div class="w-full flex items-center justify-center gap-1 mt-1 text-slate-300 dark:text-slate-700">
                      <div class="h-0.5 w-12 bg-slate-200 dark:bg-slate-700 relative">
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 border-y-[3px] border-y-transparent border-l-[5px] border-l-slate-400 dark:border-l-slate-600"></div>
                      </div>
                    </div>
                  </div>

                  <!-- Creditor (is owed money) -->
                  <div class="flex items-center gap-2.5 flex-1 min-w-0 justify-end text-right">
                    <div class="truncate">
                      <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${debt.toUser.displayName}</p>
                      <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Creditor</p>
                    </div>
                    <sp-avatar name=${debt.toUser.displayName} userId=${debt.toUser.id} size="sm"></sp-avatar>
                  </div>
                </div>
              </sp-card>
            `)}
          </div>
        </div>
      </div>
    `;
  }
}
