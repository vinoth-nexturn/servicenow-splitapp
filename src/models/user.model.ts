/**
 * User Model (DTOs)
 * Represents authenticated user entities
 */

export interface UserRefDto {
  id: string;
  displayName: string;
  email: string;
  avatarInitials: string;
  avatarColor: string;
}

export interface CurrentUserDto extends UserRefDto {
  roles: string[];
  timezone: string;
  locale: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications_enabled: boolean;
  default_currency: string;
}

export type UserRole = 'admin' | 'member' | 'observer';

export interface UserGroupMemberDto extends UserRefDto {
  role: UserRole;
  joinedAt: string;
  isActive: boolean;
}

export interface UserProfileDto extends CurrentUserDto {
  phone?: string;
  groups_count: number;
  total_expenses: number;
  total_owed: number;
  total_owing: number;
}
