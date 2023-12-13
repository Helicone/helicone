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
  firstBelowThresholdAt?: number;
};

type AlertStatusUpdate = {
  status: "triggered" | "resolved" | "below_threshold" | "unchanged";
  timestamp: number;
  triggeredThreshold?: number;
};

export type ResolvedAlert =
  Database["public"]["Tables"]["alert_history"]["Update"] & {
    alert: Omit<Alert, "state">;
  };
export type TriggeredAlert =
  Database["public"]["Tables"]["alert_history"]["Insert"] & {
    alert: Omit<Alert, "state">;
  };

export type ActiveAlerts = {
  triggered: TriggeredAlert[];
  resolved: ResolvedAlert[];
};

const uuidPattern =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const COOLDOWN_PERIOD_MS = 5 * 60 * 1000;
export class AtomicAlerter {
  private metricsToAlerts: Record<string, string[]> = {};
  private alerts: Alerts | null = null;

  constructor(private state: DurableObjectState) {
    this.state.blockConcurrencyWhile(async () => {
      this.alerts = (await this.state.storage.get<Alerts>(ALERT_KEY)) || null;
      this.metricsToAlerts = this.buildMetricsToAlertsMap(this.alerts);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (true) {
      case url.pathname === "/events" && request.method === "POST":
        return await this.processEvents(request);

      case url.pathname === "/alerts" && request.method === "POST":
        return await this.upsertAlert(request);

      case url.pathname.match(new RegExp(`^/alerts/${uuidPattern}$`)) &&
        request.method === "DELETE":
        return await this.deleteAlert(request);

      case url.pathname.match(new RegExp(`^/alerts/${uuidPattern}/resolve$`)) &&
        request.method === "POST":
        return await this.resolveAlert(request);

      default:
        return this.createResponse("Not Found", 404);
    }
  }

  async resolveAlert(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return this.createResponse("Expected POST", 405);
    }

    const url = new URL(request.url);
    const alertId = url.pathname.split("/")[2];
    const { data: resolvedAlert, error: resolvedAlertErr } =
      await this.resolveAlertStatusTrx(alertId);

    if (resolvedAlertErr) {
      return this.createResponse(resolvedAlertErr, 400);
    }

    return this.createResponse(resolvedAlert, 200);
  }

  async resolveAlertStatusTrx(
    alertId: string
  ): Promise<Result<ResolvedAlert, null>> {
    let resolvedAlert: ResolvedAlert | null = null;
    await this.state.storage.transaction(async (txn) => {
      const alert = this.alerts?.[alertId];

      if (!alert) {
        console.error(`Alert for id ${alertId} not found`);
        return { data: null, error: "Alert not found" };
      }

      const eventTime = Date.now();
      const windowStart = eventTime - alert.time_window;
      const updatedBlocks: TimeBlock[] = [];
      for (const block of alert.state.timeBlocks) {
        if (block.startTimestamp >= windowStart) {
          updatedBlocks.push(block);
        } else {
          alert.state.metricValues.counts -= block.count;
          alert.state.metricValues.totals -= block.total;
        }
      }

      alert.state.timeBlocks = updatedBlocks;

      // Check if the alert is still triggered
      const alertUpdate = await this.checkAlert(alert, eventTime);

      if (alertUpdate.status === "resolved") {
        resolvedAlert = this.resolveAlertState(alert, alertUpdate);
      } else if (alertUpdate.status === "below_threshold") {
        alert.state.triggerState.firstBelowThresholdAt = alertUpdate.timestamp;
      }

      await txn.put(ALERT_KEY, this.alerts);
    });

    return { data: resolvedAlert, error: null };
  }

  async upsertAlert(request: Request): Promise<Response> {
    const newAlert = (await request.json()) as Alert;
    const upsertRes = await this.upsertAlertsTrx(newAlert);

    if (upsertRes.error) {
      return this.createResponse(upsertRes.error, 400);
    }

    return this.createResponse("OK", 200);
  }

  async upsertAlertsTrx(newAlert: Alert): Promise<Result<null, string>> {
    await this.state.storage.transaction(async (txn) => {
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
      return this.createResponse("Bad Request: Missing id", 400);
    }

    const deleteRes = await this.deleteAlertTrx(alertId);
    if (deleteRes.error) {
      return this.createResponse(deleteRes.error, 400);
    }

    return this.createResponse("OK", 200);
  }

  async deleteAlertTrx(alertId: string): Promise<Result<null, string>> {
    let error = null;

    await this.state.storage.transaction(async (txn) => {
      const currentAlerts = (await txn.get<Alerts>(ALERT_KEY)) || {};

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
      return this.createResponse("Expected POST", 405);
    }

    const alertMetricEvent = (await request.json()) as AlertMetricEvent;
    const { data: activeAlerts, error: activeAlertsErr } =
      await this.processEventTrx(alertMetricEvent);

    if (activeAlertsErr) {
      return this.createResponse(activeAlertsErr, 400);
    }

    return this.createResponse(activeAlerts, 200);
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

          alert.state = this.updateAlertState(
            alert,
            { count, total },
            event.timestamp
          );

          const alertUpdate = await this.checkAlert(alert, event.timestamp);

          switch (alertUpdate.status) {
            case "triggered":
              activeAlerts.triggered.push(
                this.triggerAlertState(alert, alertUpdate)
              );
              break;
            case "below_threshold":
              alert.state.triggerState.firstBelowThresholdAt =
                alertUpdate.timestamp;
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
    return { data: activeAlerts, error: null };
  }

  updateAlertState(
    alert: Alert,
    eventMetrics: { count: number; total: number },
    eventTime: number
  ): AlertState {
    if (!alert.state) {
      alert.state = {
        timeBlocks: [],
        metricValues: { counts: 0, totals: 0 },
        triggerState: { triggered: false },
      };
    } else if (!alert.state.timeBlocks) {
      alert.state.timeBlocks = [];
    }

    const timeBlockDuration = alert.time_block_duration;
    const windowStart = eventTime - alert.time_window;

    let latestBlock: TimeBlock | null = null;
    const updatedBlocks: TimeBlock[] = [];
    const updatedMetricValues = { ...alert.state.metricValues };
    for (const block of alert.state.timeBlocks) {
      if (block.startTimestamp >= windowStart) {
        updatedBlocks.push(block);
        latestBlock = block;
      } else {
        updatedMetricValues.counts -= block.count;
        updatedMetricValues.totals -= block.total;
      }
    }

    const isWithinCurrentBlock =
      latestBlock && eventTime - latestBlock.startTimestamp < timeBlockDuration;

    if (latestBlock && isWithinCurrentBlock) {
      // Update the existing block
      latestBlock.count += eventMetrics.count;
      latestBlock.total += eventMetrics.total;
    } else {
      // The event starts a new block
      updatedBlocks.push({
        startTimestamp: eventTime - (eventTime % timeBlockDuration),
        count: eventMetrics.count,
        total: eventMetrics.total,
      });
    }

    // Update metric values
    updatedMetricValues.counts += eventMetrics.count;
    updatedMetricValues.totals += eventMetrics.total;

    return {
      timeBlocks: updatedBlocks,
      metricValues: updatedMetricValues,
      triggerState: { ...alert.state.triggerState },
    };
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
      if (!alertState.triggerState.firstBelowThresholdAt) {
        alertState.triggerState.firstBelowThresholdAt = eventTimestamp;
        return {
          status: "below_threshold",
          timestamp: eventTimestamp,
        };
      } else {
        const timeSinceBelowThreshold =
          eventTimestamp - alertState.triggerState.firstBelowThresholdAt;
        if (timeSinceBelowThreshold >= COOLDOWN_PERIOD_MS) {
          return {
            status: "resolved",
            timestamp: eventTimestamp,
          };
        }
      }
    }

    return { status: "unchanged", timestamp: eventTimestamp };
  }

  private resolveAlertState(
    alert: Alert,
    alertStatusUpdate: AlertStatusUpdate
  ): ResolvedAlert {
    alert.state.triggerState = {
      triggered: false,
      triggeredAt: undefined,
      triggeredThreshold: undefined,
      firstBelowThresholdAt: undefined,
    };

    return this.mapAlertToUpdate(alertStatusUpdate, alert);
  }

  private triggerAlertState(
    alert: Alert,
    alertStatusUpdate: AlertStatusUpdate
  ): TriggeredAlert {
    alert.state.triggerState = {
      triggered: true,
      triggeredAt: alertStatusUpdate.timestamp,
      triggeredThreshold: alertStatusUpdate.triggeredThreshold,
      firstBelowThresholdAt: undefined,
    };

    return this.mapAlertToInsert(alertStatusUpdate, alert);
  }

  private mapAlertToInsert(
    alertUpdate: AlertStatusUpdate,
    alert: Alert
  ): TriggeredAlert {
    return {
      alert_id: alert.id,
      alert_name: alert.name,
      alert_start_time: new Date(alertUpdate.timestamp).toISOString(),
      alert_metric: alert.metric,
      org_id: alert.org_id,
      soft_delete: false,
      status: "triggered",
      triggered_value: `${alertUpdate.triggeredThreshold}`,
      alert: alert,
    };
  }

  private mapAlertToUpdate(
    alertUpdate: AlertStatusUpdate,
    alert: Alert
  ): ResolvedAlert {
    return {
      alert_id: alert.id,
      alert_end_time: new Date(alertUpdate.timestamp).toISOString(),
      alert_metric: alert.metric,
      org_id: alert.org_id,
      soft_delete: false,
      status: "resolved",
      triggered_value: `${alertUpdate.triggeredThreshold}`,
      alert: alert,
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

  private createResponse<T>(content: T, status: number): Response {
    return new Response(JSON.stringify(content), {
      headers: { "Content-Type": "application/json" },
      status,
    });
  }
}
