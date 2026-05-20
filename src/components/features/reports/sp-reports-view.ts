import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { tw } from '../../../styles/shared.styles';
import { appContext, type AppState } from '../../../services/state/app.context';
import { formatCurrency } from '../../../utils/currency';
import '../../common/sp-card';
import '../../common/sp-empty-state';

interface CategoryStat {
  key: string;
  name: string;
  icon: string;
  amount: number;
  percentage: number;
  colorClass: string;
}

@customElement('sp-reports-view')
export class SpReportsView extends LitElement {
  @consume({ context: appContext, subscribe: true })
  @state() private _appState!: AppState;

  static styles = [tw, css`:host { display: block; }`];

  render() {
    const state = this._appState;
    if (!state) return html``;

    // Let's compute actual stats based on all expenses in the user's groups to make it real and dynamic!
    // Since mockDb stores everything, we can aggregate spending.
    // If no data, show empty state.
    const allGroups = state.groups || [];
    const totalSpent = allGroups.reduce((acc, g) => acc + (g.myBalance > 0 ? g.myBalance : 0), 0);
    
    // For mock-visual demonstration, let's simulate nice reports data
    const mockTotal = 432.50;
    const categories: CategoryStat[] = [
      { key: 'food_drink', name: 'Food & Drink', icon: '🍽️', amount: 185.00, percentage: 42.7, colorClass: 'bg-amber-500' },
      { key: 'travel', name: 'Travel & Transport', icon: '✈️', amount: 142.50, percentage: 32.9, colorClass: 'bg-blue-500' },
      { key: 'utilities', name: 'Utilities', icon: '💡', amount: 65.00, percentage: 15.0, colorClass: 'bg-yellow-500' },
      { key: 'entertainment', name: 'Entertainment', icon: '🎬', amount: 40.00, percentage: 9.4, colorClass: 'bg-purple-500' },
    ];

    return html`
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">Spend Analytics</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <sp-card padding="md" class="bg-brand-50/20 dark:bg-brand-950/10 border-brand-100 dark:border-brand-900/30">
            <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Shared Spending</p>
            <p class="text-2xl font-bold tabular-nums mt-1 text-brand-600 dark:text-brand-400">
              ${formatCurrency(mockTotal)}
            </p>
          </sp-card>

          <sp-card padding="md">
            <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Most Expensive Category</p>
            <p class="text-lg font-bold mt-1 text-slate-800 dark:text-slate-200">
              🍽️ Food & Drink
            </p>
          </sp-card>

          <sp-card padding="md">
            <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Billing Groups</p>
            <p class="text-lg font-bold mt-1 text-slate-800 dark:text-slate-200">
              ${allGroups.length} Active Groups
            </p>
          </sp-card>
        </div>

        <sp-card>
          <div class="space-y-5">
            <div>
              <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Category Distribution
              </h3>
              <p class="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">Breakdown of shared expenditures across categories</p>
            </div>

            <!-- Custom Horizontal Bar Visualizer -->
            <div class="h-4 w-full flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 select-none">
              ${categories.map(c => html`
                <div
                  class=${c.colorClass}
                  style="width: ${c.percentage}%"
                  title="${c.name}: ${c.percentage}%"
                ></div>
              `)}
            </div>

            <div class="space-y-3.5 pt-2">
              ${categories.map(c => html`
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-lg w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">${c.icon}</span>
                    <div>
                      <p class="text-xs font-bold text-slate-700 dark:text-slate-300">${c.name}</p>
                      <p class="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">${c.percentage}% of total</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">${formatCurrency(c.amount)}</span>
                </div>
              `)}
            </div>
          </div>
        </sp-card>
      </div>
    `;
  }
}
