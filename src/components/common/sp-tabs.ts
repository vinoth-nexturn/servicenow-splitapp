import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

@customElement('sp-tabs')
export class SpTabs extends LitElement {
  @property({ type: Array })  tabs:   TabItem[] = [];
  @property({ type: String }) active  = '';

  static styles = [tw, css`:host { display: block; }`];

  render() {
    return html`
      <div class="flex border-b border-slate-200 dark:border-slate-700/60 gap-1 overflow-x-auto no-scrollbar">
        ${this.tabs.map(tab => {
          const isActive = this.active === tab.key;
          return html`
            <button
              class="px-4 py-3 text-sm font-semibold transition-colors duration-150 border-b-2 -mb-px whitespace-nowrap
                ${isActive
                  ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}
                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}"
              ?disabled=${tab.disabled}
              @click=${() => this._select(tab.key)}
            >
              ${tab.label}
              ${tab.count !== undefined ? html`
                <span class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}">
                  ${tab.count}
                </span>` : ''}
            </button>
          `;
        })}
      </div>
    `;
  }

  private _select(key: string) {
    this.active = key;
    this.dispatchEvent(new CustomEvent('tab-change', { detail: { key }, bubbles: true, composed: true }));
  }
}
