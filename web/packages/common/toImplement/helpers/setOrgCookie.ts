import Cookies from "js-cookie";

export const ORG_ID_COOKIE_KEY = "helicone-org-id";

export const setOrgCookie = (orgId: string | "none") => {
  if (orgId === "none") {
    Cookies.remove(ORG_ID_COOKIE_KEY);
  } else {
    Cookies.set(ORG_ID_COOKIE_KEY, orgId, { expires: 30 });
  }
};

export const clearSupabaseCookies = () => {
  Cookies.remove("supabae-auth-token");
};
