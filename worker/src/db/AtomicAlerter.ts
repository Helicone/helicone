import { Database } from "../../supabase/database.types";
import { Result } from "../results";

const ALERT_KEY = "alerts";

export type Alerts = Record<string, Alert>;

export type Alert = Database["public"]["Tables"]["alert"]["Row"] & {
  state: AlertState;
};

export type AlertMetricEvent = {
  timestamp: number;
  metrics: Record<string, { count: number; total: number }>;
};

type AlertHistory = Database["public"]["Tables"]["alert_history"]["Row"];

type AlertState = {
  timeBlocks: Array<TimeBlock>;
  metricValues: {
    counts: number;
    totals: number;
  };
  triggerState: AlertTriggerState;
};

type TimeBlock = {
  startTimestamp: number;
  count: number;
  total: number;
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

export type ResolvedAlert =
  Database["public"]["Tables"]["alert_history"]["Update"];
type TriggeredAlert = Database["public"]["Tables"]["alert_history"]["Insert"];

export type ActiveAlerts = {
  triggered: TriggeredAlert[];
  resolved: ResolvedAlert[];
};

export class AtomicAlerter {
  private metricsToAlerts: Record<string, string[]> = {};
  private alerts: Alerts | null = null;

  constructor(private state: DurableObjectState) {
    this.state.blockConcurrencyWhile(async () => {
      this.alerts = (await this.state.storage.get<Alerts>(ALERT_KEY)) || null;
      this.metricsToAlerts = this.buildMetricsToAlertsMap(this.alerts);
    });
  }

  async hasAlertsEnabled(): Promise<boolean> {
    const alerts =
      this.alerts ?? (await this.state.storage.get<Alert>(ALERT_KEY));
    const hasAlerts = alerts !== undefined && Object.keys(alerts).length > 0;
    return hasAlerts;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (true) {
      case url.pathname === "/events" && request.method === "POST":
        return await this.processEvents(request);

      case url.pathname === "/alerts" && request.method === "POST":
        return await this.upsertAlert(request);

      case url.pathname.match("/^/alerts/w+$/") && request.method === "DELETE":
        return await this.deleteAlert(request);

      case url.pathname.match(/^\/alerts\/\w+\/resolve$/) &&
        request.method === "GET":
        return await this.resolveAlert(request);

      default:
        return new Response("Not Found", { status: 404 });
    }
  }

  async resolveAlert(request: Request): Promise<Response> {
    const alertToResolve = (await request.json()) as AlertHistory;
    const activeAlerts = await this.resolveAlertStatusTrx(alertToResolve);

    if (activeAlerts.error) {
      return new Response(activeAlerts.error, { status: 400 });
    }

    return new Response(JSON.stringify(activeAlerts), {
      headers: { "Content-Type": "application/json" },
    });
  }

  async resolveAlertStatusTrx(
    alertToResolve: AlertHistory
  ): Promise<Result<ResolvedAlert, null>> {
    let resolvedAlert: ResolvedAlert | null = null;
    await this.state.storage.transaction(async (txn) => {
      const alertId = alertToResolve.alert_id;
      const alert = this.alerts?.[alertId];
      if (!alert) {
        console.error(`Alert for id ${alertId} not found`);
        return { data: null, error: "Alert not found" };
      }

      // Check if the alert is still triggered
      const alertUpdate = await this.checkAlert(alert, Date.now());

      if (alertUpdate.status === "resolved") {
        resolvedAlert = this.resolveAlertState(alert, alertUpdate);
      }

      await txn.put(ALERT_KEY, this.alerts);
    });

    return { data: resolvedAlert, error: null };
  }

  async upsertAlert(request: Request): Promise<Response> {
    const newAlert = (await request.json()) as Alert;
    const upsertRes = await this.upsertAlertsTrx(newAlert);

    if (upsertRes.error) {
      return new Response(upsertRes.error, { status: 400 });
    }

    return new Response("OK");
  }

  async upsertAlertsTrx(newAlert: Alert): Promise<Result<null, string>> {
    await this.state.storage.transaction(async (txn) => {
      await txn.put(ALERT_KEY, {});
      const currentAlerts = (await txn.get<Alerts>(ALERT_KEY)) || {};
      currentAlerts[newAlert.id] = newAlert;
      await txn.put(ALERT_KEY, currentAlerts);
      this.alerts = currentAlerts;

      this.metricsToAlerts = this.buildMetricsToAlertsMap(this.alerts);
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

    await this.state.storage.transaction(async (txn) => {
      let currentAlerts = (await txn.get<Alerts>(ALERT_KEY)) || {};
      if (currentAlerts[alertId]) {
        delete currentAlerts[alertId];

        await txn.put(ALERT_KEY, currentAlerts);
        this.alerts = currentAlerts;
        this.metricsToAlerts = this.buildMetricsToAlertsMap(this.alerts);
      } else {
        error = "Alert not found";
      }
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
    const activeAlerts: ActiveAlerts = {
      triggered: [],
      resolved: [],
    };

    await this.state.storage.transaction(async (txn) => {
      for (const [metric, { count, total }] of Object.entries(event.metrics)) {
        const alertIds = this.metricsToAlerts[metric] || [];
        for (const alertId of alertIds) {
          const alert = this.alerts?.[alertId];
          if (!alert) {
            console.error(`Alert for id ${alertId} not found`);
            continue;
          }

          const eventTime = event.timestamp;
          const timeBlockDuration = alert.time_block_duration;
          const windowStart = eventTime - alert.time_window;

          if (!alert.state) {
            alert.state = {
              timeBlocks: [],
              metricValues: { counts: 0, totals: 0 },
              triggerState: { triggered: false },
            };
          } else if (!alert.state.timeBlocks) {
            alert.state.timeBlocks = [];
          }

          let latestBlock: TimeBlock | null = null;
          let updatedBlocks: TimeBlock[] = [];
          for (const block of alert.state.timeBlocks) {
            if (block.startTimestamp >= windowStart) {
              updatedBlocks.push(block);
              latestBlock = block;
            } else {
              alert.state.metricValues.counts -= block.count;
              alert.state.metricValues.totals -= block.total;
            }
          }

          const isWithinCurrentBlock =
            latestBlock &&
            eventTime - latestBlock.startTimestamp < timeBlockDuration;
          if (latestBlock && isWithinCurrentBlock) {
            // Update the existing block
            latestBlock.count += count;
            latestBlock.total += total;
          } else {
            // The event starts a new block
            updatedBlocks.push({
              startTimestamp: eventTime - (eventTime % timeBlockDuration),
              count,
              total,
            });
          }

          alert.state.metricValues.counts += count;
          alert.state.metricValues.totals += total;

          // Update the state with the processed blocks
          alert.state.timeBlocks = updatedBlocks;

          const alertUpdate = await this.checkAlert(alert, event.timestamp);

          switch (alertUpdate.status) {
            case "triggered":
              activeAlerts.triggered.push(
                this.triggerAlertState(alert, alertUpdate)
              );
              break;
            case "resolved":
              activeAlerts.resolved.push(
                this.resolveAlertState(alert, alertUpdate)
              );
              break;
            case "unchanged":
            default:
              break;
          }
        }
      }
      await txn.put(ALERT_KEY, this.alerts);
    });

    console.log("Alert State", JSON.stringify(this.alerts, null, 2));
    console.log("Active alerts", activeAlerts);

    return { data: activeAlerts, error: null };
  }

  private async checkAlert(
    alert: Alert,
    eventTimestamp: number
  ): Promise<AlertStatusUpdate> {
    const alertState = alert.state;
    const rate =
      (alertState.metricValues.counts / alertState.metricValues.totals) * 100;

    if (rate >= alert.threshold && !alertState.triggerState.triggered) {
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

  private resolveAlertState(
    alert: Alert,
    alertStatusUpdate: AlertStatusUpdate
  ): ResolvedAlert {
    alert.state.triggerState.triggered = false;
    alert.state.triggerState.triggeredAt = undefined;
    alert.state.triggerState.triggeredThreshold = undefined;

    return this.mapAlertToUpdate(alertStatusUpdate, alert.id, alert);
  }

  private triggerAlertState(
    alert: Alert,
    alertStatusUpdate: AlertStatusUpdate
  ): TriggeredAlert {
    alert.state.triggerState = {
      triggered: true,
      triggeredAt: alertStatusUpdate.timestamp,
      triggeredThreshold: alertStatusUpdate.triggeredThreshold,
    };

    return this.mapAlertToInsert(alertStatusUpdate, alert.id, alert);
  }

  private mapAlertToInsert(
    alertUpdate: AlertStatusUpdate,
    alertId: string,
    alert: Alert
  ): Database["public"]["Tables"]["alert_history"]["Insert"] {
    return {
      alert_id: alertId,
      alert_start_time: new Date(alertUpdate.timestamp).toISOString(),
      alert_metric: alert.metric,
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
      alert_metric: alert.metric,
      org_id: alert.org_id,
      soft_delete: false,
      status: "resolved",
      triggered_value: `${alertUpdate.triggeredThreshold}`,
    };
  }

  private buildMetricsToAlertsMap(
    alerts: Alerts | null
  ): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    if (alerts) {
      for (const [id, alert] of Object.entries(alerts)) {
        if (alert && alert.metric) {
          if (!map[alert.metric]) {
            map[alert.metric] = [];
          }
          map[alert.metric].push(id);
        }
      }
    }

    return map;
  }
}
