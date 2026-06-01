import { createContext } from '@lit/context';
import type { ExpenseDto, CreateExpenseRequest } from '../models';

export interface ExpenseStateType {
  expenses: ExpenseDto[];
  selectedExpenseId: string | null;
  isLoading: boolean;
  error: string | null;
  groupId: string | null;
  refresh: () => Promise<void>;
  createExpense: (req: CreateExpenseRequest) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const expenseContext = createContext<ExpenseStateType>('expense-context');
