import type { UserRefDto } from './user.model';
import type { ExpenseCategory } from './expense.model';

export interface GroupReportDto {
  groupId: string;
  groupName: string;
  totalExpenses: number;
  totalAmount: number;
  period: ReportPeriod;
  categoryBreakdown: CategoryBreakdownDto[];
  memberBreakdown: MemberBreakdownDto[];
  timeline: TimelineEntryDto[];
}

export interface CategoryBreakdownDto {
  category: ExpenseCategory;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MemberBreakdownDto {
  member: UserRefDto;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface TimelineEntryDto {
  period: string;
  amount: number;
  count: number;
}

export interface ReportPeriod {
  fromDate: string;
  toDate: string;
}
