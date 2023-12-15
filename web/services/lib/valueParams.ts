import { ValueParam } from "../../lib/api/values/valueParams";
import { Result } from "../../lib/result";

export const getValueParams = async () => {
  const resp = await fetch("/api/prompt_values/params");
  const data = await resp.json();
  return data as Result<ValueParam[], string>;
};
