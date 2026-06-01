import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Plain JS implementation of calculateShares to avoid ts-node loading issues
function calculateShares(totalAmount, memberIds, splitType, splitValues = {}) {
  if (memberIds.length === 0) {
    return { shares: [], isValid: false, error: 'No members specified' };
  }
  if (totalAmount <= 0) {
    return { shares: [], isValid: false, error: 'Amount must be greater than 0' };
  }

  const shares = [];
  switch (splitType) {
    case 'equal': {
      const shareCount = memberIds.length;
      const baseShare = Math.floor((totalAmount * 100) / shareCount) / 100;
      let sum = 0;

      for (let i = 0; i < shareCount; i++) {
        const amount = i === shareCount - 1 ? Number((totalAmount - sum).toFixed(2)) : baseShare;
        shares.push({ userId: memberIds[i], amount });
        sum = Number((sum + amount).toFixed(2));
      }
      return { shares, isValid: true };
    }

    case 'exact': {
      let sum = 0;
      for (const uid of memberIds) {
        const val = splitValues[uid] || 0;
        shares.push({ userId: uid, amount: val });
        sum = Number((sum + val).toFixed(2));
      }
      const diff = Math.abs(sum - totalAmount);
      if (diff > 0.015) {
        return {
          shares,
          isValid: false,
          error: `The sum of exact amounts (${sum}) must equal the total amount (${totalAmount})`
        };
      }
      if (diff > 0) {
        const adj = sum < totalAmount ? 0.01 : -0.01;
        const target = shares.find(s => s.amount > 0) || shares[0];
        if (target) {
          target.amount = Number((target.amount + adj).toFixed(2));
        }
      }
      return { shares, isValid: true };
    }

    case 'percentage': {
      let percentSum = 0;
      let amountSum = 0;

      for (const uid of memberIds) {
        const pct = splitValues[uid] || 0;
        percentSum += pct;
        const amt = Math.round(totalAmount * pct) / 100;
        shares.push({ userId: uid, amount: amt });
        amountSum = Number((amountSum + amt).toFixed(2));
      }

      if (Math.abs(percentSum - 100) > 0.01) {
        return {
          shares,
          isValid: false,
          error: `The sum of percentages (${percentSum}%) must equal 100%`
        };
      }

      const diff = Number((totalAmount - amountSum).toFixed(2));
      if (diff !== 0) {
        const target = shares.find((_, index) => (splitValues[memberIds[index]] || 0) > 0) || shares[0];
        if (target) {
          target.amount = Number((target.amount + diff).toFixed(2));
        }
      }
      return { shares, isValid: true };
    }

    case 'shares': {
      let totalShares = 0;
      for (const uid of memberIds) {
        totalShares += splitValues[uid] || 0;
      }

      if (totalShares <= 0) {
        return {
          shares,
          isValid: false,
          error: 'Total shares must be greater than 0'
        };
      }

      let amountSum = 0;
      const nonZeroIds = memberIds.filter(uid => (splitValues[uid] || 0) > 0);

      for (let i = 0; i < memberIds.length; i++) {
        const uid = memberIds[i];
        const weight = splitValues[uid] || 0;
        if (weight === 0) {
          shares.push({ userId: uid, amount: 0 });
          continue;
        }

        const amt = Math.floor((totalAmount * weight * 100) / totalShares) / 100;
        shares.push({ userId: uid, amount: amt });
        amountSum = Number((amountSum + amt).toFixed(2));
      }

      const diff = Number((totalAmount - amountSum).toFixed(2));
      if (diff !== 0 && nonZeroIds.length > 0) {
        const target = shares.find(s => s.userId === nonZeroIds[0]);
        if (target) {
          target.amount = Number((target.amount + diff).toFixed(2));
        }
      }

      return { shares, isValid: true };
    }

    default:
      return { shares: [], isValid: false, error: 'Invalid split type' };
  }
}

// Standard mock platform users
const MOCK_USERS = [
  { id: 'user_vinoth', displayName: 'Vinoth Kumar', email: 'vinoth.kumar@company.com', avatarInitials: 'VK', avatarColor: '#4f46e5' },
  { id: 'user_pavan', displayName: 'Pavan (PO)', email: 'pavan.po@company.com', avatarInitials: 'P', avatarColor: '#16a34a' },
  { id: 'user_ananya', displayName: 'Ananya (Dev)', email: 'ananya.dev@company.com', avatarInitials: 'A', avatarColor: '#ea580c' },
  { id: 'user_rahul', displayName: 'Rahul (Dev)', email: 'rahul.dev@company.com', avatarInitials: 'R', avatarColor: '#2563eb' }
];

const CURRENT_USER = {
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

// In-Memory Database State
let dbGroups = [];
let dbExpenses = [];
let dbSettlements = [];
let dbActivities = [];

function wrapResponse(data) {
  return {
    success: true,
    data: data,
    meta: null,
    errors: null,
    timestamp: new Date().toISOString(),
    requestId: `req_${Math.random().toString(36).substring(2, 9)}`
  };
}

function logActivity(groupId, actor, action, entityType, entityId, description) {
  const g = dbGroups.find(x => x.id === groupId);
  const groupName = g ? g.name : 'Unknown Group';

  dbActivities.push({
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

function getNetDebts(groupId) {
  const g = dbGroups.find(x => x.id === groupId);
  if (!g) return [];

  const activeMembers = g.members?.filter(m => m.status === 'active') || [];
  const memberIds = activeMembers.map(m => m.userId);

  const grossDebts = {};
  for (const idA of memberIds) {
    grossDebts[idA] = {};
    for (const idB of memberIds) {
      grossDebts[idA][idB] = 0;
    }
  }

  const groupExpenses = dbExpenses.filter(e => e.groupId === groupId && e.status === 'active');
  for (const exp of groupExpenses) {
    const payerId = exp.payer.id;
    if (!memberIds.includes(payerId)) continue;

    for (const share of exp.shares) {
      const debtorId = share.member.id;
      if (!memberIds.includes(debtorId)) continue;
      if (debtorId === payerId) continue;

      const unpaid = Number((share.amount - share.settledAmount).toFixed(2));
      if (unpaid > 0) {
        grossDebts[debtorId][payerId] = Number((grossDebts[debtorId][payerId] + unpaid).toFixed(2));
      }
    }
  }

  const netDebts = [];
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

function getGroupBalance(groupId, currentUserId) {
  const g = dbGroups.find(x => x.id === groupId);
  if (!g) return null;

  const netDebts = getNetDebts(groupId);
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

function recalculateBalances() {
  for (const g of dbGroups) {
    const activeMembers = g.members?.filter(m => m.status === 'active') || [];
    const vinothMem = activeMembers.find(m => m.userId === 'user_vinoth');

    if (vinothMem) {
      g.myRole = vinothMem.role;
      const bal = getGroupBalance(g.id, 'user_vinoth');
      g.myBalance = bal ? bal.netBalance : 0;
    } else {
      g.myBalance = 0;
      g.myRole = 'observer';
    }
  }
}

function seedDatabase() {
  const vinoth = MOCK_USERS[0];
  const pavan = MOCK_USERS[1];
  const ananya = MOCK_USERS[2];
  const rahul = MOCK_USERS[3];

  dbGroups = [
    {
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
    },
    {
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
    }
  ];

  dbActivities = [
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
  ];

  const createSeedExpense = (groupId, req, actor) => {
    const g = dbGroups.find(x => x.id === groupId);
    if (!g) return;

    const id = `exp_seed_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const payer = MOCK_USERS.find(u => u.id === req.payerId) || actor;
    const memberIds = (g.members?.filter(m => m.status === 'active') || []).map(m => m.userId);

    const { shares: calculatedShares } = calculateShares(req.amount, memberIds, req.splitType);

    const shares = calculatedShares.map((s, idx) => {
      const userRef = MOCK_USERS.find(u => u.id === s.userId) || { id: s.userId, displayName: 'Unknown User', email: '', avatarInitials: '?', avatarColor: '#cccccc' };
      return {
        id: `${id}_share_${idx}`,
        member: userRef,
        amount: s.amount,
        isSettled: s.amount <= 0.005,
        settledAmount: 0,
        remainingAmount: s.amount
      };
    });

    dbExpenses.push({
      id,
      groupId,
      description: req.description,
      amount: req.amount,
      expenseDate: req.expenseDate || new Date().toISOString(),
      payer,
      splitType: req.splitType,
      category: req.category || 'other',
      shares,
      hasReceipt: false,
      status: 'active',
      isFullySettled: false,
      settledAmount: 0,
      remainingAmount: req.amount,
      createdBy: actor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: []
    });
  };

  createSeedExpense('group_goa', {
    description: 'Seafood Dinner at Calangute',
    amount: 90,
    expenseDate: '2026-05-11T20:30:00Z',
    payerId: vinoth.id,
    splitType: 'equal',
    category: 'food_drink'
  }, vinoth);

  createSeedExpense('group_flat', {
    description: 'May House Rent',
    amount: 1200,
    expenseDate: '2026-05-02T10:00:00Z',
    payerId: ananya.id,
    splitType: 'equal',
    category: 'utilities'
  }, ananya);

  createSeedExpense('group_flat', {
    description: 'Electricity Bill',
    amount: 150,
    expenseDate: '2026-05-05T15:00:00Z',
    payerId: rahul.id,
    splitType: 'equal',
    category: 'utilities'
  }, rahul);

  recalculateBalances();
}

seedDatabase();

// 1. GET /groups
app.get('/api/x_split/v1/groups', (req, res) => {
  recalculateBalances();
  const list = dbGroups.map(g => ({
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
  res.json(wrapResponse(list));
});

// 2. GET /groups/:groupId
app.get('/api/x_split/v1/groups/:groupId', (req, res) => {
  recalculateBalances();
  const g = dbGroups.find(x => x.id === req.params.groupId);
  if (!g) {
    return res.status(404).json({ success: false, errors: [{ message: 'Group not found' }] });
  }
  res.json(wrapResponse(g));
});

// 3. POST /groups
app.post('/api/x_split/v1/groups', (req, res) => {
  const body = req.body;
  const actor = CURRENT_USER;
  const id = `group_${Date.now()}`;
  const newGroup = {
    id,
    name: body.name,
    description: body.description || '',
    baseCurrency: body.baseCurrency || 'USD',
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
    imageUrl: body.imageUrl,
    budgetLimit: body.budgetLimit
  };

  dbGroups.push(newGroup);
  logActivity(id, actor, 'group_created', 'group', id, `${actor.displayName} created group "${body.name}"`);
  recalculateBalances();
  res.status(201).json(wrapResponse(newGroup));
});

// 4. PUT /groups/:groupId
app.put('/api/x_split/v1/groups/:groupId', (req, res) => {
  const g = dbGroups.find(x => x.id === req.params.groupId);
  if (!g) {
    return res.status(404).json({ success: false, errors: [{ message: 'Group not found' }] });
  }
  Object.assign(g, req.body, { updatedAt: new Date().toISOString() });
  logActivity(g.id, CURRENT_USER, 'group_updated', 'group', g.id, `${CURRENT_USER.displayName} updated the group settings`);
  recalculateBalances();
  res.json(wrapResponse(g));
});

// 5. DELETE /groups/:groupId
app.delete('/api/x_split/v1/groups/:groupId', (req, res) => {
  const g = dbGroups.find(x => x.id === req.params.groupId);
  if (!g) {
    return res.status(404).json({ success: false, errors: [{ message: 'Group not found' }] });
  }
  g.isArchived = true;
  g.updatedAt = new Date().toISOString();
  logActivity(g.id, CURRENT_USER, 'group_archived', 'group', g.id, `${CURRENT_USER.displayName} archived the group`);
  recalculateBalances();
  res.json(wrapResponse(null));
});

// 6. GET /groups/:groupId/members
app.get('/api/x_split/v1/groups/:groupId/members', (req, res) => {
  const g = dbGroups.find(x => x.id === req.params.groupId);
  if (!g) {
    return res.status(404).json({ success: false, errors: [{ message: 'Group not found' }] });
  }
  const members = g.members?.filter(m => m.status === 'active') || [];
  res.json(wrapResponse(members));
});

// 7. POST /groups/:groupId/members
app.post('/api/x_split/v1/groups/:groupId/members', (req, res) => {
  const g = dbGroups.find(x => x.id === req.params.groupId);
  if (!g) {
    return res.status(404).json({ success: false, errors: [{ message: 'Group not found' }] });
  }

  const { userId, role } = req.body;
  if (!g.members) g.members = [];

  const existing = g.members.find(m => m.userId === userId);
  if (existing) {
    if (existing.status === 'removed') {
      existing.status = 'active';
      existing.role = role || 'member';
      existing.joinedAt = new Date().toISOString();
    } else {
      return res.json(wrapResponse(existing));
    }
  } else {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, errors: [{ message: 'User not found' }] });
    }
    g.members.push({
      userId,
      user,
      role: role || 'member',
      joinedAt: new Date().toISOString(),
      isActive: true,
      status: 'active'
    });
  }

  g.updatedAt = new Date().toISOString();
  const targetUser = MOCK_USERS.find(u => u.id === userId);
  const targetName = targetUser ? targetUser.displayName : 'Unknown User';
  logActivity(g.id, CURRENT_USER, 'member_added', 'member', userId, `${CURRENT_USER.displayName} added ${targetName} to the group`);
  recalculateBalances();
  res.json(wrapResponse(g.members.find(m => m.userId === userId)));
});

// 8. DELETE /groups/:groupId/members/:userId
app.delete('/api/x_split/v1/groups/:groupId/members/:userId', (req, res) => {
  const g = dbGroups.find(x => x.id === req.params.groupId);
  if (!g) {
    return res.status(404).json({ success: false, errors: [{ message: 'Group not found' }] });
  }

  const member = g.members?.find(m => m.userId === req.params.userId && m.status === 'active');
  if (!member) {
    return res.status(404).json({ success: false, errors: [{ message: 'Member not found' }] });
  }

  const debts = getNetDebts(g.id);
  const balanceOwedOrOwing = debts.some(d => (d.fromUser?.id === req.params.userId || d.toUser?.id === req.params.userId) && d.amount > 0.005);
  if (balanceOwedOrOwing) {
    return res.status(400).json({ success: false, errors: [{ message: 'Cannot remove member: user has outstanding unsettled balances.' }] });
  }

  member.status = 'removed';
  g.updatedAt = new Date().toISOString();
  const targetUser = MOCK_USERS.find(u => u.id === req.params.userId);
  const targetName = targetUser ? targetUser.displayName : 'Unknown User';
  logActivity(g.id, CURRENT_USER, 'member_removed', 'member', req.params.userId, `${CURRENT_USER.displayName} removed ${targetName} from the group`);
  recalculateBalances();
  res.json(wrapResponse(null));
});

// 9. GET /groups/:groupId/expenses
app.get('/api/x_split/v1/groups/:groupId/expenses', (req, res) => {
  const list = dbExpenses.filter(e => e.groupId === req.params.groupId && e.status !== 'deleted');
  res.json(wrapResponse(list));
});

// 10. POST /groups/:groupId/expenses
app.post('/api/x_split/v1/groups/:groupId/expenses', (req, res) => {
  const { groupId } = req.params;
  const body = req.body;
  const actor = CURRENT_USER;

  const g = dbGroups.find(x => x.id === groupId);
  if (!g) {
    return res.status(404).json({ success: false, errors: [{ message: 'Group not found' }] });
  }

  const id = `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const payer = MOCK_USERS.find(u => u.id === body.payerId) || actor;
  const memberIds = (g.members?.filter(m => m.status === 'active') || []).map(m => m.userId);

  const splitValues = {};
  if (body.shares) {
    for (const s of body.shares) {
      splitValues[s.memberId] = s.amount ?? s.percentage ?? s.shareUnits ?? 0;
    }
  }

  const { shares: calculatedShares, error } = calculateShares(
    body.amount,
    memberIds,
    body.splitType,
    splitValues
  );

  if (error) {
    return res.status(400).json({ success: false, errors: [{ message: error }] });
  }

  const shares = calculatedShares.map((s, idx) => {
    const userRef = MOCK_USERS.find(u => u.id === s.userId) || { id: s.userId, displayName: 'Unknown User', email: '', avatarInitials: '?', avatarColor: '#cccccc' };
    return {
      id: `${id}_share_${idx}`,
      member: userRef,
      amount: s.amount,
      percentage: body.splitType === 'percentage' ? (splitValues[s.userId] || 0) : undefined,
      shareUnits: body.splitType === 'shares' ? (splitValues[s.userId] || 0) : undefined,
      isSettled: s.amount <= 0.005,
      settledAmount: 0,
      remainingAmount: s.amount
    };
  });

  const newExpense = {
    id,
    groupId,
    description: body.description,
    amount: body.amount,
    expenseDate: body.expenseDate || new Date().toISOString(),
    payer,
    splitType: body.splitType,
    category: body.category || 'other',
    notes: body.notes,
    shares,
    hasReceipt: !!body.receiptUrl,
    receiptUrl: body.receiptUrl,
    status: 'active',
    isFullySettled: false,
    settledAmount: 0,
    remainingAmount: body.amount,
    createdBy: actor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: body.tags || []
  };

  dbExpenses.push(newExpense);
  logActivity(groupId, actor, 'expense_added', 'expense', id, `${actor.displayName} added "${body.description}" of $${body.amount.toFixed(2)}`);
  recalculateBalances();
  res.status(201).json(wrapResponse(newExpense));
});

// 11. DELETE /groups/:groupId/expenses/:expenseId
app.delete('/api/x_split/v1/groups/:groupId/expenses/:expenseId', (req, res) => {
  const e = dbExpenses.find(x => x.id === req.params.expenseId && x.groupId === req.params.groupId);
  if (!e) {
    return res.status(404).json({ success: false, errors: [{ message: 'Expense not found' }] });
  }

  if (e.shares.some(s => s.settledAmount > 0)) {
    return res.status(400).json({ success: false, errors: [{ message: 'Cannot delete expense: some shares have already been settled.' }] });
  }

  e.status = 'deleted';
  e.updatedAt = new Date().toISOString();
  logActivity(e.groupId, CURRENT_USER, 'expense_deleted', 'expense', e.id, `${CURRENT_USER.displayName} deleted expense "${e.description}"`);
  recalculateBalances();
  res.json(wrapResponse(null));
});

// 12. GET /groups/:groupId/settlements
app.get('/api/x_split/v1/groups/:groupId/settlements', (req, res) => {
  const list = dbSettlements.filter(s => s.groupId === req.params.groupId);
  res.json(wrapResponse(list));
});

// 13. POST /groups/:groupId/settlements
app.post('/api/x_split/v1/groups/:groupId/settlements', (req, res) => {
  const { groupId } = req.params;
  const body = req.body;
  const actor = CURRENT_USER;

  const payer = body.payerId ? (MOCK_USERS.find(u => u.id === body.payerId) || actor) : actor;
  const payee = MOCK_USERS.find(u => u.id === body.payeeId) || { id: body.payeeId, displayName: 'Unknown User', email: '', avatarInitials: '?', avatarColor: '#cccccc' };
  const id = `settle_${Date.now()}`;

  let remainingPayment = body.amount;
  let sharesSettledCount = 0;
  let expensesSettledSet = new Set();

  const activeExpenses = dbExpenses.filter(
    e => e.groupId === groupId && e.status === 'active' && e.payer.id === payee.id
  );

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
          payerShare.settledOn = body.settlementDate;
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

    const allSettled = exp.shares.every(s => s.isSettled);
    if (allSettled) {
      exp.isFullySettled = true;
      exp.status = 'settled';
    }
    exp.settledAmount = exp.shares.reduce((acc, s) => acc + s.settledAmount, 0);
    exp.remainingAmount = Number((exp.amount - exp.settledAmount).toFixed(2));
  }

  const settlement = {
    id,
    groupId,
    payer,
    payee,
    amount: body.amount,
    currency: 'USD',
    settlementDate: body.settlementDate || new Date().toISOString(),
    paymentMethod: body.paymentMethod || 'cash',
    transactionRef: body.transactionRef,
    notes: body.notes,
    status: 'completed',
    sharesSettled: sharesSettledCount,
    expensesIncluded: expensesSettledSet.size,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbSettlements.push(settlement);
  logActivity(
    groupId,
    actor,
    'settlement_completed',
    'settlement',
    id,
    `${payer.displayName} paid ${payee.displayName} $${body.amount.toFixed(2)} (${body.paymentMethod || 'cash'})`
  );
  recalculateBalances();
  res.status(201).json(wrapResponse(settlement));
});

// 14. GET /groups/:groupId/balances
app.get('/api/x_split/v1/groups/:groupId/balances', (req, res) => {
  const bal = getGroupBalance(req.params.groupId, 'user_vinoth');
  res.json(wrapResponse(bal ? [bal] : []));
});

// 15. GET /dashboard/balances
app.get('/api/x_split/v1/dashboard/balances', (req, res) => {
  recalculateBalances();
  const currentUserId = 'user_vinoth';
  let totalOwed = 0;
  let totalOwing = 0;

  const breakdowns = dbGroups.map(g => {
    const bal = getGroupBalance(g.id, currentUserId);
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

  res.json(wrapResponse({
    totalOwed: Number(totalOwed.toFixed(2)),
    totalOwing: Number(totalOwing.toFixed(2)),
    netBalance: Number((totalOwed - totalOwing).toFixed(2)),
    currency: 'USD',
    groupBreakdown: breakdowns,
    updatedAt: new Date().toISOString()
  }));
});

// 16. GET /groups/:groupId/activity
app.get('/api/x_split/v1/groups/:groupId/activity', (req, res) => {
  const list = dbActivities
    .filter(a => a.groupId === req.params.groupId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(wrapResponse(list));
});

// 17. GET /dashboard/activity
app.get('/api/x_split/v1/dashboard/activity', (req, res) => {
  const currentUserId = 'user_vinoth';
  const myGroupIds = dbGroups
    .filter(g => g.members?.some(m => m.userId === currentUserId && m.status === 'active'))
    .map(g => g.id);

  const list = dbActivities
    .filter(a => myGroupIds.includes(a.groupId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(wrapResponse(list));
});

// 18. GET /groups/:groupId/reports/summary
app.get('/api/x_split/v1/groups/:groupId/reports/summary', (req, res) => {
  const g = dbGroups.find(x => x.id === req.params.groupId);
  if (!g) {
    return res.status(404).json({ success: false, errors: [{ message: 'Group not found' }] });
  }

  const expenses = dbExpenses.filter(e => e.groupId === req.params.groupId && e.status !== 'deleted');
  const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  const categoryTotals = {};
  const categoryCounts = {};
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
        category: c.value,
        label: c.label,
        amount: Number(amt.toFixed(2)),
        count: categoryCounts[c.value] || 0,
        percentage: totalAmount > 0 ? Number(((amt / totalAmount) * 100).toFixed(1)) : 0
      };
    })
    .filter(cb => cb.count > 0);

  const memberTotals = {};
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

  const report = {
    groupId: g.id,
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

  res.json(wrapResponse(report));
});

app.listen(PORT, () => {
  console.log(`🚀 Scoped REST API Backend Server is running on http://localhost:${PORT}`);
});
