import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

@customElement('sp-loader')
export class SpLoader extends LitElement {
  @property({ type: String })  size:     'sm' | 'md' | 'lg' = 'md';
  @property({ type: Boolean }) fullscreen = false;

  static styles = [
    tw,
    css`
      :host { display: flex; }
      .fullscreen {
        position: fixed; inset: 0; z-index: 100;
        display: flex; align-items: center; justify-content: center;
        background: rgba(248, 250, 252, 0.85);
        backdrop-filter: blur(4px);
      }
      @media (prefers-color-scheme: dark) {
        .fullscreen {
          background: rgba(15, 23, 42, 0.85);
        }
      }
    `,
  ];

  private get _spinnerSize(): string {
    return { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[this.size];
  }

  render() {
    const spinner = html`
      <svg class="animate-spin text-brand-600 dark:text-brand-400 ${this._spinnerSize}" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
    `;

    if (this.fullscreen) {
      return html`<div class="fullscreen">${spinner}</div>`;
    }
    return html`<div class="flex items-center justify-center p-4 w-full">${spinner}</div>`;
  }
}
