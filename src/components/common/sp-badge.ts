import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

export type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'brand';

@customElement('sp-badge')
export class SpBadge extends LitElement {
  @property({ type: String }) variant: BadgeVariant = 'default';
  @property({ type: Boolean }) dot = false;

  static styles = [tw, css`:host { display: inline-flex; }`];

  private get _classes(): string {
    const base = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold';
    const variants: Record<BadgeVariant, string> = {
      default: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
      success: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
      danger:  'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
      warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
      info:    'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
      brand:   'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400',
    };
    return `${base} ${variants[this.variant]}`;
  }

  private get _dotColor(): string {
    const colors: Record<BadgeVariant, string> = {
      default: 'bg-slate-400 dark:bg-slate-500',
      success: 'bg-green-500',
      danger: 'bg-red-500',
      warning: 'bg-amber-500',
      info: 'bg-blue-500',
      brand:  'bg-brand-500',
    };
    return colors[this.variant];
  }

  render() {
    return html`
      <span class=${this._classes}>
        ${this.dot ? html`<span class="w-1.5 h-1.5 rounded-full ${this._dotColor}"></span>` : ''}
        <slot></slot>
      </span>
    `;
  }
}
