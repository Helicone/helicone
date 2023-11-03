import { Env } from "..";
import { AuthParams } from "../lib/dbLogger/DBLoggable";
import { Result } from "../results";
import { Alerts, ActiveAlerts, AlertMetricEvent } from "./AtomicAlerter";

export class Alerter {
  constructor(
    private alerter: Env["ALERTER"],
    private authParams: AuthParams
  ) {}

  async metricEvent(
    metricEvent: AlertMetricEvent
  ): Promise<Result<ActiveAlerts[], string>> {
    const alerterId = this.alerter.idFromName(this.authParams.organizationId);
    const alerter = this.alerter.get(alerterId);

    const alerterRes = await alerter.fetch(
      "https://www.this_does_matter.helicone.ai/event",
      {
        method: "POST",
        body: JSON.stringify(metricEvent),
        headers: {
          "content-type": "application/json",
        },
      }
    );

    if (!alerterRes.ok) {
      return { data: null, error: "Failed to process event" };
    }

    const alerts = (await alerterRes.json()) as ActiveAlerts[];

    return {
      data: alerts,
      error: null,
    };
  }

  async upsertAlerts(alerts: Alerts): Promise<Result<null, string>> {
    const alerterId = this.alerter.idFromName(this.authParams.organizationId);
    const alerter = this.alerter.get(alerterId);

    const alerterRes = await alerter.fetch(
      "https://www.this_does_matter.helicone.ai/alerts",
      {
        method: "POST",
        body: JSON.stringify(alerts),
        headers: {
          "content-type": "application/json",
        },
      }
    );

    if (!alerterRes.ok) {
      return { data: null, error: "Failed to upsert alerts" };
    }

    return {
      data: null,
      error: null,
    };
  }

  async deleteAlert(alertId: string): Promise<Result<null, string>> {
    const alerterId = this.alerter.idFromName(this.authParams.organizationId);
    const alerter = this.alerter.get(alerterId);

    const alerterRes = await alerter.fetch(
      `https://www.this_does_matter.helicone.ai/alert/${alertId}`,
      {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
        },
      }
    );

    if (!alerterRes.ok) {
      return { data: null, error: "Failed to delete config" };
    }

    return {
      data: null,
      error: null,
    };
  }
}
