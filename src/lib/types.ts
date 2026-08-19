export type UserRole = 'super_admin' | 'user';
export type UserStatus = 'active' | 'pause';
export type ServiceType = 'staging' | 'live';
export type UserCurrency = 'BDT' | 'INR' | 'USD' | 'EUR' | 'PHP';

export const USER_CURRENCIES: UserCurrency[] = ['BDT', 'INR', 'USD', 'EUR', 'PHP'];

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  prefix: string;
  whitelistDomain: string;
  whitelistIp: string;
  ggrBalance: number;
  ggrDeductionPercent: number;
  currency: UserCurrency;
  status: UserStatus;
  serviceType: ServiceType;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  apiSecretMasked?: string;
  hasApiSecret?: boolean;
  canRevealSecret?: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  details?: unknown;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  whitelistDomain?: string;
  whitelistIp?: string;
  ggrBalance?: number;
  ggrDeductionPercent?: number;
  currency?: UserCurrency;
  status?: UserStatus;
  serviceType?: ServiceType;
  prefix?: string;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  password?: string;
  whitelistDomain?: string;
  whitelistIp?: string;
  ggrBalance?: number;
  ggrDeductionPercent?: number;
  currency?: UserCurrency;
  status?: UserStatus;
  serviceType?: ServiceType;
}

export type TransactionResult = 'win' | 'loss';

export interface UserTransactionItem {
  id: string;
  serial_number: string;
  game_uid: string;
  member_account: string;
  bet_amount: number;
  win_amount: number;
  result: TransactionResult;
  ggrDeduction: number;
  currency_code: string;
  timestamp: string;
  game_round: string;
}

export interface UserBettingStats {
  totalBetAmount: number;
  totalWin: number;
  totalLoss: number;
  totalGgrDeduction: number;
  transactionCount: number;
  winCount: number;
  lossCount: number;
}

export interface UserTransactionsPayload {
  currentGgrBalance: number;
  ggrDeductionPercent: number;
  currency: UserCurrency;
  items: UserTransactionItem[];
  pagination: Pagination;
  stats: UserBettingStats;
}

export interface UserDetailsPayload {
  user: User;
  stats: UserBettingStats;
}
