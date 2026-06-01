import { createContext } from '@lit/context';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface UIStateType {
  isLoading: boolean;
  showNewGroupModal: boolean;
  showNewExpenseModal: boolean;
  showSettlementModal: boolean;
  toasts: Toast[];
  setLoading: (value: boolean) => void;
  openNewGroupModal: () => void;
  closeNewGroupModal: () => void;
  openNewExpenseModal: () => void;
  closeNewExpenseModal: () => void;
  openSettlementModal: () => void;
  closeSettlementModal: () => void;
  addToast: (msg: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

export const uiContext = createContext<UIStateType>('ui-context');
