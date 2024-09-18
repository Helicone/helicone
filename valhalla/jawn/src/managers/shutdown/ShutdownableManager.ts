import { AuthParams } from "../../lib/db/supabase";
import { BaseManager } from "../BaseManager";
import { ShutdownService } from "./ShutdownService";

export abstract class ShutdownableManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
    ShutdownService.getInstance().addHandler(() => this.shutdown());
  }

  public abstract shutdown(): Promise<void>;
}
