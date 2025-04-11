enum Role {
  ADMIN = "admin",
  OWNER = "owner",
  MEMBER = "member",
}

enum Permission {
  MANAGE_KEYS = "manageKeys",
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [Permission.MANAGE_KEYS],
  [Role.OWNER]: [Permission.MANAGE_KEYS],
  [Role.MEMBER]: [],
};

function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export { Role, Permission, hasPermission };
