export const USER_ROLES = ['cliente', 'organizador', 'portero'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export class RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}