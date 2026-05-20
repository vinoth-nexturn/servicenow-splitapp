import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

@customElement('sp-skeleton')
export class SpSkeleton extends LitElement {
  @property({ type: String }) variant: 'text' | 'circle' | 'rect' = 'text';
  @property({ type: String }) width  = '100%';
  @property({ type: String }) height = '1rem';

  static styles = [
    tw,
    css`
      :host { display: block; }
      .skeleton {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
        border-radius: 0.5rem;
      }
      @media (prefers-color-scheme: dark) {
        .skeleton {
          background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
          background-size: 200% 100%;
        }
      }
      @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    `,
  ];

  render() {
    const radius = this.variant === 'circle' ? '9999px' : '';
    return html`
      <div
        class="skeleton"
        style="width:${this.width}; height:${this.height}; ${radius ? `border-radius:${radius};` : ''}"
        role="presentation"
        aria-hidden="true"
      ></div>
    `;
  }
}

@customElement('sp-card-skeleton')
export class SpCardSkeleton extends LitElement {
  static styles = [tw, css`:host { display: block; }`];

  render() {
    return html`
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 space-y-4 shadow-sm">
        <div class="flex items-center gap-3">
          <sp-skeleton variant="circle" width="2.25rem" height="2.25rem"></sp-skeleton>
          <div class="flex-1 space-y-2">
            <sp-skeleton width="60%" height="0.875rem"></sp-skeleton>
            <sp-skeleton width="40%" height="0.75rem"></sp-skeleton>
          </div>
          <sp-skeleton width="4rem" height="1.25rem"></sp-skeleton>
        </div>
        <sp-skeleton width="100%" height="0.75rem"></sp-skeleton>
        <sp-skeleton width="75%" height="0.75rem"></sp-skeleton>
      </div>
    `;
  }
}
