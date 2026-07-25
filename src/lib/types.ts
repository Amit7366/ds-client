export type UserRole = 'super_admin' | 'user';
export type UserStatus = 'active' | 'pause';
export type ServiceType = 'staging' | 'live';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  prefix: string;
  whitelistDomain: string;
  whitelistIp: string;
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
  status?: UserStatus;
  serviceType?: ServiceType;
}
