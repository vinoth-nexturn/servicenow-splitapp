import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { tw } from '../../styles/shared.styles';
import { groupContext } from '../../contexts';
import type { GroupStateType } from '../../contexts';
import '../common/sp-button';

@customElement('sp-new-group-modal')
export class NewGroupModal extends LitElement {
  @consume({ context: groupContext, subscribe: true })
  @state() groupState!: GroupStateType;

  @state() private name = '';
  @state() private description = '';
  @state() private currency = 'USD';
  @state() private creating = false;

  static styles = [
    tw,
    css`
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
      }
      .modal {
        background: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }
      h2 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 500;
      }
      input,
      select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
      }
    `,
  ];

  render() {
    return html`
      <div class="modal-overlay" @click=${() => this.close()}>
        <div class="modal" @click=${(e: any) => e.stopPropagation()}>
          <h2>Create Group</h2>
          <form @submit=${this.handleSubmit}>
            <div class="form-group">
              <label for="name">Group Name *</label>
              <input
                id="name"
                type="text"
                .value=${this.name}
                @input=${(e: any) => (this.name = e.target.value)}
                required
              />
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <input
                id="description"
                type="text"
                .value=${this.description}
                @input=${(e: any) => (this.description = e.target.value)}
              />
            </div>
            <div class="form-group">
              <label for="currency">Currency</label>
              <select
                id="currency"
                .value=${this.currency}
                @change=${(e: any) => (this.currency = e.target.value)}
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
              </select>
            </div>
            <div class="actions">
              <sp-button @click=${() => this.close()}>Cancel</sp-button>
              <sp-button type="submit" ?disabled=${this.creating} variant="primary"
                >Create</sp-button
              >
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private async handleSubmit(e: any) {
    e.preventDefault();
    try {
      this.creating = true;
      await this.groupState.createGroup({
        name: this.name,
        description: this.description,
        baseCurrency: this.currency,
      });
      this.close();
    } catch (error) {
      console.error('Failed to create group', error);
    } finally {
      this.creating = false;
    }
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }
}
