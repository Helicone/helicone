import { AuthParams } from "../../lib/db/supabase";
import { Result } from "../../lib/shared/result";
import {
  AlertRequest,
  AlertResponse,
  AlertStore,
} from "../../lib/stores/AlertStore";
import { BaseManager } from "../BaseManager";

export class AlertManager extends BaseManager {
  private alertStore: AlertStore;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.alertStore = new AlertStore(authParams.organizationId);
  }

  async getAlerts(): Promise<Result<AlertResponse, string>> {
    return this.alertStore.getAlerts();
  }

  async createAlert(alert: AlertRequest): Promise<Result<string, string>> {
    return this.alertStore.createAlert(alert);
  }

  async deleteAlert(alertId: string): Promise<Result<null, string>> {
    return this.alertStore.deleteAlert(alertId);
  }
}
