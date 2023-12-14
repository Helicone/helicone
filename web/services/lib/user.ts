import { UserSettingsResponse } from "../../pages/api/user_settings";

/**
 * Retrieves the user settings from the server.
 * @returns A promise that resolves to the user settings response, or null if the request fails.
 */
const getUserSettings = async () => {
  fetch("/api/user_settings").then((res) => {
    if (res.status === 200) {
      return res.json() as Promise<UserSettingsResponse>;
    } else {
      res.text();

      return null;
    }
  });
};

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

/**
 * Checks if a role has a specific permission.
 * @param role - The role to check.
 * @param permission - The permission to check.
 * @returns True if the role has the permission, false otherwise.
 */
function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export { getUserSettings, Role, Permission, hasPermission };
