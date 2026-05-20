import type { UserRefDto } from './user.model';

/**
 * Settlement Model (DTOs)
 * Represents settlement/payment records between users
 */

export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'card' | 'paypal' | 'other';
export type SettlementStatus = 'proposed' | 'accepted' | 'completed' | 'rejected' | 'disputed';

export interface SettlementDto {
  id: string;
  groupId: string;
  payer: UserRefDto;
  payee: UserRefDto;
  amount: number;
  currency: string;
  settlementDate: string;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  notes?: string;
  status: SettlementStatus;
  sharesSettled: number;
  expensesIncluded: number;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementDetailDto extends SettlementDto {
  expensesSettled: Array<{ id: string; description: string; amount: number }>;
  history: SettlementHistory[];
}

export interface SettlementHistory {
  timestamp: string;
  action: 'created' | 'accepted' | 'rejected' | 'disputed' | 'resolved';
  actorId: string;
  comment?: string;
}

export interface CreateSettlementRequest {
  groupId?: string;
  payerId?: string;
  payeeId: string;
  amount: number;
  settlementDate: string;
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  notes?: string;
  expenseIds?: string[];
}

export interface UpdateSettlementRequest {
  status: SettlementStatus;
  transactionRef?: string;
  notes?: string;
}

export interface SettlementProposal {
  settlements: SettlementDto[];
  totalAmount: number;
  currency: string;
  description: string;
}

export interface SettlementGroupRequest {
  groupId: string;
  settlementDate: string;
  paymentMethod?: PaymentMethod;
  autoSettle?: boolean;
}
