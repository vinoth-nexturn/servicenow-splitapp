import type { UserRefDto } from './user.model';

/**
 * Expense Model (DTOs)
 * Represents expense records and shares
 */

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';
export type ExpenseCategory = 'food_drink' | 'travel' | 'utilities' | 'entertainment' | 'healthcare' | 'subscription' | 'other';
export type ExpenseStatus = 'active' | 'settled' | 'deleted';

export interface ExpenseDto {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  expenseDate: string;
  payer: UserRefDto;
  splitType: SplitType;
  category: ExpenseCategory;
  notes?: string;
  shares: ShareDto[];
  hasReceipt: boolean;
  receiptUrl?: string;
  status: ExpenseStatus;
  isFullySettled: boolean;
  settledAmount: number;
  remainingAmount: number;
  createdBy: UserRefDto;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface ExpenseDetailDto extends ExpenseDto {
  participants: number;
  averageShare: number;
  timeline: ExpenseTimeline[];
}

export interface ExpenseTimeline {
  actionType: 'created' | 'updated' | 'settled' | 'deleted';
  actorId: string;
  timestamp: string;
  description: string;
}

export interface ShareDto {
  id: string;
  member: UserRefDto;
  amount: number;
  percentage?: number;
  shareUnits?: number;
  isSettled: boolean;
  settledAmount: number;
  remainingAmount: number;
  settledOn?: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  expenseDate: string;
  payerId: string;
  splitType: SplitType;
  category?: ExpenseCategory;
  notes?: string;
  receiptUrl?: string;
  shares?: CreateShareRequest[];
  tags?: string[];
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  expenseDate?: string;
  category?: ExpenseCategory;
  notes?: string;
  receiptUrl?: string;
  shares?: CreateShareRequest[];
  tags?: string[];
}

export interface CreateShareRequest {
  memberId: string;
  amount?: number;
  percentage?: number;
  shareUnits?: number;
}

export interface ExpenseSummaryDto {
  totalExpenses: number;
  totalAmount: number;
  byCategory: Record<ExpenseCategory, number>;
  byMember: Array<{ member: UserRefDto; amount: number }>;
  averageExpense: number;
  mostExpensiveExpense: ExpenseDto;
}

export interface ExpenseFilterRequest {
  groupId: string;
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  payerId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  searchText?: string;
  offset?: number;
  limit?: number;
  sortBy?: 'date' | 'amount' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: ExpenseCategory;
  payerId?: string;
  fromDate?: string;
  toDate?: string;
  settled?: boolean;
  sortBy?: 'expense_date' | 'amount' | 'created_at';
  sortDir?: 'asc' | 'desc';
}
