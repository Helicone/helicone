import { UserSettingsResponse } from "../../pages/api/user_settings";

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
  MANAGE_ALERTS = "manageAlerts",
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [Permission.MANAGE_KEYS, Permission.MANAGE_ALERTS],
  [Role.OWNER]: [Permission.MANAGE_KEYS, Permission.MANAGE_ALERTS],
  [Role.MEMBER]: [],
};

function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export { getUserSettings, Role, Permission, hasPermission };
