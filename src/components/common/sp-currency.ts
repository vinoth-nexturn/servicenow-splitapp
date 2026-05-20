import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';
import { formatCurrency, balanceStatus } from '../../utils/currency';

@customElement('sp-currency')
export class SpCurrency extends LitElement {
  @property({ type: Number }) amount   = 0;
  @property({ type: String }) currency = 'USD';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @property({ type: Boolean }) colored  = false;
  @property({ type: Boolean }) showSign = false;

  static styles = [tw, css`:host { display: inline-flex; }`];

  private get _colorClass(): string {
    if (!this.colored) return 'text-slate-900 dark:text-slate-100';
    const status = balanceStatus(this.amount);
    return {
      owed:    'text-green-600 dark:text-green-400',
      owing:   'text-red-600 dark:text-red-400',
      settled: 'text-slate-400 dark:text-slate-500',
    }[status];
  }

  private get _sizeClass(): string {
    return {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base font-semibold',
      xl: 'text-xl font-bold'
    }[this.size];
  }

  render() {
    const sign = this.showSign && this.amount > 0.005 ? '+' : '';
    return html`
      <span class="font-medium tabular-nums ${this._colorClass} ${this._sizeClass}">
        ${sign}${formatCurrency(this.amount, this.currency)}
      </span>
    `;
  }
}

@customElement('sp-balance-indicator')
export class SpBalanceIndicator extends LitElement {
  @property({ type: Number }) amount   = 0;
  @property({ type: String }) currency = 'USD';

  static styles = [tw, css`:host { display: inline-flex; }`];

  render() {
    const status = balanceStatus(this.amount);
    const configs = {
      owed:    { bg: 'bg-green-50/50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-400', label: 'you are owed' },
      owing:   { bg: 'bg-red-50/50 dark:bg-red-950/20',   text: 'text-red-700 dark:text-red-400',   label: 'you owe'      },
      settled: { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', label: 'settled up'   },
    };
    const c = configs[status];
    return html`
      <div class="flex flex-col items-end gap-0.5">
        <sp-currency .amount=${Math.abs(this.amount)} currency=${this.currency} colored size="sm"></sp-currency>
        <span class="text-[10px] font-semibold tracking-wide uppercase ${c.text}">${c.label}</span>
      </div>
    `;
  }
}
