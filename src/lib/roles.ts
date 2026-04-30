export const ROLE_RANK: Record<string, number> = {
  employee: 1,
  manager: 2,
  admin: 3,
  owner: 4,
}

export function hasRole(userRole: string, required: string): boolean {
  return (ROLE_RANK[userRole] ?? 0) >= (ROLE_RANK[required] ?? 99)
}