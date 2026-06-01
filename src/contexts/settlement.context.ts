import { createContext } from '@lit/context';
import type { SettlementDto, CreateSettlementRequest, GroupBalanceDto } from '../models';

export interface SettlementStateType {
  settlements: SettlementDto[];
  balances: GroupBalanceDto | null;
  isLoading: boolean;
  error: string | null;
  groupId: string | null;
  refresh: () => Promise<void>;
  recordSettlement: (req: CreateSettlementRequest) => Promise<void>;
}

export const settlementContext = createContext<SettlementStateType>(
  'settlement-context'
);
