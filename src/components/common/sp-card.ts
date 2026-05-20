import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@customElement('sp-card')
export class SpCard extends LitElement {
  @property({ type: String }) padding: CardPadding = 'md';
  @property({ type: Boolean }) hoverable = false;
  @property({ type: Boolean }) selected = false;

  static styles = [tw, css`:host { display: block; }`];

  private get _classes(): string {
    const base = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all duration-200';
    const pad: Record<CardPadding, string> = {
      none: '', sm: 'p-3', md: 'p-5', lg: 'p-6',
    };
    const hover = this.hoverable ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 cursor-pointer' : '';
    const sel   = this.selected  ? 'ring-2 ring-brand-500 border-brand-300 dark:border-brand-500' : '';
    return `${base} ${pad[this.padding]} ${hover} ${sel}`;
  }

  render() {
    return html`<div class=${this._classes}><slot></slot></div>`;
  }
}
