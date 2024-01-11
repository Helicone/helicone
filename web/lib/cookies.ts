import Cookies from "js-cookie";
import { SUPABASE_AUTH_TOKEN } from "./constants";
import { Result, err } from "./result";

export function getHeliconeCookie(): Result<
  {
    jwtToken: string;
  },
  string
> {
  const authFromCookie = Cookies.get(SUPABASE_AUTH_TOKEN);
  if (!authFromCookie) {
    return err("No auth token found in cookie");
  }
  const decodedCookie = decodeURIComponent(authFromCookie);
  const parsedCookie = JSON.parse(decodedCookie);
  const jwtToken = parsedCookie[0];
  return {
    data: {
      jwtToken,
    },
    error: null,
  };
}
