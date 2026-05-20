import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { tw } from '../../styles/shared.styles';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@customElement('sp-toast')
export class SpToast extends LitElement {
  @property({ type: Object }) toast!: Toast;

  static styles = [
    tw,
    css`
      :host { display: block; }
      .toast { animation: slideInRight 200ms cubic-bezier(0.16, 1, 0.3, 1); }
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
      }
    `,
  ];

  private get _config() {
    const configs = {
      success: { bg: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-800/40 dark:text-green-300', icon: '✅' },
      error:   { bg: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-300',     icon: '❌' },
      warning: { bg: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-300', icon: '⚠️' },
      info:    { bg: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800/40 dark:text-blue-300',   icon: 'ℹ️' },
    };
    return configs[this.toast.type];
  }

  render() {
    const c = this._config;
    return html`
      <div class="toast flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg min-w-72 max-w-sm ${c.bg}">
        <span class="text-base shrink-0">${c.icon}</span>
        <p class="text-sm font-semibold flex-1">${this.toast.message}</p>
        <button
          class="shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          @click=${this._dismiss}
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
  }

  private _dismiss() {
    this.dispatchEvent(new CustomEvent('dismiss', { detail: { id: this.toast.id }, bubbles: true, composed: true }));
  }
}

@customElement('sp-toast-container')
export class SpToastContainer extends LitElement {
  @property({ type: Array }) toasts: Toast[] = [];

  static styles = [
    tw,
    css`
      :host {
        position: fixed;
        bottom: 1.5rem; right: 1.5rem;
        z-index: 9999;
        display: flex; flex-direction: column;
        gap: 0.75rem;
        pointer-events: none;
      }
      sp-toast { pointer-events: auto; }
    `,
  ];

  render() {
    return html`
      ${repeat(this.toasts, t => t.id, t => html`
        <sp-toast .toast=${t} @dismiss=${this._onDismiss}></sp-toast>
      `)}
    `;
  }

  private _onDismiss(e: CustomEvent<{ id: string }>) {
    this.dispatchEvent(new CustomEvent('toast-dismiss', { detail: e.detail, bubbles: true, composed: true }));
  }
}
