import { Database } from "../../supabase/database.types";
import { Result } from "../results";

const ALERT_KEY = "alerts";

export type Alerts = Record<string, Alert>;

type Alert = Database["public"]["Tables"]["alert"]["Row"];

export type AlertMetricEvent = {
  timestamp: number;
  metrics: Record<string, { count: number; total: number }>;
};

type AlertState = {
  timestamps: Array<{
    timestamp: number;
    count: number;
    total: number;
  }>;
  metricValues: {
    counts: number;
    totals: number;
  };
  triggerState: AlertTriggerState;
};

type AlertTriggerState = {
  triggered: boolean;
  triggeredThreshold?: number;
  triggeredAt?: number;
};

type AlertStatusUpdate = {
  status: "triggered" | "resolved" | "unchanged";
  timestamp: number;
  triggeredThreshold?: number;
};

export type ActiveAlerts = {
  triggered: Database["public"]["Tables"]["alert_history"]["Insert"][];
  resolved: Database["public"]["Tables"]["alert_history"]["Update"][];
};

export class AtomicAlerter {
  private state: DurableObjectState;
  private alerts: Alerts | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;

    this.state.blockConcurrencyWhile(async () => {
      this.alerts = (await this.state.storage.get<Alerts>(ALERT_KEY)) || null;
    });
  }

  async hasAlertsEnabled(): Promise<boolean> {
    const alerts = await this.state.storage.get<Alert>(ALERT_KEY);
    const hasAlerts = alerts !== undefined && Object.keys(alerts).length > 0;
    return hasAlerts;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (true) {
      case url.pathname === "/events" && request.method === "POST":
        return await this.processEvents(request);

      case url.pathname === "/alerts" && request.method === "POST":
        return await this.upsertAlerts(request);

      case url.pathname.startsWith("/alerts/") && request.method === "DELETE":
        return await this.deleteAlert(request);

      default:
        return new Response("Not Found", { status: 404 });
    }
  }

  async upsertAlerts(request: Request): Promise<Response> {
    const newAlerts = (await request.json()) as Alerts;
    const upsertRes = await this.upsertAlertsTrx(newAlerts);

    if (upsertRes.error) {
      return new Response(upsertRes.error, { status: 400 });
    }

    return new Response("OK");
  }

  async upsertAlertsTrx(newAlerts: Alerts): Promise<Result<null, string>> {
    await this.state.storage.transaction(async (txn) => {
      let currentAlerts = (await txn.get<Alerts>(ALERT_KEY)) || {};

      for (const [alertId, alert] of Object.entries(newAlerts)) {
        if (alert) {
          currentAlerts[alertId] = alert;
        }
      }

      await txn.put(ALERT_KEY, currentAlerts);
      this.alerts = currentAlerts;
    });

    return { data: null, error: null };
  }

  async deleteAlert(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const alertId = url.pathname.split("/").pop();
    if (!alertId) {
      return new Response("Bad Request: Missing id", { status: 400 });
    }

    const deleteRes = await this.deleteAlertTrx(alertId);
    if (deleteRes.error) {
      return new Response(deleteRes.error, { status: 400 });
    }

    return new Response("OK");
  }

  async deleteAlertTrx(alertId: string): Promise<Result<null, string>> {
    let error = null;

    await this.state.storage
      .transaction(async (txn) => {
        let currentAlerts = (await txn.get<Alerts>(ALERT_KEY)) || {};
        if (currentAlerts[alertId]) {
          delete currentAlerts[alertId];
          await txn.put(ALERT_KEY, currentAlerts);
          if (this.alerts) {
            delete this.alerts[alertId];
          }
        } else {
          error = "Alert not found";
        }
      })
      .catch((txnError) => {
        error = txnError.message || "Transaction failed";
      });

    return error ? { data: null, error } : { data: null, error: null };
  }

  async processEvents(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Expected POST", { status: 405 });
    }

    const alertMetricEvent = (await request.json()) as AlertMetricEvent;
    const activeAlerts = await this.processEventTrx(alertMetricEvent);

    if (activeAlerts.error) {
      return new Response(activeAlerts.error, { status: 400 });
    }

    return new Response(JSON.stringify(activeAlerts.data ?? {}), {
      headers: { "Content-Type": "application/json" },
    });
  }

  async processEventTrx(
    event: AlertMetricEvent
  ): Promise<Result<ActiveAlerts, string>> {
    const now = Date.now();
    let activeAlerts: ActiveAlerts = {
      triggered: [],
      resolved: [],
    };

    await this.state.storage.transaction(async (txn) => {
      for (const [alertId, { count, total }] of Object.entries(event.metrics)) {
        const alert = this.alerts?.[alertId];
        if (!alert) {
          console.error(`Alert for id ${alertId} not found`);
          continue;
        }

        const windowStart = now - alert.time_window;
        let alertState: AlertState = (await txn.get<AlertState>(alertId)) || {
          timestamps: [],
          metricValues: { counts: 0, totals: 0 },
          triggerState: {
            triggered: false,
          },
        };

        // Add the new event
        alertState.metricValues.counts += count;
        alertState.metricValues.totals += total;
        alertState.timestamps.push({
          timestamp: event.timestamp,
          count,
          total,
        });

        // Remove old events and subtract their values
        while (
          alertState.timestamps.length > 0 &&
          alertState.timestamps[0].timestamp < windowStart
        ) {
          alertState.metricValues.counts -= alertState.timestamps[0].count;
          alertState.metricValues.totals -= alertState.timestamps[0].total;
          alertState.timestamps.shift();
        }

        const alertUpdate = await this.checkAlert(
          alert,
          alertState,
          event.timestamp
        );

        switch (alertUpdate.status) {
          case "triggered":
            alertState.triggerState = {
              triggered: true,
              triggeredAt: alertUpdate.timestamp,
              triggeredThreshold: alertUpdate.triggeredThreshold,
            };
            activeAlerts.triggered.push(
              this.mapAlertToInsert(alertUpdate, alertId, alert)
            );
            break;
          case "resolved":
            alertState.triggerState.triggered = false;
            alertState.triggerState.triggeredAt = undefined; // Reset triggeredAt
            activeAlerts.resolved.push(
              this.mapAlertToUpdate(alertUpdate, alertId, alert)
            );
            break;
          case "unchanged":
            break;
          default:
            break;
        }

        await txn.put(alertId, alertState);
      }
    });

    return { data: activeAlerts, error: null };
  }

  private async checkAlert(
    alert: Alert,
    alertState: AlertState,
    eventTimestamp: number
  ): Promise<AlertStatusUpdate> {
    const rate =
      (alertState.metricValues.counts / alertState.metricValues.totals) * 100;

    if (rate > alert.threshold && !alertState.triggerState.triggered) {
      return {
        status: "triggered",
        timestamp: eventTimestamp,
        triggeredThreshold: rate,
      };
    } else if (rate <= alert.threshold && alertState.triggerState.triggered) {
      return {
        status: "resolved",
        timestamp: eventTimestamp,
      };
    }

    return { status: "unchanged", timestamp: eventTimestamp };
  }

  private mapAlertToInsert(
    alertUpdate: AlertStatusUpdate,
    alertId: string,
    alert: Alert
  ): Database["public"]["Tables"]["alert_history"]["Insert"] {
    return {
      alert_id: alertId,
      alert_start_time: new Date(alertUpdate.timestamp).toISOString(),
      alert_type: alert.type,
      org_id: alert.org_id,
      soft_delete: false,
      status: "triggered",
      triggered_value: `${alertUpdate.triggeredThreshold}`,
    };
  }

  private mapAlertToUpdate(
    alertUpdate: AlertStatusUpdate,
    alertId: string,
    alert: Alert
  ): Database["public"]["Tables"]["alert_history"]["Update"] {
    return {
      alert_id: alertId,
      alert_end_time: new Date(alertUpdate.timestamp).toISOString(),
      alert_type: alert.type,
      org_id: alert.org_id,
      soft_delete: false,
      status: "resolved",
      triggered_value: `${alertUpdate.triggeredThreshold}`,
    };
  }
}
