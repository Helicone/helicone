import { Database } from "../../supabase/database.types";

export type ResponseAndRequest = Omit<
  Database["public"]["Views"]["response_and_request_rbac"]["Row"],
  "response_body" | "request_body"
> & {
  response_body: {
    choices:
      | {
          text: any;
          logprobs: {
            token_logprobs: number[];
          };
        }[]
      | null;
    usage:
      | {
          total_tokens: number;
        }
      | null
      | undefined;
    model: string;
    error?: any;
  } | null;
  request_body: {
    prompt: string;
    max_tokens: number;
    model: string;
    temperature: number;
  } | null;
};
