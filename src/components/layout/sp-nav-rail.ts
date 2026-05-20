import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';
import type { GroupSummaryDto } from '../../models';
import type { AppRoute } from '../../services/state/app.context';
import { formatCurrency, balanceStatus } from '../../utils/currency';

@customElement('sp-nav-rail')
export class SpNavRail extends LitElement {
  @property({ type: Object }) route!: AppRoute;
  @property({ type: Array })  groups: GroupSummaryDto[] = [];

  static styles = [
    tw,
    css`
      :host {
        display: flex; flex-direction: column;
        width: 260px; height: 100vh;
        background: white;
        border-right: 1px solid #f1f5f9;
        flex-shrink: 0;
        overflow: hidden;
      }
      @media (prefers-color-scheme: dark) {
        :host {
          background: #0f172a;
          border-right: 1px solid #1e293b;
        }
      }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `,
  ];

  render() {
    return html`
      <!-- Logo -->
      <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-brand-600 dark:bg-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span class="text-base font-bold text-slate-800 dark:text-white tracking-wide">SplitApp</span>
        </div>
      </div>

      <!-- Primary nav -->
      <nav class="px-4 py-4 space-y-1 shrink-0">
        ${this._navItem('dashboard', 'Dashboard', html`
          <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        `)}
        ${this._navItem('reports', 'Reports', html`
          <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        `)}
      </nav>

      <!-- Groups section -->
      <div class="px-4 flex-1 overflow-y-auto py-2 no-scrollbar">
        <div class="flex items-center justify-between px-2.5 py-2 mb-2">
          <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Groups</span>
          <button
            class="p-1 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            @click=${this._onNewGroup}
            title="New group"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>

        <div class="space-y-1">
          ${this.groups.length === 0 ? html`
            <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2.5 py-1">No groups yet</p>
          ` : this.groups.map(g => this._groupItem(g))}
        </div>
      </div>
    `;
  }

  private _navItem(routeName: string, label: string, icon: unknown) {
    const isActive = this.route.name === routeName;
    return html`
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer
          ${isActive
            ? 'bg-brand-50/70 text-brand-700 dark:bg-brand-950/20 dark:text-brand-400'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}"
        @click=${() => this._navigate(routeName)}
      >
        <span class="shrink-0">${icon}</span>
        <span>${label}</span>
      </button>
    `;
  }

  private _groupItem(group: GroupSummaryDto) {
    const isActive = this.route.name === 'group' && (this.route as { groupId: string }).groupId === group.id;
    const balStatus = balanceStatus(group.myBalance);
    const balColor  = {
      owed: 'text-green-600 dark:text-green-400',
      owing: 'text-red-600 dark:text-red-400',
      settled: 'text-slate-400 dark:text-slate-500'
    }[balStatus];

    return html`
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer
          ${isActive ? 'bg-brand-50/40 dark:bg-brand-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}"
        @click=${() => this._selectGroup(group.id)}
      >
        <div class="w-6.5 h-6.5 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center shrink-0 border border-brand-100/30 dark:border-brand-900/10">
          <span class="text-[10px] font-bold text-brand-700 dark:text-brand-400">${group.name[0]?.toUpperCase()}</span>
        </div>
        <span class="flex-1 text-left text-xs font-semibold truncate
          ${isActive ? 'text-brand-700 dark:text-brand-400 font-bold' : 'text-slate-700 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}">
          ${group.name}
        </span>
        ${group.myBalance !== 0 ? html`
          <span class="text-[10px] font-bold tabular-nums ${balColor}">
            ${formatCurrency(Math.abs(group.myBalance))}
          </span>
        ` : ''}
      </button>
    `;
  }

  private _navigate(routeName: string) {
    this.dispatchEvent(new CustomEvent('navigate', { detail: { route: { name: routeName } }, bubbles: true, composed: true }));
  }

  private _selectGroup(groupId: string) {
    this.dispatchEvent(new CustomEvent('navigate', { detail: { route: { name: 'group', groupId } }, bubbles: true, composed: true }));
  }

  private _onNewGroup() {
    this.dispatchEvent(new CustomEvent('new-group', { bubbles: true, composed: true }));
  }
}
