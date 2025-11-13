import { Result, err, ok } from "../util/results";
import {
  Alert,
  AlertState,
  AlertStore,
  GroupedAlertResult,
} from "../db/AlertStore";
import { safePut } from "../safePut";

type AlertStateUpdate = {
  alert: Alert;
  status: "triggered" | "resolved" | "unchanged";
  timestamp: number;
  triggeredThreshold?: number;
  groupedResults?: GroupedAlertResult[]; // For grouped alerts
};

export class AlertManager {
  COOLDOWN_PERIOD_MS = 5 * 60 * 1000;
  private utilityKv: Env["UTILITY_KV"];
  private resendApiKey: Env["RESEND_API_KEY"];

  constructor(
    private alertStore: AlertStore,
    private env: Env
  ) {
    this.utilityKv = env.UTILITY_KV;
    this.resendApiKey = env.RESEND_API_KEY;
  }

  public async checkAlerts() {
    const { data: allAlerts, error: allAlertsErr } =
      await this.alertStore.getAlerts();

    if (allAlertsErr) {
      return err(`Error fetching alerts: ${allAlertsErr}`);
    }

    if (!allAlerts) {
      return ok(`No alerts found`);
    }

    const timestamp = Date.now();
    const alertStatePromises = allAlerts.map(async (alert) => {
      const { data: alertState, error: alertStateErr } =
        await this.getAlertState(alert);

      if (alertStateErr || !alertState) {
        console.error(
          `Error retrieving alert state for alert ID ${alert.id}: ${alertStateErr}`
        );
        return;
      }

      return await this.getAlertStateUpdate(alert, alertState, timestamp);
    });

    const alertStateUpdates = await Promise.all(alertStatePromises);

    const triggeredAlerts: AlertStateUpdate[] = [];
    const resolvedAlerts: AlertStateUpdate[] = [];
    for (const alertStateUpdate of alertStateUpdates) {
      if (!alertStateUpdate) continue;

      if (alertStateUpdate.status === "resolved") {
        resolvedAlerts.push(alertStateUpdate);
      }
      if (alertStateUpdate.status === "triggered") {
        triggeredAlerts.push(alertStateUpdate);
      }
    }

    const now = new Date(timestamp).toISOString();
    const { error: updatedStateErr } = await this.handleAlertStateUpdates(
      triggeredAlerts,
      resolvedAlerts,
      now
    );

    if (updatedStateErr) {
      return err(`Error updating alert states: ${updatedStateErr}`);
    }

    return ok(null);
  }

  async handleAlertStateUpdates(
    triggeredAlerts: AlertStateUpdate[],
    resolvedAlerts: AlertStateUpdate[],
    now: string
  ): Promise<Result<null, string>> {
    if (triggeredAlerts && triggeredAlerts.length > 0) {
      const { error: triggerAlertsErr } = await this.updateTriggeredAlerts(
        triggeredAlerts,
        now
      );

      if (triggerAlertsErr) {
        console.error(`Failed to trigger alerts: ${triggerAlertsErr}`);
      }

      const { error: sendEmailErr } =
        await this.sendAlertEmails(triggeredAlerts);

      if (sendEmailErr) {
        console.error(`Failed to send alert emails: ${sendEmailErr}`);
      }

      const { error: sendSlackErr } =
        await this.sendAlertSlacks(triggeredAlerts);

      if (sendSlackErr) {
        console.error(`Failed to send alert slacks: ${sendSlackErr}`);
      }
    }

    if (resolvedAlerts.length > 0) {
      const { error: resolvedAlertsErr } = await this.updateResolvedAlerts(
        resolvedAlerts,
        now
      );

      if (resolvedAlertsErr) {
        console.error(`Failed to resolve alerts: ${resolvedAlertsErr}`);
      }

      const { error: sendEmailErr } =
        await this.sendAlertEmails(resolvedAlerts);

      if (sendEmailErr) {
        console.error(`Failed to send resolve emails: ${sendEmailErr}`);
      }

      const { error: sendSlackErr } =
        await this.sendAlertSlacks(resolvedAlerts);

      if (sendSlackErr) {
        console.error(`Failed to send resolve slacks: ${sendSlackErr}`);
      }
    }

    return ok(null);
  }

  async updateResolvedAlerts(
    resolvedAlerts: AlertStateUpdate[],
    now: string
  ): Promise<Result<null, string>> {
    const alertIds = resolvedAlerts.map((alert) => alert.alert.id);
    const { error: alertUpdateErr } = await this.alertStore.updateAlertStatuses(
      "resolved",
      alertIds
    );

    if (alertUpdateErr) {
      return err(
        `Error updating resolved alerts: ${JSON.stringify(alertUpdateErr)}`
      );
    }

    const { error: alertHistUpdateErr } =
      await this.alertStore.updateAlertHistoryStatuses(
        "resolved",
        alertIds,
        now
      );

    if (alertHistUpdateErr) {
      return err(
        `Error updating alert history: ${JSON.stringify(alertHistUpdateErr)}`
      );
    }

    return ok(null);
  }

  async updateTriggeredAlerts(
    triggeredAlerts: AlertStateUpdate[],
    now: string
  ): Promise<Result<null, string>> {
    // Insert into alert history, update alert table status.
    const { error: alertUpdateErr } = await this.alertStore.updateAlertStatuses(
      "triggered",
      triggeredAlerts.map((alert) => alert.alert.id)
    );

    if (alertUpdateErr) {
      return err(
        `Error updating triggered alerts: ${JSON.stringify(alertUpdateErr)}`
      );
    }

    const { error: alertHistoryUpdateErr } =
      await this.alertStore.insertAlertHistory(
        triggeredAlerts.map((triggeredAlert) => {
          return {
            alert_id: triggeredAlert.alert.id,
            alert_metric: triggeredAlert.alert.metric,
            alert_name: triggeredAlert.alert.name,
            alert_start_time: now,
            org_id: triggeredAlert.alert.org_id,
            status: "triggered",
            triggered_value: triggeredAlert.triggeredThreshold
              ? triggeredAlert.triggeredThreshold.toFixed(2)
              : "",
          };
        })
      );

    if (alertHistoryUpdateErr) {
      return err(`Error inserting triggered alerts: ${alertHistoryUpdateErr}`);
    }

    return ok(null);
  }

  async getAlertState(alert: Alert): Promise<Result<AlertState, string>> {
    if (alert.metric === "response.status") {
      return await this.alertStore.getErrorRate(alert);
    }

    return await this.alertStore.getAggregatedMetric(alert);
  }

  async getAlertStateUpdate(
    alert: Alert,
    alertState: AlertState,
    timestamp: number
  ): Promise<AlertStateUpdate> {
    const hasGrouping = alert.grouping !== null;

    if (hasGrouping && alertState.groupedResults) {
      const hasViolations = alertState.groupedResults.length > 0;

      if (hasViolations) {
        return await this.handleRateAboveThreshold(
          alert,
          alert.threshold,
          alertState.requestCount,
          timestamp,
          alertState.groupedResults
        );
      } else {
        return await this.handleRateBelowThreshold(alert, timestamp);
      }
    }

    // Handle ungrouped alerts (backwards compatible)
    let isRateBelowThreshold = false;
    let triggerThreshold = 0;

    if (alert.metric === "response.status") {
      triggerThreshold =
        alertState.totalCount > 0 && alertState.errorCount
          ? (alertState.errorCount / alertState.totalCount) * 100
          : 0;
      isRateBelowThreshold = triggerThreshold < alert.threshold;
    } else {
      triggerThreshold = alertState.totalCount;
      isRateBelowThreshold = alertState.totalCount < alert.threshold;
    }

    // Handle scenarios where rate is below threshold
    if (isRateBelowThreshold) {
      return await this.handleRateBelowThreshold(alert, timestamp);
    }

    // Handle scenarios where rate is above or equal to threshold
    return await this.handleRateAboveThreshold(
      alert,
      triggerThreshold,
      alertState.requestCount,
      timestamp
    );
  }

  async handleRateBelowThreshold(
    alert: Alert,
    timestamp: number
  ): Promise<AlertStateUpdate> {
    if (alert.status === "resolved") {
      return { status: "unchanged", timestamp, alert };
    }

    const cooldownStart = await this.getCooldownStart(alert.id);
    if (!cooldownStart) {
      await this.setCooldownStart(alert.id, timestamp);
      return { status: "unchanged", timestamp, alert };
    }

    if (timestamp - cooldownStart >= this.COOLDOWN_PERIOD_MS) {
      await this.deleteCooldown(alert.id);
      return { status: "resolved", timestamp, alert };
    }

    return { status: "unchanged", timestamp, alert };
  }

  async handleRateAboveThreshold(
    alert: Alert,
    triggerThreshold: number,
    requestCount: number,
    timestamp: number,
    groupedResults?: GroupedAlertResult[]
  ): Promise<AlertStateUpdate> {
    if (
      alert.status === "resolved" &&
      requestCount >= (alert.minimum_request_count ?? 0)
    ) {
      await this.deleteCooldown(alert.id);
      return {
        status: "triggered",
        timestamp,
        triggeredThreshold: triggerThreshold,
        groupedResults,
        alert,
      };
    }

    return { status: "unchanged", timestamp, alert };
  }

  async deleteCooldown(alertId: string): Promise<void> {
    await this.utilityKv.delete(this.getCooldownStartTimestamp(alertId));
  }

  async getCooldownStart(alertId: string): Promise<number | null> {
    const timestampString = await this.utilityKv.get<string>(
      this.getCooldownStartTimestamp(alertId)
    );
    return timestampString !== null ? parseInt(timestampString, 10) : null;
  }

  async setCooldownStart(alertId: string, timestamp: number): Promise<void> {
    await safePut({
      key: this.utilityKv,
      keyName: this.getCooldownStartTimestamp(alertId),
      value: timestamp.toString(),
      options: { expirationTtl: 600 },
    });
  }

  private getCooldownStartTimestamp = (alertId: string) =>
    `alert:${alertId}:cooldown_start_timestamp`;

  private async sendAlertEmails(
    alertStatusUpdates: AlertStateUpdate[]
  ): Promise<Result<null, string>> {
    const promises = alertStatusUpdates.map(async (alertStatusUpdate) => {
      if (alertStatusUpdate.alert.emails.length > 0) {
        const { error: emailResErr } =
          await this.sendAlertEmail(alertStatusUpdate);
        if (emailResErr) {
          console.error(`Error sending email: ${emailResErr}`);
          return err(emailResErr);
        }
      }
    });

    await Promise.all(promises);

    return ok(null);
  }

  private async sendAlertEmail(
    alertStatusUpdate: AlertStateUpdate
  ): Promise<Result<null, string>> {
    const { subject, text, html } =
      this.formatAlertNotification(alertStatusUpdate);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Helicone Alert <alerts@helicone.ai>",
        to: alertStatusUpdate.alert.emails,
        html: html,
        subject: subject,
        text: text,
      }),
    });

    if (!res.ok) {
      return err(
        `Error sending emails: ${res.status} ${res.statusText} ${await res.text()}`
      );
    }

    return ok(null);
  }

  private async sendAlertSlacks(
    alertStatusUpdates: AlertStateUpdate[]
  ): Promise<Result<null, string>> {
    const promises = alertStatusUpdates.map(async (alertStatusUpdate) => {
      if (alertStatusUpdate.alert.slack_channels.length > 0) {
        const { error: slackResErr } =
          await this.sendAlertSlack(alertStatusUpdate);
        if (slackResErr) {
          console.error(`Error sending slack: ${slackResErr}`);
          return err(slackResErr);
        }
      }
    });

    await Promise.all(promises);

    return ok(null);
  }

  private async sendAlertSlack(
    alertStatusUpdate: AlertStateUpdate
  ): Promise<Result<null, string>> {
    const { slack_json } = this.formatAlertNotification(alertStatusUpdate);

    for (const channel of alertStatusUpdate.alert.slack_channels) {
      const slackIntegration =
        alertStatusUpdate.alert.organization.integrations.filter(
          (integration) => integration.integration_name === "slack"
        )[0];
      if (!slackIntegration) {
        return err(
          `Slack integration not found for alert ${alertStatusUpdate.alert.name}`
        );
      }
      const settings = slackIntegration.settings as { access_token: string };
      if (!settings.access_token) {
        return err(
          `Slack access token not found for alert ${alertStatusUpdate.alert.name}`
        );
      }

      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel,
          blocks: JSON.stringify(slack_json.blocks),
        }),
      });

      if (!res.ok) {
        return err(
          `Error sending slack messages: ${res.status} ${res.statusText} ${await res.text()}`
        );
      }

      const data = (await res.json()) as { ok: boolean; error?: string };

      if (!data.ok) {
        return err(`Error sending slack messages: ${data.error}`);
      }
    }

    return ok(null);
  }

  private formatAlertEmailHtml(params: {
    alertName: string;
    status: "triggered" | "resolved";
    metric: string;
    threshold: number;
    timeWindow: number;
    alertTime: string;
    actionMessage: string;
    groupedResults?: GroupedAlertResult[];
    groupLabel?: string;
    formatValue: (value: number) => string;
  }): string {
    const {
      alertName,
      status,
      metric,
      threshold,
      timeWindow,
      alertTime,
      actionMessage,
      groupedResults = [],
      groupLabel,
      formatValue,
    } = params;

    // Helicone brand colors
    const colors = {
      primary: "#0DA5E8",
      triggered: "#DC2626",
      resolved: "#16A34A",
      text: "#0F172A",
      textMuted: "#64748B",
      border: "#E2E8F0",
      background: "#FFFFFF",
      backgroundGray: "#F8FAFC",
    };

    const statusColor = status === "triggered" ? colors.triggered : colors.resolved;
    const statusText = status === "triggered" ? "TRIGGERED" : "RESOLVED";

    const formatTimespan = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const hours = Math.floor(minutes / 60);
      return hours > 0 ? `${hours} hour(s)` : `${minutes} minute(s)`;
    };

    const formatThreshold = () => {
      if (metric === "cost") return `$${threshold}`;
      if (metric === "response.status") return `${threshold}%`;
      if (metric === "latency") return `${threshold}ms`;
      if (metric === "count") return `${threshold} requests`;
      if (metric.includes("tokens")) return `${threshold} tokens`;
      return threshold.toString();
    };

    const getMainMessage = () => {
      if (status === "triggered") {
        if (metric === "response.status") {
          return `Error rate has breached ${threshold}% in the last ${formatTimespan(timeWindow)}.`;
        } else if (metric === "cost") {
          return `Cost has exceeded $${threshold} in the last ${formatTimespan(timeWindow)}.`;
        } else if (metric === "latency") {
          return `Latency has exceeded ${threshold}ms in the last ${formatTimespan(timeWindow)}.`;
        } else if (metric === "count") {
          return `Request count has exceeded ${threshold} requests in the last ${formatTimespan(timeWindow)}.`;
        } else if (metric.includes("tokens")) {
          return `Token usage has exceeded ${threshold} tokens in the last ${formatTimespan(timeWindow)}.`;
        }
        return `Metric has exceeded threshold in the last ${formatTimespan(timeWindow)}.`;
      } else {
        if (metric === "response.status") {
          return `Error rate is now back within ${threshold}%.`;
        } else if (metric === "cost") {
          return `Cost is now under $${threshold}.`;
        } else if (metric === "latency") {
          return `Latency is now under ${threshold}ms.`;
        } else if (metric === "count") {
          return `Request count is now under ${threshold} requests.`;
        } else if (metric.includes("tokens")) {
          return `Token usage is now under ${threshold} tokens.`;
        }
        return "Metric is now within threshold.";
      }
    };

    let groupedResultsHtml = "";
    if (groupedResults.length > 0 && status === "triggered") {
      const rows = groupedResults
        .map(
          (result, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? colors.background : colors.backgroundGray};">
          <td style="padding: 12px 16px; color: ${colors.text}; font-size: 14px; border-bottom: 1px solid ${colors.border};">
            ${result.groupValue || "N/A"}
          </td>
          <td style="padding: 12px 16px; color: ${colors.text}; font-size: 14px; font-weight: 500; border-bottom: 1px solid ${colors.border};">
            ${formatValue(result.aggregatedValue)}
          </td>
        </tr>`
        )
        .join("");

      groupedResultsHtml = `
      <tr>
        <td style="padding: 24px; background-color: ${colors.background};">
          <h2 style="color: ${colors.text}; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
            Violated ${groupLabel || "Group"}s
          </h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background-color: ${colors.backgroundGray};">
                <th style="padding: 12px 16px; text-align: left; color: ${colors.text}; font-size: 12px; font-weight: 600; border-bottom: 1px solid ${colors.border};">
                  ${groupLabel || "Group"}
                </th>
                <th style="padding: 12px 16px; text-align: left; color: ${colors.text}; font-size: 12px; font-weight: 600; border-bottom: 1px solid ${colors.border};">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </td>
      </tr>`;
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.backgroundGray}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" class="container" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px; background-color: ${colors.background}; border-bottom: 1px solid ${colors.border};">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td>
                    <img src="https://www.helicone.ai/static/logo.png" alt="Helicone" style="display: block; height: 30px; width: auto;">
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-block; padding: 6px 12px; background-color: ${statusColor}; border-radius: 6px;">
                      <span style="color: ${colors.background}; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">${statusText}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 16px;">
                    <h1 style="color: ${colors.text}; font-size: 20px; font-weight: 600; margin: 0;">${alertName}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main Message -->
          <tr>
            <td style="padding: 24px; background-color: ${colors.background};">
              <p style="color: ${colors.text}; font-size: 16px; font-weight: 500; line-height: 24px; margin: 0 0 12px 0;">
                ${getMainMessage()}
              </p>
              <p style="color: ${colors.textMuted}; font-size: 14px; line-height: 20px; margin: 0;">
                ${actionMessage}
              </p>
            </td>
          </tr>
          <!-- Alert Details -->
          <tr>
            <td style="padding: 24px; background-color: ${colors.background};">
              <h2 style="color: ${colors.text}; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Alert Details</h2>
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="padding-bottom: 8px; width: 40%; vertical-align: top;">
                    <span style="color: ${colors.textMuted}; font-size: 14px;">Alert Time:</span>
                  </td>
                  <td style="padding-bottom: 8px; width: 60%; vertical-align: top;">
                    <span style="color: ${colors.text}; font-size: 14px; font-weight: 500;">${alertTime}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px; vertical-align: top;">
                    <span style="color: ${colors.textMuted}; font-size: 14px;">Metric:</span>
                  </td>
                  <td style="padding-bottom: 8px; vertical-align: top;">
                    <span style="color: ${colors.text}; font-size: 14px; font-weight: 500;">${metric}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px; vertical-align: top;">
                    <span style="color: ${colors.textMuted}; font-size: 14px;">Threshold:</span>
                  </td>
                  <td style="padding-bottom: 8px; vertical-align: top;">
                    <span style="color: ${colors.text}; font-size: 14px; font-weight: 500;">${formatThreshold()}</span>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top;">
                    <span style="color: ${colors.textMuted}; font-size: 14px;">Time Window:</span>
                  </td>
                  <td style="vertical-align: top;">
                    <span style="color: ${colors.text}; font-size: 14px; font-weight: 500;">${formatTimespan(timeWindow)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${groupedResultsHtml}
          <!-- CTA Button -->
          <tr>
            <td style="padding: 24px; background-color: ${colors.background};">
              <a href="https://helicone.ai/dashboard" style="display: inline-block; padding: 12px 24px; background-color: ${colors.primary}; color: ${colors.background}; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
                View Dashboard
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: ${colors.background}; border-top: 1px solid ${colors.border};">
              <p style="color: ${colors.textMuted}; font-size: 14px; line-height: 24px; margin: 0 0 8px 0;">
                This alert was sent by <a href="https://helicone.ai" style="color: ${colors.primary}; text-decoration: underline;">Helicone</a>.
              </p>
              <p style="color: ${colors.textMuted}; font-size: 14px; line-height: 24px; margin: 0 0 16px 0;">
                <a href="https://helicone.ai/alerts" style="color: ${colors.primary}; text-decoration: underline;">Manage alert settings</a>
              </p>
              <p style="color: ${colors.textMuted}; font-size: 12px; line-height: 20px; margin: 0;">
                © ${new Date().getFullYear()} Helicone.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private formatAlertNotification(alertStatusUpdate: AlertStateUpdate): {
    subject: string;
    text: string;
    html: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slack_json: Record<string, any>;
  } {
    const alert = alertStatusUpdate.alert;
    const status = alertStatusUpdate.status ?? "";
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    const hasGrouping = alert.grouping !== null;
    const groupedResults = alertStatusUpdate.groupedResults || [];

    const formatTimestamp = (timestamp: string) =>
      timestamp ? new Date(timestamp).toUTCString() : "N/A";

    const formatTimespan = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const hours = Math.floor(minutes / 60);
      return hours > 0 ? `${hours} hour(s)` : `${minutes} minute(s)`;
    };

    const formatValue = (value: number) => {
      if (alert.metric === "cost") {
        return `$${value.toFixed(2)}`;
      } else if (alert.metric === "response.status") {
        return `${value.toFixed(2)}%`;
      } else if (alert.metric === "latency") {
        return `${Math.round(value)}ms`;
      } else if (alert.metric === "count") {
        return `${Math.round(value)} requests`;
      } else if (alert.metric.includes("tokens")) {
        // Handles: total_tokens, prompt_tokens, completion_tokens,
        // prompt_cache_read_tokens, prompt_cache_write_tokens
        return `${Math.round(value)} tokens`;
      }
      return value.toFixed(2);
    };

    const subject = `Alert ${capitalizedStatus}: ${alert.name}`;
    const alertTime = new Date(alertStatusUpdate.timestamp).toUTCString();
    const actionMessage =
      status === "triggered"
        ? "Please take the necessary action."
        : "No further action is required.";

    let groupedResultsText = "";
    if (hasGrouping && groupedResults.length > 0 && status === "triggered") {
      const groupLabel =
        alert.grouping_is_property
          ? `Property "${alert.grouping}"`
          : alert.grouping!.charAt(0).toUpperCase() + alert.grouping!.slice(1);

      groupedResultsText = `\n\nThe following ${groupLabel}s exceeded the threshold:\n`;

      groupedResults.forEach((result) => {
        const displayValue = formatValue(result.aggregatedValue);
        groupedResultsText += `- ${result.groupValue || "N/A"}: ${displayValue}\n`;
      });
    }

    const text = `Alert '${
      alert.name
    }' has been ${capitalizedStatus}.\n\nDetails:\n- ${capitalizedStatus} At: ${
      alertTime ? formatTimestamp(alertTime) : "alertTime not found"
    }\n- Threshold: ${
      alert.metric === "cost" ? `$${alert.threshold}` : `${alert.threshold}%`
    }${groupedResultsText}\n\n${actionMessage}`;

    // Build tasteful Slack blocks
    const statusEmoji = status === "triggered" ? "🚨" : "✅";

    // Determine main message based on metric
    const getSlackMainMessage = () => {
      if (status === "triggered") {
        if (alert.metric === "response.status") {
          return `Error rate has *breached ${alert.threshold}%* in the last *${formatTimespan(alert.time_window)}*`;
        } else if (alert.metric === "cost") {
          return `Cost has *exceeded $${alert.threshold}* in the last *${formatTimespan(alert.time_window)}*`;
        } else if (alert.metric === "latency") {
          return `Latency has *exceeded ${alert.threshold}ms* in the last *${formatTimespan(alert.time_window)}*`;
        } else if (alert.metric === "count") {
          return `Request count has *exceeded ${alert.threshold} requests* in the last *${formatTimespan(alert.time_window)}*`;
        } else if (alert.metric.includes("tokens")) {
          return `Token usage has *exceeded ${alert.threshold} tokens* in the last *${formatTimespan(alert.time_window)}*`;
        }
        return `Metric has exceeded threshold in the last *${formatTimespan(alert.time_window)}*`;
      } else {
        if (alert.metric === "response.status") {
          return `Error rate is now *back within ${alert.threshold}%*`;
        } else if (alert.metric === "cost") {
          return `Cost is now *under $${alert.threshold}*`;
        } else if (alert.metric === "latency") {
          return `Latency is now *under ${alert.threshold}ms*`;
        } else if (alert.metric === "count") {
          return `Request count is now *under ${alert.threshold} requests*`;
        } else if (alert.metric.includes("tokens")) {
          return `Token usage is now *under ${alert.threshold} tokens*`;
        }
        return "Metric is now within threshold";
      }
    };

    const slackBlocks: any[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${statusEmoji} ${alert.name}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: getSlackMainMessage(),
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*Metric:* ${alert.metric} | *Threshold:* ${formatValue(alert.threshold)} | *Status:* ${capitalizedStatus}`,
          },
        ],
      },
    ];

    // Add grouped results as a rich table
    if (hasGrouping && groupedResults.length > 0 && status === "triggered") {
      const groupLabel =
        alert.grouping_is_property
          ? `Property "${alert.grouping}"`
          : alert.grouping!.charAt(0).toUpperCase() + alert.grouping!.slice(1);

      // Limit to top 10 results for readability
      const topResults = groupedResults.slice(0, 10);
      const hasMore = groupedResults.length > 10;

      const resultsText = topResults
        .map((result) => {
          const displayValue = formatValue(result.aggregatedValue);
          return `• *${result.groupValue || "N/A"}*: ${displayValue}`;
        })
        .join("\n");

      slackBlocks.push({
        type: "divider",
      });

      slackBlocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Violated ${groupLabel}s* ${hasMore ? `(showing top 10 of ${groupedResults.length})` : `(${groupedResults.length})`}\n${resultsText}`,
        },
      });
    }

    // Add divider and footer
    slackBlocks.push({
      type: "divider",
    });

    slackBlocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `🕐 ${alertTime}`,
        },
      ],
    });

    // Add action button
    slackBlocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View Dashboard",
            emoji: true,
          },
          url: "https://helicone.ai/dashboard",
          style: status === "triggered" ? "danger" : "primary",
        },
      ],
    });

    const slack_json = {
      blocks: slackBlocks,
    };

    // Determine group label for display
    const groupLabel = hasGrouping && alert.grouping
      ? alert.grouping_is_property
        ? `Property "${alert.grouping}"`
        : alert.grouping!.charAt(0).toUpperCase() + alert.grouping!.slice(1)
      : undefined;

    // Generate HTML email using clean template
    const html = this.formatAlertEmailHtml({
      alertName: alert.name,
      status: alertStatusUpdate.status as "triggered" | "resolved",
      metric: alert.metric,
      threshold: alert.threshold,
      timeWindow: alert.time_window,
      alertTime: formatTimestamp(alertTime),
      actionMessage,
      groupedResults,
      groupLabel,
      formatValue,
    });

    return { subject, text, html, slack_json };
  }
}
