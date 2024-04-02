import { AuthParams } from "../lib/db/supabase";

export class BaseManager {
  constructor(protected authParams: AuthParams) {}
}
