export const APP_CONFIG = {
  name: 'SplitApp',
  version: '1.0.0',
  environment: 'development',

  // API Configuration
  api: {
    baseUrl: '',
    timeout: 30000,
    retryAttempts: 3,
    enableLogging: true,
  },

  // Feature Flags
  features: {
    reports:        true,
    activityFeed:   true,
    receiptUpload:  true,
    darkMode:       true,
    exportCsv:      false,
    exportPdf:      true,
    notifications:  false,
    multiCurrency:  false,
    payments:       false,
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    minPageSize: 5,
  },

  // Currency
  currency: {
    default: 'USD',
    symbol: '$',
    locale: 'en-US',
    supported: ['USD', 'EUR', 'GBP', 'INR'],
  },

  // Date & Time
  date: {
    displayFormat: 'MMM d, yyyy',
    inputFormat:   'yyyy-MM-dd',
    timeFormat:    'HH:mm',
  },

  // UI/UX
  ui: {
    toastDuration:    4000,
    skeletonRows:     5,
    navBreakpoint:    768,
    panelWidth:       420,
    animationsEnabled: true,
    theme: 'light' as const,
  },

  // Cache Durations (ms)
  cache: {
    groups:    1 * 60 * 1000,
    expenses:  2 * 60 * 1000,
    balances:  5 * 60 * 1000,
    user:      30 * 60 * 1000,
    activities: 10 * 60 * 1000,
  },

  // Expense Categories
  categories: [
    { value: 'food_drink',    label: 'Food & Drink',   icon: '🍽️' },
    { value: 'travel',        label: 'Travel',          icon: '✈️' },
    { value: 'utilities',     label: 'Utilities',       icon: '💡' },
    { value: 'entertainment', label: 'Entertainment',   icon: '🎬' },
    { value: 'healthcare',    label: 'Healthcare',      icon: '🏥' },
    { value: 'subscription',  label: 'Subscription',    icon: '📱' },
    { value: 'other',         label: 'Other',           icon: '📦' },
  ] as const,

  // Split Types
  splitTypes: [
    { value: 'equal',      label: 'Split equally',      description: 'Divide evenly among all members' },
    { value: 'exact',      label: 'Exact amounts',      description: 'Specify the exact amount per person' },
    { value: 'percentage', label: 'By percentage',      description: 'Specify the % each person owes' },
    { value: 'shares',     label: 'By shares',          description: 'Assign weight units per person' },
  ] as const,

  // Payment Methods
  paymentMethods: [
    { value: 'cash',           label: 'Cash' },
    { value: 'bank_transfer',  label: 'Bank Transfer' },
    { value: 'upi',            label: 'UPI' },
    { value: 'card',           label: 'Card' },
    { value: 'paypal',         label: 'PayPal' },
    { value: 'other',          label: 'Other' },
  ] as const,

  // User Roles
  roles: {
    admin: 'admin',
    member: 'member',
    observer: 'observer',
  } as const,

  // Security
  security: {
    enableCSRFProtection: true,
    sessionTimeout: 24 * 60 * 60 * 1000,
    tokenRefreshInterval: 15 * 60 * 1000,
  },

  // Validation
  validation: {
    minGroupName: 1,
    maxGroupName: 100,
    minExpenseDescription: 1,
    maxExpenseDescription: 500,
    minAmount: 0.01,
    maxAmount: 999999.99,
  },

  // Logging
  logging: {
    level: 'info',
    enableConsole: true,
    enableRemote: false,
  },
} as const;

export type FeatureFlag = keyof typeof APP_CONFIG.features;
export type ExpenseCategory = typeof APP_CONFIG.categories[number]['value'];
export type SplitType = typeof APP_CONFIG.splitTypes[number]['value'];
export type PaymentMethod = typeof APP_CONFIG.paymentMethods[number]['value'];
export type UserRole = typeof APP_CONFIG.roles[keyof typeof APP_CONFIG.roles];

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return APP_CONFIG.features[feature];
}

export function getCategoryLabel(value: string): string {
  return APP_CONFIG.categories.find(c => c.value === value)?.label || 'Unknown';
}

export function getSplitTypeLabel(value: string): string {
  return APP_CONFIG.splitTypes.find(s => s.value === value)?.label || 'Unknown';
}

export function getPaymentMethodLabel(value: string): string {
  return APP_CONFIG.paymentMethods.find(p => p.value === value)?.label || 'Unknown';
}
