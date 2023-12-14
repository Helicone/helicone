import axios from "axios";
import { ValueParam } from "../../lib/api/values/valueParams";
import { Result } from "../../lib/result";

/**
 * Retrieves the value parameters from the server.
 * @returns A promise that resolves to an array of ValueParam objects, or rejects with an error message.
 */
export const getValueParams = async () => {
  const resp = await axios.get("/api/prompt_values/params");
  return resp.data as Result<ValueParam[], string>;
};
