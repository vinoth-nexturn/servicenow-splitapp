import type {
  UserRefDto,
  CurrentUserDto,
  GroupSummaryDto,
  GroupDto,
  GroupMemberDto,
  ExpenseDto,
  ShareDto,
  SettlementDto,
  ActivityDto,
  GroupReportDto,
  DashboardBalanceDto,
  NetBalanceDto,
  GroupBalanceSummaryDto,
  GroupBalanceDto,
  CreateGroupRequest,
  CreateExpenseRequest,
  CreateSettlementRequest
} from '../../models';
import { calculateShares } from '../../utils/split-calculator';

// Standard mock platform users
export const MOCK_USERS: UserRefDto[] = [
  { id: 'user_vinoth', displayName: 'Vinoth Kumar', email: 'vinoth.kumar@company.com', avatarInitials: 'VK', avatarColor: '#4f46e5' },
  { id: 'user_pavan', displayName: 'Pavan (PO)', email: 'pavan.po@company.com', avatarInitials: 'P', avatarColor: '#16a34a' },
  { id: 'user_ananya', displayName: 'Ananya (Dev)', email: 'ananya.dev@company.com', avatarInitials: 'A', avatarColor: '#ea580c' },
  { id: 'user_rahul', displayName: 'Rahul (Dev)', email: 'rahul.dev@company.com', avatarInitials: 'R', avatarColor: '#2563eb' }
];

export const CURRENT_USER: CurrentUserDto = {
  ...MOCK_USERS[0],
  roles: ['admin'],
  timezone: 'Asia/Kolkata',
  locale: 'en-US',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  preferences: {
    theme: 'light',
    notifications_enabled: true,
    default_currency: 'USD'
  }
};

interface LocalStorageSchema {
  groups: GroupDto[];
  expenses: ExpenseDto[];
  settlements: SettlementDto[];
  activities: ActivityDto[];
}

const STORAGE_KEY = 'split_app_local_db';

export class MockDb {
  private data!: LocalStorageSchema;

  constructor() {
    this.load();
  }

  private load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.data = JSON.parse(raw);
        return;
      } catch (e) {
        console.error('Failed to parse mock database, re-seeding...', e);
      }
    }
    this.seed();
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  private seed() {
    const vinoth = MOCK_USERS[0];
    const pavan = MOCK_USERS[1];
    const ananya = MOCK_USERS[2];
    const rahul = MOCK_USERS[3];

    // Seed Goa Trip Group
    const groupGoa: GroupDto = {
      id: 'group_goa',
      name: 'Goa Trip 2025',
      description: 'Shared expenses for our team vacation in Goa!',
      baseCurrency: 'USD',
      isArchived: false,
      memberCount: 3,
      myBalance: 0,
      myRole: 'admin',
      createdBy: vinoth,
      createdAt: '2026-05-10T10:00:00Z',
      updatedAt: '2026-05-10T10:00:00Z',
      members: [
        { userId: vinoth.id, user: vinoth, role: 'admin', joinedAt: '2026-05-10T10:00:00Z', isActive: true, status: 'active' },
        { userId: pavan.id, user: pavan, role: 'member', joinedAt: '2026-05-10T10:05:00Z', isActive: true, status: 'active' },
        { userId: ananya.id, user: ananya, role: 'member', joinedAt: '2026-05-10T10:10:00Z', isActive: true, status: 'active' }
      ]
    };

    // Seed Flatmates Group
    const groupFlat: GroupDto = {
      id: 'group_flat',
      name: 'Flatmates 402',
      description: 'Monthly flat rent and utilities.',
      baseCurrency: 'USD',
      isArchived: false,
      memberCount: 3,
      myBalance: 0,
      myRole: 'member',
      createdBy: ananya,
      createdAt: '2026-05-01T08:00:00Z',
      updatedAt: '2026-05-01T08:00:00Z',
      members: [
        { userId: ananya.id, user: ananya, role: 'admin', joinedAt: '2026-05-01T08:00:00Z', isActive: true, status: 'active' },
        { userId: vinoth.id, user: vinoth, role: 'member', joinedAt: '2026-05-01T08:05:00Z', isActive: true, status: 'active' },
        { userId: rahul.id, user: rahul, role: 'member', joinedAt: '2026-05-01T08:10:00Z', isActive: true, status: 'active' }
      ]
    };

    this.data = {
      groups: [groupGoa, groupFlat],
      expenses: [],
      settlements: [],
      activities: [
        {
          id: 'act_1',
          groupId: 'group_goa',
          groupName: 'Goa Trip 2025',
          actor: vinoth,
          action: 'group_created',
          entityType: 'group',
          entityId: 'group_goa',
          description: 'Vinoth Kumar created Goa Trip 2025',
          metadata: {},
          createdAt: '2026-05-10T10:00:00Z'
        },
        {
          id: 'act_2',
          groupId: 'group_flat',
          groupName: 'Flatmates 402',
          actor: ananya,
          action: 'group_created',
          entityType: 'group',
          entityId: 'group_flat',
          description: 'Ananya (Dev) created Flatmates 402',
          metadata: {},
          createdAt: '2026-05-01T08:00:00Z'
        }
      ]
    };

    // Add some default expenses
    // 1. Dinner in Goa - $90 paid by Vinoth, split equally (Goa group has Vinoth, Pavan, Ananya)
    this.createExpenseInternal('group_goa', {
      description: 'Seafood Dinner at Calangute',
      amount: 90,
      expenseDate: '2026-05-11T20:30:00Z',
      payerId: vinoth.id,
      splitType: 'equal',
      category: 'food_drink',
      notes: 'Delicious dinner near the beach'
    }, vinoth);

    // 2. Rent - $1200 paid by Ananya, split equally (Flat group has Ananya, Vinoth, Rahul)
    this.createExpenseInternal('group_flat', {
      description: 'May House Rent',
      amount: 1200,
      expenseDate: '2026-05-02T10:00:00Z',
      payerId: ananya.id,
      splitType: 'equal',
      category: 'utilities',
      notes: 'Sent to landlord'
    }, ananya);

    // 3. Electricity Bill - $150 paid by Rahul, split by shares (Ananya: 2 shares, Vinoth: 1 share, Rahul: 0 shares)
    // Wait, let's keep it simple: equal split of $150 paid by Rahul
    this.createExpenseInternal('group_flat', {
      description: 'Electricity Bill',
      amount: 150,
      expenseDate: '2026-05-05T15:00:00Z',
      payerId: rahul.id,
      splitType: 'equal',
      category: 'utilities'
    }, rahul);

    this.save();
  }

  // --- Groups API ---
  getGroups(): GroupSummaryDto[] {
    this.recalculateBalances();
    return this.data.groups.map(g => ({
      id: g.id,
      name: g.name,
      baseCurrency: g.baseCurrency,
      memberCount: g.members?.filter(m => m.status === 'active').length ?? 0,
      myBalance: g.myBalance,
      myRole: g.myRole,
      isArchived: g.isArchived,
      lastActivityAt: g.updatedAt,
      imageUrl: g.imageUrl
    }));
  }

  getGroup(groupId: string): GroupDto | null {
    this.recalculateBalances();
    const g = this.data.groups.find(x => x.id === groupId);
    return g ? { ...g } : null;
  }

  createGroup(req: CreateGroupRequest, actor: UserRefDto): GroupDto {
    const id = `group_${Date.now()}`;
    const newGroup: GroupDto = {
      id,
      name: req.name,
      description: req.description || '',
      baseCurrency: req.baseCurrency || 'USD',
      isArchived: false,
      memberCount: 1,
      myBalance: 0,
      myRole: 'admin',
      members: [
        { userId: actor.id, user: actor, role: 'admin', joinedAt: new Date().toISOString(), isActive: true, status: 'active' }
      ],
      createdBy: actor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageUrl: req.imageUrl,
      budgetLimit: req.budgetLimit
    };

    this.data.groups.push(newGroup);
    this.logActivity(id, actor, 'group_created', 'group', id, `${actor.displayName} created group "${req.name}"`);
    this.save();
    return newGroup;
  }

  updateGroup(groupId: string, req: any, actor: UserRefDto): GroupDto | null {
    const idx = this.data.groups.findIndex(g => g.id === groupId);
    if (idx === -1) return null;

    const g = this.data.groups[idx];
    this.data.groups[idx] = {
      ...g,
      ...req,
      updatedAt: new Date().toISOString()
    };

    this.logActivity(groupId, actor, 'group_updated', 'group', groupId, `${actor.displayName} updated the group settings`);
    this.save();
    return this.data.groups[idx];
  }

  archiveGroup(groupId: string, actor: UserRefDto): boolean {
    const g = this.data.groups.find(x => x.id === groupId);
    if (!g) return false;
    g.isArchived = true;
    g.updatedAt = new Date().toISOString();
    this.logActivity(groupId, actor, 'group_archived', 'group', groupId, `${actor.displayName} archived the group`);
    this.save();
    return true;
  }

  // --- Members API ---
  getMembers(groupId: string): GroupMemberDto[] {
    const g = this.getGroup(groupId);
    return g ? (g.members?.filter(m => m.status === 'active') || []) : [];
  }

  addMember(groupId: string, userId: string, role: 'admin' | 'member' | 'observer' = 'member', actor: UserRefDto): GroupMemberDto | null {
    const g = this.data.groups.find(x => x.id === groupId);
    if (!g) return null;

    if (!g.members) {
      g.members = [];
    }

    const existing = g.members.find(m => m.userId === userId);
    if (existing) {
      if (existing.status === 'removed') {
        existing.status = 'active';
        existing.role = role;
        existing.joinedAt = new Date().toISOString();
      } else {
        return existing; // already active
      }
    } else {
      const user = MOCK_USERS.find(u => u.id === userId);
      if (!user) return null;
      g.members.push({
        userId,
        user,
        role,
        joinedAt: new Date().toISOString(),
        isActive: true,
        status: 'active'
      });
    }

    g.updatedAt = new Date().toISOString();
    const targetUser = MOCK_USERS.find(u => u.id === userId);
    const targetName = targetUser ? targetUser.displayName : 'Unknown User';
    this.logActivity(groupId, actor, 'member_added', 'member', userId, `${actor.displayName} added ${targetName} to the group`);
    this.save();
    return g.members.find(m => m.userId === userId) || null;
  }

  removeMember(groupId: string, userId: string, actor: UserRefDto): { success: boolean; error?: string } {
    const g = this.data.groups.find(x => x.id === groupId);
    if (!g) return { success: false, error: 'Group not found' };

    const member = g.members?.find(m => m.userId === userId && m.status === 'active');
    if (!member) return { success: false, error: 'Member not found in group' };

    // Check outstanding balance
    this.recalculateBalances();
    const debts = this.getNetDebts(groupId);
    const balanceOwedOrOwing = debts.some(d => (d.fromUser?.id === userId || d.toUser?.id === userId) && d.amount > 0.005);
    if (balanceOwedOrOwing) {
      return { success: false, error: 'Cannot remove member: user has outstanding unsettled balances.' };
    }

    member.status = 'removed';
    g.updatedAt = new Date().toISOString();
    const targetUser = MOCK_USERS.find(u => u.id === userId);
    const targetName = targetUser ? targetUser.displayName : 'Unknown User';
    this.logActivity(groupId, actor, 'member_removed', 'member', userId, `${actor.displayName} removed ${targetName} from the group`);
    this.save();
    return { success: true };
  }

  // --- Expenses API ---
  getExpenses(groupId: string): ExpenseDto[] {
    return this.data.expenses.filter(e => e.groupId === groupId && e.status !== 'deleted');
  }

  createExpense(groupId: string, req: CreateExpenseRequest, actor: UserRefDto): ExpenseDto {
    const exp = this.createExpenseInternal(groupId, req, actor);
    this.save();
    return exp;
  }

  private createExpenseInternal(groupId: string, req: CreateExpenseRequest, actor: UserRefDto): ExpenseDto {
    const g = this.data.groups.find(x => x.id === groupId);
    if (!g) throw new Error('Group not found');

    const id = `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const payer = MOCK_USERS.find(u => u.id === req.payerId) || actor;

    const memberIds = (g.members?.filter(m => m.status === 'active') || []).map(m => m.userId);
    const splitValues: Record<string, number> = {};

    if (req.shares) {
      for (const s of req.shares) {
        splitValues[s.memberId] = s.amount ?? s.percentage ?? s.shareUnits ?? 0;
      }
    }

    const { shares: calculatedShares, error } = calculateShares(
      req.amount,
      memberIds,
      req.splitType,
      splitValues
    );

    if (error) {
      throw new Error(error);
    }

    const shares: ShareDto[] = calculatedShares.map((s, idx) => {
      const userRef = MOCK_USERS.find(u => u.id === s.userId) || { id: s.userId, displayName: 'Unknown User', email: '', avatarInitials: '?', avatarColor: '#cccccc' };
      return {
        id: `${id}_share_${idx}`,
        member: userRef,
        amount: s.amount,
        percentage: req.splitType === 'percentage' ? (splitValues[s.userId] || 0) : undefined,
        shareUnits: req.splitType === 'shares' ? (splitValues[s.userId] || 0) : undefined,
        isSettled: s.amount <= 0.005, // zero shares are pre-settled
        settledAmount: 0,
        remainingAmount: s.amount
      };
    });

    const newExpense: ExpenseDto = {
      id,
      groupId,
      description: req.description,
      amount: req.amount,
      expenseDate: req.expenseDate || new Date().toISOString(),
      payer,
      splitType: req.splitType,
      category: req.category || 'other',
      notes: req.notes,
      shares,
      hasReceipt: !!req.receiptUrl,
      receiptUrl: req.receiptUrl,
      status: 'active',
      isFullySettled: false,
      settledAmount: 0,
      remainingAmount: req.amount,
      createdBy: actor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: req.tags || []
    };

    this.data.expenses.push(newExpense);
    this.logActivity(groupId, actor, 'expense_added', 'expense', id, `${actor.displayName} added "${req.description}" of $${req.amount.toFixed(2)}`);
    return newExpense;
  }

  deleteExpense(groupId: string, expenseId: string, actor: UserRefDto): boolean {
    const e = this.data.expenses.find(x => x.id === expenseId && x.groupId === groupId);
    if (!e) return false;

    // Check if any shares are settled
    if (e.shares.some(s => s.settledAmount > 0)) {
      throw new Error('Cannot delete expense: some shares have already been settled.');
    }

    e.status = 'deleted';
    e.updatedAt = new Date().toISOString();
    this.logActivity(groupId, actor, 'expense_deleted', 'expense', expenseId, `${actor.displayName} deleted expense "${e.description}"`);
    this.save();
    return true;
  }

  // --- Settlements API ---
  getSettlements(groupId: string): SettlementDto[] {
    return this.data.settlements.filter(s => s.groupId === groupId);
  }

  createSettlement(groupId: string, req: CreateSettlementRequest, actor: UserRefDto): SettlementDto {
    const payer = req.payerId ? (MOCK_USERS.find(u => u.id === req.payerId) || actor) : actor;
    const payee = MOCK_USERS.find(u => u.id === req.payeeId) || { id: req.payeeId, displayName: 'Unknown User', email: '', avatarInitials: '?', avatarColor: '#cccccc' };
    const id = `settle_${Date.now()}`;

    // 1. Process chronological settlement onto expense shares
    let remainingPayment = req.amount;
    let sharesSettledCount = 0;
    let expensesSettledSet = new Set<string>();

    const activeExpenses = this.data.expenses.filter(
      e => e.groupId === groupId && e.status === 'active' && e.payer.id === payee.id
    );

    // Sort active expenses chronologically
    activeExpenses.sort((a, b) => new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime());

    for (const exp of activeExpenses) {
      if (remainingPayment <= 0.005) break;

      const payerShare = exp.shares.find(s => s.member.id === payer.id && !s.isSettled);
      if (payerShare) {
        const unpaid = Number((payerShare.amount - payerShare.settledAmount).toFixed(2));
        if (unpaid > 0) {
          expensesSettledSet.add(exp.id);
          if (remainingPayment >= unpaid) {
            payerShare.settledAmount = payerShare.amount;
            payerShare.isSettled = true;
            payerShare.remainingAmount = 0;
            payerShare.settledOn = req.settlementDate;
            remainingPayment = Number((remainingPayment - unpaid).toFixed(2));
            sharesSettledCount++;
          } else {
            payerShare.settledAmount = Number((payerShare.settledAmount + remainingPayment).toFixed(2));
            payerShare.remainingAmount = Number((payerShare.amount - payerShare.settledAmount).toFixed(2));
            remainingPayment = 0;
            sharesSettledCount++;
          }
        }
      }

      // Check if expense is now fully settled
      const allSettled = exp.shares.every(s => s.isSettled);
      if (allSettled) {
        exp.isFullySettled = true;
        exp.status = 'settled';
      }
      exp.settledAmount = exp.shares.reduce((acc, s) => acc + s.settledAmount, 0);
      exp.remainingAmount = Number((exp.amount - exp.settledAmount).toFixed(2));
    }

    const settlement: SettlementDto = {
      id,
      groupId,
      payer,
      payee,
      amount: req.amount,
      currency: 'USD',
      settlementDate: req.settlementDate || new Date().toISOString(),
      paymentMethod: req.paymentMethod || 'cash',
      transactionRef: req.transactionRef,
      notes: req.notes,
      status: 'completed',
      sharesSettled: sharesSettledCount,
      expensesIncluded: expensesSettledSet.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.settlements.push(settlement);
    this.logActivity(
      groupId,
      actor,
      'settlement_completed',
      'settlement',
      id,
      `${payer.displayName} paid ${payee.displayName} $${req.amount.toFixed(2)} (${req.paymentMethod || 'cash'})`
    );
    this.save();
    return settlement;
  }

  // --- Balances API ---
  getNetDebts(groupId: string): NetBalanceDto[] {
    const g = this.data.groups.find(x => x.id === groupId);
    if (!g) return [];

    const activeMembers = g.members?.filter(m => m.status === 'active') || [];
    const memberIds = activeMembers.map(m => m.userId);

    // 1. Calculate Gross Debts from active expenses
    // grossDebts[A][B] = how much A owes B
    const grossDebts: Record<string, Record<string, number>> = {};
    for (const idA of memberIds) {
      grossDebts[idA] = {};
      for (const idB of memberIds) {
        grossDebts[idA][idB] = 0;
      }
    }

    const groupExpenses = this.data.expenses.filter(e => e.groupId === groupId && e.status === 'active');
    for (const exp of groupExpenses) {
      const payerId = exp.payer.id;
      if (!memberIds.includes(payerId)) continue; // ignore deleted payer

      for (const share of exp.shares) {
        const debtorId = share.member.id;
        if (!memberIds.includes(debtorId)) continue; // ignore deleted member
        if (debtorId === payerId) continue; // no debt to self

        const unpaid = Number((share.amount - share.settledAmount).toFixed(2));
        if (unpaid > 0) {
          grossDebts[debtorId][payerId] = Number((grossDebts[debtorId][payerId] + unpaid).toFixed(2));
        }
      }
    }

    // 2. Perform Bidirectional Netting
    const netDebts: NetBalanceDto[] = [];
    const visited = new Set<string>();

    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const idA = memberIds[i];
        const idB = memberIds[j];

        const aOwesB = grossDebts[idA][idB];
        const bOwesA = grossDebts[idB][idA];

        const userA = MOCK_USERS.find(u => u.id === idA);
        const userB = MOCK_USERS.find(u => u.id === idB);

        if (!userA || !userB) continue;

        if (aOwesB > bOwesA) {
          const net = Number((aOwesB - bOwesA).toFixed(2));
          if (net > 0.005) {
            netDebts.push({
              fromUser: userA,
              toUser: userB,
              amount: net,
              currency: 'USD',
              unsettledExpenses: 1
            });
          }
        } else if (bOwesA > aOwesB) {
          const net = Number((bOwesA - aOwesB).toFixed(2));
          if (net > 0.005) {
            netDebts.push({
              fromUser: userB,
              toUser: userA,
              amount: net,
              currency: 'USD',
              unsettledExpenses: 1
            });
          }
        }
      }
    }

    return netDebts;
  }

  getGroupBalance(groupId: string, currentUserId: string): GroupBalanceDto | null {
    const g = this.data.groups.find(x => x.id === groupId);
    if (!g) return null;

    const netDebts = this.getNetDebts(groupId);
    let myTotalOwed = 0;
    let myTotalOwing = 0;

    for (const d of netDebts) {
      if (d.fromUser?.id === currentUserId) {
        myTotalOwing += d.amount;
      } else if (d.toUser?.id === currentUserId) {
        myTotalOwed += d.amount;
      }
    }

    return {
      groupId,
      groupName: g.name,
      baseCurrency: g.baseCurrency,
      netBalances: netDebts,
      myTotalOwed,
      myTotalOwing,
      netBalance: Number((myTotalOwed - myTotalOwing).toFixed(2)),
      lastUpdated: new Date().toISOString()
    };
  }

  getDashboardBalance(currentUserId: string): DashboardBalanceDto {
    this.recalculateBalances();
    let totalOwed = 0;
    let totalOwing = 0;

    const breakdowns: GroupBalanceSummaryDto[] = this.data.groups.map(g => {
      const bal = this.getGroupBalance(g.id, currentUserId);
      const balance = bal ? bal.netBalance : 0;
      if (balance > 0) totalOwed += balance;
      else if (balance < 0) totalOwing += Math.abs(balance);

      return {
        groupId: g.id,
        groupName: g.name,
        myBalance: balance,
        currency: g.baseCurrency,
        membersInvolved: g.members?.filter(m => m.status === 'active').length ?? 0,
        lastActivityAt: g.updatedAt
      };
    });

    return {
      totalOwed: Number(totalOwed.toFixed(2)),
      totalOwing: Number(totalOwing.toFixed(2)),
      netBalance: Number((totalOwed - totalOwing).toFixed(2)),
      currency: 'USD',
      groupBreakdown: breakdowns,
      updatedAt: new Date().toISOString()
    };
  }

  // --- Activities API ---
  getGroupActivity(groupId: string): ActivityDto[] {
    return this.data.activities
      .filter(a => a.groupId === groupId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getDashboardActivity(currentUserId: string): ActivityDto[] {
    // Return activities for all groups the user belongs to
    const myGroupIds = this.data.groups
      .filter(g => g.members?.some(m => m.userId === currentUserId && m.status === 'active'))
      .map(g => g.id);

    return this.data.activities
      .filter(a => myGroupIds.includes(a.groupId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Reports API ---
  getGroupReport(groupId: string): GroupReportDto | null {
    const g = this.getGroup(groupId);
    if (!g) return null;

    const expenses = this.getExpenses(groupId);
    const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

    // Calculate category breakdown
    const categoryTotals: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    for (const e of expenses) {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    }

    const categories = [
      { value: 'food_drink', label: 'Food & Drink' },
      { value: 'travel', label: 'Travel' },
      { value: 'utilities', label: 'Utilities' },
      { value: 'entertainment', label: 'Entertainment' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'subscription', label: 'Subscription' },
      { value: 'other', label: 'Other' }
    ];

    const categoryBreakdown = categories
      .map(c => {
        const amt = categoryTotals[c.value] || 0;
        return {
          category: c.value as any,
          label: c.label,
          amount: Number(amt.toFixed(2)),
          count: categoryCounts[c.value] || 0,
          percentage: totalAmount > 0 ? Number(((amt / totalAmount) * 100).toFixed(1)) : 0
        };
      })
      .filter(cb => cb.count > 0);

    // Member breakdown
    const memberTotals: Record<string, { paid: number; owed: number }> = {};
    const members = g.members || [];
    for (const m of members) {
      if (m.status === 'active') {
        memberTotals[m.userId] = { paid: 0, owed: 0 };
      }
    }

    for (const e of expenses) {
      if (memberTotals[e.payer.id]) {
        memberTotals[e.payer.id].paid += e.amount;
      }
      for (const s of e.shares) {
        if (memberTotals[s.member.id]) {
          memberTotals[s.member.id].owed += s.amount;
        }
      }
    }

    const memberBreakdown = members
      .filter(m => m.status === 'active')
      .map(m => {
        const totals = memberTotals[m.userId] || { paid: 0, owed: 0 };
        return {
          member: m.user,
          totalPaid: Number(totals.paid.toFixed(2)),
          totalOwed: Number(totals.owed.toFixed(2)),
          netBalance: Number((totals.paid - totals.owed).toFixed(2))
        };
      });

    return {
      groupId,
      groupName: g.name,
      totalExpenses: expenses.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      period: {
        fromDate: g.createdAt,
        toDate: new Date().toISOString()
      },
      categoryBreakdown,
      memberBreakdown,
      timeline: []
    };
  }

  // --- Helper utilities ---
  private logActivity(
    groupId: string,
    actor: UserRefDto,
    action: any,
    entityType: any,
    entityId: string,
    description: string
  ) {
    const g = this.data.groups.find(x => x.id === groupId);
    const groupName = g ? g.name : 'Unknown Group';

    this.data.activities.push({
      id: `act_${Date.now()}`,
      groupId,
      groupName,
      actor,
      action,
      entityType,
      entityId,
      description,
      metadata: {},
      createdAt: new Date().toISOString()
    });
  }

  private recalculateBalances() {
    for (const g of this.data.groups) {
      const activeMembers = g.members?.filter(m => m.status === 'active') || [];
      const vinothMem = activeMembers.find(m => m.userId === 'user_vinoth');

      if (vinothMem) {
        g.myRole = vinothMem.role;
        const bal = this.getGroupBalance(g.id, 'user_vinoth');
        g.myBalance = bal ? bal.netBalance : 0;
      } else {
        g.myBalance = 0;
        g.myRole = 'observer';
      }
    }
  }
}

export const mockDb = new MockDb();
