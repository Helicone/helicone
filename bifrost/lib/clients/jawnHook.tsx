import { getJawnClient } from "./jawn";

export const useJawnClient = (apiKey?: string) => {
  // const org = useOrg();
  return getJawnClient(apiKey);
};
