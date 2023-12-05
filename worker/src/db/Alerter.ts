import { Env } from "..";
import { Result, err, ok } from "../results";
import { Alerts, ActiveAlerts, AlertMetricEvent } from "./AtomicAlerter";

export class Alerter {
  constructor(
    private alerter: Env["ALERTER"],
    private organizationId: string
  ) {}

  async processMetricEvent(
    metricEvent: AlertMetricEvent
  ): Promise<Result<ActiveAlerts, string>> {
    const alerterRes = await this.fetch<ActiveAlerts>("events", {
      method: "POST",
      body: JSON.stringify(metricEvent),
    });

    if (alerterRes.error || !alerterRes.data) {
      return err("Failed to process event");
    }

    return ok(alerterRes.data);
  }

  async upsertAlerts(alerts: Alerts): Promise<Result<null, string>> {
    const alerterRes = await this.fetch("alerts", {
      method: "POST",
      body: JSON.stringify(alerts),
    });

    if (!alerterRes.error) {
      return err("Failed to upsert alerts");
    }

    return ok(null);
  }

  async deleteAlert(alertId: string): Promise<Result<null, string>> {
    const alerterRes = await this.fetch(`alerts/${alertId}`, {
      method: "DELETE",
    });

    if (alerterRes.error) {
      return err(alerterRes.error);
    }

    return ok(null);
  }

  private async fetch<T>(
    path: string,
    options: RequestInit<RequestInitCfProperties>
  ): Promise<Result<T, string>> {
    const alerterId = this.alerter.idFromName(this.organizationId);
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
