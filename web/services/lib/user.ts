import { UserSettingsResponse } from "../../pages/api/user_settings";
import axios from "axios";

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

export { getUserSettings };
