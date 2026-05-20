import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@customElement('sp-button')
export class SpButton extends LitElement {
  @property({ type: String }) variant: ButtonVariant = 'primary';
  @property({ type: String }) size: ButtonSize = 'md';
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';

  static styles = [
    tw,
    css`
      :host { display: inline-flex; }
      button { all: unset; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-sizing: border-box; }
      button:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
    `,
  ];

  private get _classes(): string {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap w-full';
    const variants: Record<ButtonVariant, string> = {
      primary:   'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-sm dark:bg-brand-600 dark:hover:bg-brand-700',
      secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
      ghost:     'text-slate-600 hover:bg-slate-100 focus:ring-slate-300 dark:text-slate-400 dark:hover:bg-slate-800',
      danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm dark:bg-red-600 dark:hover:bg-red-700',
      outline:   'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    };
    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-sm',
    };
    return `${base} ${variants[this.variant]} ${sizes[this.size]}`;
  }

  render() {
    return html`
      <button
        type=${this.type}
        class=${this._classes}
        ?disabled=${this.disabled || this.loading}
        @click=${this._onClick}
      >
        ${this.loading ? html`
          <svg class="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>` : ''}
        <slot></slot>
      </button>
    `;
  }

  private _onClick(e: Event) {
    if (this.disabled || this.loading) {
      e.stopPropagation();
      e.preventDefault();
    }
  }
}
