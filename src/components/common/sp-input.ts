import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';

@customElement('sp-input')
export class SpInput extends LitElement {
  @property({ type: String })  label    = '';
  @property({ type: String })  name     = '';
  @property({ type: String })  type     = 'text';
  @property({ type: String })  value    = '';
  @property({ type: String })  placeholder = '';
  @property({ type: String })  hint     = '';
  @property({ type: String })  error    = '';
  @property({ type: String })  prefix   = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readonly = false;

  @query('input') private _input!: HTMLInputElement;

  static styles = [tw, css`:host { display: block; }`];

  render() {
    return html`
      <div class="flex flex-col gap-1.5">
        ${this.label ? html`
          <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            ${this.label}
            ${this.required ? html`<span class="text-red-500 ml-0.5">*</span>` : ''}
          </label>` : ''}

        <div class="relative flex items-center">
          ${this.prefix ? html`
            <span class="absolute left-3 text-slate-400 dark:text-slate-500 text-sm font-medium pointer-events-none">${this.prefix}</span>` : ''}

          <input
            name=${this.name}
            type=${this.type}
            .value=${this.value}
            placeholder=${this.placeholder}
            ?required=${this.required}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            class="w-full rounded-xl border text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-600
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-shadow duration-150
              ${this.error ? 'border-red-400 dark:border-red-500/50 focus:ring-red-400' : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'}
              ${this.prefix ? 'pl-8 pr-3' : 'px-4'} py-2.5"
            @input=${this._onInput}
            @change=${this._onChange}
          />
        </div>

        ${this.error ? html`<p class="text-xs text-red-500 dark:text-red-400">${this.error}</p>` : ''}
        ${this.hint && !this.error ? html`<p class="text-xs text-slate-400 dark:text-slate-500">${this.hint}</p>` : ''}
      </div>
    `;
  }

  private _onInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent('sp-input', { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  private _onChange(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent('sp-change', { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  focus() { this._input?.focus(); }
}
