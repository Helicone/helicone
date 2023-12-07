import { Env } from "..";
import { Database } from "../../supabase/database.types";
import { Result, err, ok } from "../results";
import { ActiveAlerts, AlertMetricEvent, ResolvedAlert } from "./AtomicAlerter";

export class Alerter {
  constructor(private alerter: Env["ALERTER"]) {}

  async processMetricEvent(
    metricEvent: AlertMetricEvent,
    organizationId: string
  ): Promise<Result<ActiveAlerts, string>> {
    const alerterRes = await this.fetch<ActiveAlerts>(
      "events",
      {
        method: "POST",
        body: JSON.stringify(metricEvent),
      },
      organizationId
    );

    if (alerterRes.error || !alerterRes.data) {
      return err(`Failed to process event. ${alerterRes.error}`);
    }

    return ok(alerterRes.data);
  }

  async resolveTriggeredAlert(
    triggeredAlert: Database["public"]["Tables"]["alert_history"]["Row"]
  ): Promise<Result<ResolvedAlert, string>> {
    const response = await this.fetch<ResolvedAlert>(
      `alerts/${triggeredAlert.id}/resolve`,
      {
        method: "GET",
        body: JSON.stringify(triggeredAlert),
      },
      triggeredAlert.org_id
    );

    if (response.error || !response.data) {
      return err(`Failed to resolve alerts. ${response.error}`);
    }

    return ok(response.data);
  }

  async upsertAlert(
    alert: Database["public"]["Tables"]["alert"]["Row"]
  ): Promise<Result<null, string>> {
    const alerterRes = await this.fetch(
      "alerts",
      {
        method: "POST",
        body: JSON.stringify(alert),
      },
      alert.org_id
    );

    if (!alerterRes.error) {
      return err("Failed to upsert alerts");
    }

    return ok(null);
  }

  async deleteAlert(
    alertId: string,
    organizationId: string
  ): Promise<Result<null, string>> {
    const alerterRes = await this.fetch(
      `alerts/${alertId}`,
      {
        method: "DELETE",
      },
      organizationId
    );

    if (alerterRes.error) {
      return err(alerterRes.error);
    }

    return ok(null);
  }

  private async fetch<T>(
    path: string,
    options: RequestInit<RequestInitCfProperties>,
    organizationId: string
  ): Promise<Result<T, string>> {
    const alerterId = this.alerter.idFromName(organizationId);
    const alerter = this.alerter.get(alerterId);

    const url = `https://www.this_does_matter.helicone.ai/${path}`;
    options.headers = {
      ...options.headers,
      "content-type": "application/json",
    };
    try {
      const response = await alerter.fetch(url, options);

      if (!response.ok) {
        return err(`Failed to fetch. Status: ${response.status}`);
      }

      const data = (await response.json()) as T;
      return ok(data);
    } catch (error) {
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }
}
