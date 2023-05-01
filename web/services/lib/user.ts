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

const createUserSettings = async (userId: string, tier: string) => {
  fetch("/api/user_settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: userId,
      tier: tier,
    }),
  }).then((res) => {
    if (res.status === 200) {
      return res.json() as Promise<UserSettingsResponse>;
    } else {
      res.text();
      return null;
    }
  });
};

export { getUserSettings };
