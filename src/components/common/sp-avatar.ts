import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tw } from '../../styles/shared.styles';
import { getInitials, getAvatarColor } from '../../utils/string';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@customElement('sp-avatar')
export class SpAvatar extends LitElement {
  @property({ type: String }) name = '';
  @property({ type: String }) userId = '';
  @property({ type: String }) src = '';
  @property({ type: String }) size: AvatarSize = 'md';

  static styles = [tw, css`:host { display: inline-flex; flex-shrink: 0; }`];

  private get _sizeClasses(): string {
    const sizes: Record<AvatarSize, string> = {
      xs: 'w-6 h-6 text-[10px]',
      sm: 'w-7 h-7 text-xs',
      md: 'w-8 h-8 text-sm',
      lg: 'w-10 h-10 text-base',
      xl: 'w-12 h-12 text-lg',
    };
    return sizes[this.size];
  }

  render() {
    const initials  = getInitials(this.name);
    const bgColor   = getAvatarColor(this.userId || this.name);

    if (this.src) {
      return html`
        <img
          class="rounded-full object-cover ${this._sizeClasses}"
          src=${this.src}
          alt=${this.name}
          @error=${this._onImgError}
        />
      `;
    }

    return html`
      <span
        class="rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${this._sizeClasses}"
        style="background-color: ${bgColor};"
        title=${this.name}
      >
        ${initials}
      </span>
    `;
  }

  private _onImgError(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}

export interface AvatarItem {
  name: string;
  userId: string;
  src?: string;
}

@customElement('sp-avatar-group')
export class SpAvatarGroup extends LitElement {
  @property({ type: Array }) avatars: AvatarItem[] = [];
  @property({ type: Number }) max = 4;
  @property({ type: String }) size: AvatarSize = 'sm';

  static styles = [tw, css`:host { display: inline-flex; }`];

  render() {
    const visible  = this.avatars.slice(0, this.max);
    const overflow = this.avatars.length - this.max;

    return html`
      <div class="flex -space-x-2">
        ${visible.map(a => html`
          <sp-avatar
            class="ring-2 ring-white dark:ring-slate-800"
            name=${a.name}
            userId=${a.userId}
            src=${a.src ?? ''}
            size=${this.size}
          ></sp-avatar>
        `)}
        ${overflow > 0 ? html`
          <span
            class="flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs font-medium ring-2 ring-white dark:ring-slate-800
              ${this.size === 'sm' ? 'w-7 h-7' : 'w-8 h-8'}"
          >
            +${overflow}
          </span>
        ` : ''}
      </div>
    `;
  }
}
