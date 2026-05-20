/**
 * Currency Utility
 * Handles currency formatting and balance calculations.
 */

export function formatCurrency(amount: number, currency = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export function balanceStatus(netBalance: number): 'owed' | 'owing' | 'settled' {
  if (netBalance > 0.005) return 'owed';
  if (netBalance < -0.005) return 'owing';
  return 'settled';
}
