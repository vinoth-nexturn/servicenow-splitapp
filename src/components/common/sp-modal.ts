import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@customElement('sp-modal')
export class SpModal extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) title = '';
  @property({ type: String }) size: ModalSize = 'md';

  static styles = [
    tw,
    css`
      :host { display: contents; }
      .backdrop {
        position: fixed; inset: 0; z-index: 50;
        display: flex; align-items: center; justify-content: center;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        animation: fadeIn 200ms ease-out;
      }
      .panel { animation: slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1); }
      @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `,
  ];

  private get _panelWidth(): string {
    const widths: Record<ModalSize, string> = {
      sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl',
    };
    return widths[this.size];
  }

  render() {
    if (!this.open) return html``;
    return html`
      <div class="backdrop" @click=${this._onBackdropClick}>
        <div
          class="panel bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/80 w-full mx-4 overflow-hidden ${this._panelWidth}"
          @click=${(e: Event) => e.stopPropagation()}
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">${this.title}</h2>
            <button
              class="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              @click=${this._close}
              aria-label="Close"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <!-- Body -->
          <div class="px-6 py-5 max-h-[75vh] overflow-y-auto"><slot></slot></div>
          <!-- Footer -->
          <slot name="footer">
            <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50">
              <slot name="footer-actions"></slot>
            </div>
          </slot>
        </div>
      </div>
    `;
  }

  private _onBackdropClick() { this._close(); }

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
