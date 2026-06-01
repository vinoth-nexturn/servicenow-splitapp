import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * Seismic Facade Wrapper for ServiceNow
 * 
 * Hybrid Pattern: Seismic shell handles NOW token injection,
 * wraps Lit component for reusability
 * 
 * In ServiceNow IDE, register as: x-split-dashboard
 * Usage: <x-split-dashboard></x-split-dashboard>
 */
@customElement('x-split-dashboard')
export class SplitDashboardSeismic extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
    }

    split-dashboard {
      height: 100%;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.initializeNowContext();
  }

  /**
   * Initialize ServiceNow context and token injection
   * In real ServiceNow, this would pull from NOW global or GlideSystem
   */
  private initializeNowContext() {
    // Extract token from cookie or NOW context
    const token =
      (document.cookie.match(/glide_user_auth=([^;]+)/) ?? [])[1] ?? '';

    if (token) {
      // Token would be injected into services via ApiClientService
      // Already handled by cookie in api-client.service.ts
      console.log('[Seismic] Token injected');
    }
  }

  render() {
    return html`<split-dashboard></split-dashboard>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-split-dashboard': SplitDashboardSeismic;
  }
}
