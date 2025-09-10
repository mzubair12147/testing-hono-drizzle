export const userRoles = ["user", "admin", "moderator"] as const;
export type UserRole = (typeof userRoles)[number];
