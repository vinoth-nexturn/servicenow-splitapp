import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

export class SpEmptyState extends LitElement {
  @property({ type: String }) icon    = '📭';
  @property({ type: String }) title   = 'Nothing here yet';
  @property({ type: String }) message = '';

  static styles = [tw, css`:host { display: flex; flex: 1; }`];

  render() {
    return html`
      <div class="flex flex-col items-center justify-center text-center py-12 px-6 w-full gap-3">
        <div class="text-5xl animate-bounce duration-1000 select-none">${this.icon}</div>
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">${this.title}</h3>
        ${this.message ? html`<p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">${this.message}</p>` : ''}
        <slot></slot>
      </div>
    `;
  }
}

export class SpErrorState extends LitElement {
  @property({ type: String }) title   = 'Something went wrong';
  @property({ type: String }) message = 'An unexpected error occurred. Please try again.';

  static styles = [tw, css`:host { display: flex; flex: 1; }`];

  render() {
    return html`
      <div class="flex flex-col items-center justify-center text-center py-12 px-6 w-full gap-3">
        <div class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center shadow-inner">
          <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">${this.title}</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">${this.message}</p>
        <slot></slot>
      </div>
    `;
  }
}

if (!customElements.get('sp-empty-state')) {
  customElements.define('sp-empty-state', SpEmptyState);
}
if (!customElements.get('sp-error-state')) {
  customElements.define('sp-error-state', SpErrorState);
}
