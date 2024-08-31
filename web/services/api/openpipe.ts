import { heliconeRequest } from "../lib/heliconeRequest";

export const addOpenPipeKey = async (apiKey: string, organizationId: string) => {
  const response = await heliconeRequest("/api/openpipe/key", {
    method: "POST",
    body: JSON.stringify({ apiKey, organizationId }),
  });
  return response.json();
};

export const getOpenPipeKey = async (organizationId: string) => {
  const response = await heliconeRequest(`/api/openpipe/key/${organizationId}`);
  return response.json();
};