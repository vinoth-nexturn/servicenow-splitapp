import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';
import type { CurrentUserDto } from '../../models';
import type { AppRoute } from '../../services/state/app.context';
import '../common/sp-avatar';

const ROUTE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard Overview',
  reports:   'Spend Analytics',
  settings:  'Account Settings',
};

@customElement('sp-topbar')
export class SpTopbar extends LitElement {
  @property({ type: Object }) route!: AppRoute;
  @property({ type: Object }) currentUser: CurrentUserDto | null = null;
  @property({ type: String }) groupName = '';

  @state() private _showUserMenu = false;
  @state() private _isDarkMode = document.documentElement.classList.contains('dark');

  static styles = [
    tw,
    css`
      :host {
        display: flex; align-items: center;
        height: 64px; padding: 0 1.5rem;
        background: white;
        border-bottom: 1px solid #f1f5f9;
        flex-shrink: 0; gap: 1rem;
      }
      @media (prefers-color-scheme: dark) {
        :host {
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
        }
      }
    `,
  ];

  render() {
    const title = this.route.name === 'group'
      ? this.groupName
      : (ROUTE_TITLES[this.route.name] ?? '');

    return html`
      <!-- Page title -->
      <h1 class="text-base font-bold text-slate-800 dark:text-white flex-1 truncate">${title}</h1>

      <!-- Actions slot -->
      <slot name="actions"></slot>

      <!-- Theme Toggle Button -->
      <button
        class="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        @click=${this._toggleTheme}
        title="Toggle dark mode"
      >
        ${this._isDarkMode ? html`
          <!-- Sun icon -->
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
          </svg>
        ` : html`
          <!-- Moon icon -->
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        `}
      </button>

      <!-- User menu -->
      ${this.currentUser ? html`
        <div class="relative">
          <button
            class="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            @click=${() => this._showUserMenu = !this._showUserMenu}
          >
            <sp-avatar
              name=${this.currentUser.displayName}
              userId=${this.currentUser.id}
              size="sm"
            ></sp-avatar>
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:block">
              ${this.currentUser.displayName}
            </span>
          </button>

          ${this._showUserMenu ? html`
            <div class="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xl z-50 py-1.5 overflow-hidden">
              <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                <p class="text-xs font-bold text-slate-800 dark:text-white">${this.currentUser.displayName}</p>
                <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate mt-0.5">${this.currentUser.email}</p>
              </div>
              <button
                class="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                @click=${this._onSettings}
              >Settings</button>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;
  }

  private _toggleTheme() {
    this._isDarkMode = !this._isDarkMode;
    if (this._isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Also save preference to localStorage
    localStorage.setItem('split-app-dark-mode', this._isDarkMode ? 'true' : 'false');
    this.dispatchEvent(new CustomEvent('theme-changed', { detail: { dark: this._isDarkMode }, bubbles: true, composed: true }));
  }

  private _onSettings() {
    this._showUserMenu = false;
    this.dispatchEvent(new CustomEvent('navigate', { detail: { route: { name: 'settings' } }, bubbles: true, composed: true }));
  }
}
