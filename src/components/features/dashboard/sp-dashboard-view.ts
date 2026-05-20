import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { tw } from '../../../styles/shared.styles';
import { appContext, type AppState } from '../../../services/state/app.context';
import { formatCurrency, balanceStatus } from '../../../utils/currency';
import { formatRelativeTime } from '../../../utils/date';
import '../../common/sp-card';
import '../../common/sp-avatar';
import '../../common/sp-currency';
import '../../common/sp-badge';
import '../../common/sp-skeleton';
import '../../common/sp-empty-state';

@customElement('sp-dashboard-view')
export class SpDashboardView extends LitElement {
  @consume({ context: appContext, subscribe: true })
  @state() private _appState!: AppState;

  static styles = [tw, css`:host { display: block; }`];

  render() {
    const state = this._appState;
    if (!state) return html``;

    const balance = state.dashboardBalance;
    const groups  = state.groups;
    const activity = state.recentActivity;

    return html`
      <div class="space-y-6">

        <!-- Balance Overview Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          ${this._balanceCard(
            'Total Owed to You',
            balance?.totalOwed ?? 0,
            'owed'
          )}
          ${this._balanceCard(
            'Total You Owe',
            balance?.totalOwing ?? 0,
            'owing'
          )}
          ${this._balanceCard(
            'Net Balance',
            (balance?.totalOwed ?? 0) - (balance?.totalOwing ?? 0),
            balanceStatus((balance?.totalOwed ?? 0) - (balance?.totalOwing ?? 0))
          )}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Groups List -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">Your Groups</h2>
              <button
                class="text-sm text-brand-600 dark:text-brand-400 hover:underline font-semibold cursor-pointer"
                @click=${this._onNewGroup}
              >+ New Group</button>
            </div>

            ${groups.length === 0
              ? html`
                <sp-card>
                  <sp-empty-state
                    icon="👥"
                    title="No groups yet"
                    message="Create a group to start splitting expenses with friends."
                  >
                    <sp-button @click=${this._onNewGroup} size="sm" class="mt-2">Create Group</sp-button>
                  </sp-empty-state>
                </sp-card>`
              : groups.map(g => html`
                <sp-card hoverable @click=${() => this._onGroupClick(g.id)}>
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center shrink-0">
                      <span class="text-base font-bold text-brand-700 dark:text-brand-400">${g.name[0]?.toUpperCase()}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">${g.name}</p>
                      <p class="text-xs text-slate-400 dark:text-slate-500 font-medium">${g.memberCount} members</p>
                    </div>
                    <sp-balance-indicator .amount=${g.myBalance}></sp-balance-indicator>
                  </div>
                </sp-card>
              `)
            }
          </div>

          <!-- Recent Activity -->
          <div class="space-y-4">
            <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">Recent Activity</h2>
            <sp-card padding="none" class="overflow-hidden">
              ${activity.length === 0
                ? html`
                  <div class="p-6">
                    <sp-empty-state icon="📋" title="No recent activity"></sp-empty-state>
                  </div>`
                : activity.slice(0, 8).map((a, i) => html`
                  <div class="flex items-start gap-3 px-5 py-3.5
                    ${i < activity.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/40' : ''}">
                    <sp-avatar name=${a.actor.displayName} userId=${a.actor.id} size="sm" class="mt-0.5"></sp-avatar>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">${a.description}</p>
                      <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1">${formatRelativeTime(a.createdAt)}</p>
                    </div>
                  </div>
                `)
              }
            </sp-card>
          </div>
        </div>

      </div>
    `;
  }

  private _balanceCard(label: string, amount: number, status: string) {
    const textColor = {
      owed:    'text-green-600 dark:text-green-400',
      owing:   'text-red-600 dark:text-red-400',
      settled: 'text-slate-500 dark:text-slate-400',
    }[status] ?? 'text-brand-600 dark:text-brand-400';

    const bgClass = {
      owed:    'bg-green-50/30 dark:bg-green-950/10 border-green-100 dark:border-green-900/30',
      owing:   'bg-red-50/30 dark:bg-red-950/10 border-red-100 dark:border-red-900/30',
      settled: 'bg-slate-50/30 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800/30',
    }[status] ?? 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30';

    return html`
      <div class="rounded-2xl border p-5 ${bgClass} shadow-sm transition-all duration-200">
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">${label}</p>
        <p class="text-2xl font-bold tabular-nums mt-1 ${textColor}">
          ${formatCurrency(Math.abs(amount))}
        </p>
      </div>
    `;
  }

  private _onGroupClick(groupId: string) {
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { route: { name: 'group', groupId } },
      bubbles: true, composed: true,
    }));
  }

  private _onNewGroup() {
    this.dispatchEvent(new CustomEvent('new-group', { bubbles: true, composed: true }));
  }
}
