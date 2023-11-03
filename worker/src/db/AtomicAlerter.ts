import { Result } from "../results";

const ALERT_KEY = "alerts";
type MetricType = "rate" | "count";

export type Alerts = {
  [alertId: string]: Alert;
};

type Alert = {
  type: MetricType;
  threshold: number;
  timeWindow: number;
};

export type AlertMetricEvent = {
  timestamp: number;
  metrics: {
    [alertId: string]: {
      count: number;
      total: number;
    };
  };
};

type AlertStateMap = {
  [alertId: string]: {
    timestamps: Array<{
      timestamp: number;
      count: number;
      total: number;
    }>;
    metricValues: {
      counts: number;
      totals: number;
    };
    triggered: boolean;
    triggeredAt?: number;
  };
};

export type ActiveAlerts = {
  triggered: AlertInfo[];
  resolved: AlertInfo[];
};

type AlertInfo = {
  alertId: string;
  alertTime: number;
  threshold: number;
  currentRate: number;
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

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/events") && request.method === "POST") {
      return await this.handleEventsPost(request);
    }

    if (url.pathname.startsWith("/alerts") && request.method === "POST") {
      return await this.handleAlertsPost(request);
    }

    if (url.pathname.startsWith("/alert") && request.method === "DELETE") {
      return await this.handleAlertDelete(request);
    }

    return new Response("Not Found", { status: 404 });
  }

  async handleEventsPost(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Expected POST", { status: 405 });
    }

    const alertMetricEvent = (await request.json()) as AlertMetricEvent;
    const activeAlerts = await this.processEvent(alertMetricEvent);

    if (activeAlerts.error) {
      return new Response(activeAlerts.error, { status: 400 });
    }

    return new Response(JSON.stringify(activeAlerts.data ?? {}), {
      headers: { "Content-Type": "application/json" },
    });
  }

  async handleAlertsPost(request: Request): Promise<Response> {
    const newAlerts = (await request.json()) as Alerts;
    const upsertRes = await this.upsertAlerts(newAlerts);

    if (upsertRes.error) {
      return new Response(upsertRes.error, { status: 400 });
    }

    return new Response("OK");
  }

  async handleAlertDelete(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const alertId = url.pathname.split("/").pop();
    if (!alertId) {
      return new Response("Bad Request: Missing id", { status: 400 });
    }

    const deleteRes = await this.deleteAlert(alertId);
    if (deleteRes.error) {
      return new Response(deleteRes.error, { status: 400 });
    }

    return new Response("OK");
  }

  async upsertAlerts(newAlerts: Alerts): Promise<Result<null, string>> {
    await this.state.storage.transaction(async (txn) => {
      let currentAlerts = (await txn.get<Alerts>(ALERT_KEY)) || {};

      Object.entries(newAlerts).forEach(([alertId, alert]) => {
        if (alert) {
          currentAlerts[alertId] = alert;
        }
      });

      await txn.put(ALERT_KEY, currentAlerts);
      this.alerts = currentAlerts;
    });

    return { data: null, error: null };
  }

  async deleteAlert(alertId: string): Promise<Result<null, string>> {
    await this.state.storage.transaction(async (txn) => {
      let currentAlerts = (await txn.get<Alerts>(ALERT_KEY)) || {};
      if (currentAlerts.hasOwnProperty(alertId)) {
        delete currentAlerts[alertId];
        await txn.put(ALERT_KEY, currentAlerts);
        if (this.alerts) {
          delete this.alerts[alertId];
        }
      } else {
        return { data: null, error: "Alert not found" };
      }
    });

    return { data: null, error: null };
  }

  async processEvent(
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

        const windowStart = now - alert.timeWindow;
        let alertState: AlertStateMap[typeof alertId] = (await txn.get<
          AlertStateMap[typeof alertId]
        >(alertId)) || {
          timestamps: [],
          metricValues: { counts: 0, totals: 0 },
          triggered: false,
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

        const alertInfo = await this.checkAlert(
          alertId,
          alert,
          alertState,
          event.timestamp
        );

        if (alertInfo) {
          if (alertState.triggered) {
            activeAlerts.triggered.push(alertInfo);
          } else {
            activeAlerts.resolved.push(alertInfo);
          }
        }

        await txn.put(alertId, alertState);
      }
    });

    return { data: activeAlerts, error: null };
  }

  private async checkAlert(
    alertId: string,
    alert: Alert,
    alertState: AlertStateMap[typeof alertId],
    eventTimestamp: number
  ): Promise<AlertInfo | null> {
    const rate =
      (alertState.metricValues.counts / alertState.metricValues.totals) * 100;

    if (rate > alert.threshold && !alertState.triggered) {
      alertState.triggered = true;
      return {
        alertId,
        alertTime: eventTimestamp,
        threshold: alert.threshold,
        currentRate: rate,
      };
    } else if (rate <= alert.threshold && alertState.triggered) {
      alertState.triggered = false;
      return {
        alertId,
        alertTime: eventTimestamp,
        threshold: alert.threshold,
        currentRate: rate,
      };
    }

    return null;
  }
}
