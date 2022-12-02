export interface DavinciRequest {
  max_tokens: number;
  model: string;
  prompt: string;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  stop: string[];
  n: number;
}

export interface Request {
  auth_hash: string;
  created_at: string;
  id: string;
  path: string;
  body: DavinciRequest | any | null;
}
