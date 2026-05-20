/**
 * Split Calculator Utility
 * Handles splitting logic for expense shares and ensures sums balance exactly.
 */

export interface SplitShare {
  userId: string;
  amount: number;
}

export function calculateShares(
  totalAmount: number,
  memberIds: string[],
  splitType: 'equal' | 'exact' | 'percentage' | 'shares',
  splitValues: Record<string, number> = {}
): { shares: SplitShare[]; isValid: boolean; error?: string } {
  if (memberIds.length === 0) {
    return { shares: [], isValid: false, error: 'No members specified' };
  }
  if (totalAmount <= 0) {
    return { shares: [], isValid: false, error: 'Amount must be greater than 0' };
  }

  const shares: SplitShare[] = [];
  let calculatedSum = 0;

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
      // If there is a small rounding difference (e.g. 0.01), adjust the first non-zero share
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
        // Adjust the first share with non-zero percentage
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
        // Adjust the first member with non-zero weight
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
