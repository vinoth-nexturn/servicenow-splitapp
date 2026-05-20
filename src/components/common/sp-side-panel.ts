import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

@customElement('sp-side-panel')
export class SpSidePanel extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) title = '';
  @property({ type: String }) width = '420px';

  static styles = [
    tw,
    css`
      :host { display: contents; }
      .backdrop {
        position: fixed; inset: 0; z-index: 40;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(2px);
        animation: fadeIn 200ms ease;
      }
      .panel {
        position: fixed; top: 0; right: 0; bottom: 0; z-index: 41;
        background: white;
        box-shadow: -4px 0 24px rgba(0,0,0,0.08);
        display: flex; flex-direction: column;
        animation: slideIn 250ms cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }
      @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @media (prefers-color-scheme: dark) {
        .panel {
          background: #1e293b;
          box-shadow: -4px 0 24px rgba(0,0,0,0.3);
        }
      }
    `,
  ];

  render() {
    if (!this.open) return html``;
    return html`
      <div class="backdrop" @click=${this._close}></div>
      <div class="panel border-l border-slate-100 dark:border-slate-800" style="width: ${this.width}; max-width: 100%;">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
          <h2 class="text-base font-bold text-slate-900 dark:text-white">${this.title}</h2>
          <button
            class="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
            @click=${this._close}
            aria-label="Close panel"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-5 py-4">
          <slot></slot>
        </div>
        <!-- Footer -->
        <div class="shrink-0 border-t border-slate-100 dark:border-slate-700/50 px-5 py-4 bg-slate-50/50 dark:bg-slate-800/50">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }

  private _close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._onKeyDown);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKeyDown);
  }
  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.open) this._close();
  };
}
