import { Database } from "../../lib/db/database.types";
import { AuthParams } from "../../lib/db/supabase";
import { Result } from "../../lib/shared/result";
import { AlertStore } from "../../lib/stores/AlertStore";
import { BaseManager } from "../BaseManager";
export interface AlertRequest {
  name: string;
  metric: string;
  threshold: number;
  time_window: string;
  emails: string[];
  slack_channels: string[];
  minimum_request_count: number | undefined;
}

export interface AlertHistory {
  alert_end_time: string | null;
  alert_id: string;
  alert_metric: string;
  alert_name: string;
  alert_start_time: string;
  created_at: string | null;
  id: string;
  org_id: string;
  soft_delete: boolean;
  status: string;
  triggered_value: string;
  updated_at: string | null;
}

export interface AlertResponse {
  alerts: Database["public"]["Tables"]["alert"]["Row"][];
  history: Database["public"]["Tables"]["alert_history"]["Row"][];
}
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
