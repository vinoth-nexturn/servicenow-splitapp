import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

@customElement('sp-select')
export class SpSelect extends LitElement {
  @property({ type: String })  label    = '';
  @property({ type: String })  name     = '';
  @property({ type: String })  value    = '';
  @property({ type: Array })   options: SelectOption[] = [];
  @property({ type: String })  placeholder = 'Select an option';
  @property({ type: String })  hint     = '';
  @property({ type: String })  error    = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;

  static styles = [tw, css`:host { display: block; }`];

  render() {
    return html`
      <div class="flex flex-col gap-1.5">
        ${this.label ? html`
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            ${this.label}
            ${this.required ? html`<span class="text-red-500 ml-0.5">*</span>` : ''}
          </label>` : ''}

        <div class="relative">
          <select
            name=${this.name}
            ?required=${this.required}
            ?disabled=${this.disabled}
            class="w-full appearance-none rounded-xl border text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-shadow duration-150 pr-10 pl-4 py-2.5 cursor-pointer
              ${this.error ? 'border-red-400 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'}"
            @change=${this._onChange}
          >
            <option value="" ?selected=${!this.value} disabled>${this.placeholder}</option>
            ${this.options.map(opt => html`
              <option
                value=${opt.value}
                ?selected=${this.value === opt.value}
                ?disabled=${opt.disabled ?? false}
                class="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >${opt.label}</option>
            `)}
          </select>
          <svg class="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>

        ${this.error ? html`<p class="text-xs text-red-500 dark:text-red-400">${this.error}</p>` : ''}
        ${this.hint && !this.error ? html`<p class="text-xs text-slate-400 dark:text-slate-500">${this.hint}</p>` : ''}
      </div>
    `;
  }

  private _onChange(e: Event) {
    this.value = (e.target as HTMLSelectElement).value;
    this.dispatchEvent(new CustomEvent('sp-change', { detail: { value: this.value }, bubbles: true, composed: true }));
  }
}
