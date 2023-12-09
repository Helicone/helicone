import { SupabaseClient } from "@supabase/supabase-js";
import { Alerter } from "./db/Alerter";
import { Database } from "../supabase/database.types";
import {
  AlertMetricEvent,
  ResolvedAlert,
  TriggeredAlert,
} from "./db/AtomicAlerter";
import { Result, err, ok } from "./results";
import { Env } from ".";

export class Alerts {
  private alerter: Alerter;

  constructor(
    private supabaseClient: SupabaseClient<Database>,
    atomicAlerter: DurableObjectNamespace,
    private resendApiKey: Env["RESEND_API_KEY"]
  ) {
    this.supabaseClient = supabaseClient;
    this.alerter = new Alerter(atomicAlerter);
  }

  public async processMetricEvent(
    metricEvent: AlertMetricEvent,
    organizationId: string
  ): Promise<Result<null, string>> {
    const alertRes = await this.alerter.processMetricEvent(
      metricEvent,
      organizationId
    );

    if (alertRes.error !== null) {
      return err(alertRes.error);
    }

    // Insert triggered alerts
    const triggeredRes = await this.supabaseClient
      .from("alert_history")
      .insert(
        alertRes.data.triggered.map(({ alert, ...alertData }) => alertData)
      );

    if (triggeredRes.error) {
      console.error("Error inserting triggered alerts", triggeredRes.error);
    }

    // Send triggered alert emails
    for (const alertUpdate of alertRes.data.triggered) {
      const { error: emailErr } = await this.sendAlertEmails(alertUpdate);

      if (emailErr) {
        console.error("Error sending alert emails", emailErr);
      }
    }

    // Update resolved alerts & send emails
    for (const alertUpdate of alertRes.data.resolved) {
      const updateResult = await this.supabaseClient
        .from("alert_history")
        .update({
          alert_end_time: alertUpdate.alert_end_time,
          status: alertUpdate.status,
        })
        .eq("alert_id", alertUpdate.alert_id)
        .eq("status", "triggered");

      if (updateResult.error) {
        console.error("Error updating alert", updateResult.error);
      }

      const { error: emailErr } = await this.sendAlertEmails(alertUpdate);

      if (emailErr) {
        console.error("Error sending alert emails", emailErr);
      }
    }

    return ok(null);
  }

  public async resolveAlerts() {
    const { data: triggeredAlerts, error: triggeredAlertsErr } =
      await this.supabaseClient
        .from("alert_history")
        .select("*")
        .eq("status", "triggered");

    if (triggeredAlertsErr || !triggeredAlerts) {
      return;
    }

    let resolvedAlerts: ResolvedAlert[] = [];
    for (const triggeredAlert of triggeredAlerts) {
      const { data: resAlert, error: resAlertsErr } =
        await this.alerter.resolveTriggeredAlert(
          triggeredAlert.alert_id,
          triggeredAlert.org_id
        );

      if (resAlertsErr || !resAlert) {
        console.log("Error resolving alert", resAlertsErr);
        continue;
      }

      resolvedAlerts.push(resAlert);
    }

    for (const resolvedAlert of resolvedAlerts) {
      const updateResult = await this.supabaseClient
        .from("alert_history")
        .update({
          alert_end_time: resolvedAlert.alert_end_time,
          status: resolvedAlert.status,
        })
        .eq("alert_id", resolvedAlert.alert_id)
        .eq("status", "triggered");

      if (updateResult.error) {
        console.error("Error updating alert", updateResult.error);
      }

      const { error: emailErr } = await this.sendAlertEmails(resolvedAlert);

      if (emailErr) {
        console.error("Error sending alert emails", emailErr);
      }
    }
  }

  private async sendAlertEmails(
    alertUpdate: TriggeredAlert | ResolvedAlert
  ): Promise<Result<null, string>> {
    const { subject, text, html } = this.formatAlertNotification(alertUpdate);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Helicone Alert <alerts@helicone.ai>",
        to: alertUpdate.alert.emails,
        html: html,
        subject: subject,
        text: text,
      }),
    });

    if (!res.ok) {
      return err(
        `Error sending emails: ${res.status} ${
          res.statusText
        } ${await res.text()}`
      );
    }

    return ok(null);
  }

  private formatAlertNotification(
    alertUpdate: TriggeredAlert | ResolvedAlert
  ): {
    subject: string;
    text: string;
    html: string;
  } {
    const alert = alertUpdate.alert;
    const status = alertUpdate.status ?? "";
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

    const formatTimestamp = (timestamp: any) =>
      timestamp ? new Date(timestamp).toLocaleString() : "N/A";

    const formatTimespan = (ms: any) => {
      const minutes = Math.floor(ms / 60000);
      const hours = Math.floor(minutes / 60);
      return hours > 0 ? `${hours} hour(s)` : `${minutes} minute(s)`;
    };

    const subject = `Alert ${capitalizedStatus}: ${alert.name}`;
    const alertTime =
      status === "triggered"
        ? alertUpdate.alert_start_time
        : alertUpdate.alert_end_time;
    const actionMessage =
      status === "triggered"
        ? "Please take the necessary action."
        : "No further action is required.";

    const text = `Alert '${
      alert.name
    }' has been ${capitalizedStatus}.\n\nDetails:\n- ${capitalizedStatus} At: ${formatTimestamp(
      alertTime
    )}\n- Threshold: ${alert.threshold}%\n\n${actionMessage}`;
    const html = `<head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      h1, h2 { text-align: center; margin: 10px 0; }
      .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; }
      .content { padding: 20px; }
      .triggered-title { color: #d32f2f; }
      .resolved-title { color: #4caf50; }
      ul { list-style-type: none; margin: 0; padding: 0; }
      li { margin-bottom: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <h1 class="${
          status === "triggered" ? "triggered-title" : "resolved-title"
        }">Alert ${capitalizedStatus}</h1>
        <h2>${alert.name}</h2>
        <ul>
          <li><strong>${capitalizedStatus} At:</strong> ${formatTimestamp(
      alertTime
    )}</li>
          <li><strong>Threshold:</strong> ${alert.threshold}%</li>
          <li><strong>Metric:</strong> ${alert.metric}</li>
          <li><strong>Time Window:</strong> ${formatTimespan(
            alert.time_window
          )}</li>
        </ul>
        <p>${actionMessage}</p>
      </div>
    </div>
  </body>
  </html>`;

    return { subject, text, html };
  }

  // private formatAlertNotification(
  //   alertUpdate: TriggeredAlert | ResolvedAlert
  // ): {
  //   subject: string;
  //   text: string;
  //   html: string;
  // } {
  //   const alert = alertUpdate.alert;
  //   let subject: string;
  //   let text: string;
  //   let html: string;

  //   if (alertUpdate.status === "triggered") {
  //     subject = `Alert Triggered: ${alert.name}`;
  //     text = `Alert '${
  //       alert.name
  //     }' has been triggered. \n\nDetails:\n- Triggered At: '${
  //       alertUpdate.alert_start_time
  //         ? new Date(alertUpdate.alert_start_time).toLocaleString()
  //         : ""
  //     }'\n- Triggered Threshold: '${
  //       alertUpdate.triggered_value
  //     }'\n\nPlease take the necessary action.`;
  //     html = `<html>
  //     <head>
  //       <style>
  //         body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  //         h1 { color: #d32f2f; }
  //         ul { padding-left: 20px; }
  //         li { margin-bottom: 10px; }
  //       </style>
  //     </head>
  //     <body>
  //       <div style="max-width: 600px; margin: auto; padding: 20px;">
  //         <h1 style="text-align: center;">Alert Triggered: '${alert.name}'</h1>
  //         <p>An alert has been triggered.</p>
  //         <p><strong>Details:</strong></p>
  //         <ul>
  //           <li>Triggered At: '${
  //             alertUpdate.alert_start_time
  //               ? new Date(alertUpdate.alert_start_time).toLocaleString()
  //               : ""
  //           }'</li>
  //           <li>Triggered Threshold: '${alertUpdate.triggered_value}'</li>
  //         </ul>
  //         <p>Please take the necessary action.</p>
  //       </div>
  //     </body>
  //     </html>`;
  //   } else if (alertUpdate.status === "resolved") {
  //     subject = `Alert Resolved: ${alert.name}`;
  //     text = `Alert '${
  //       alert.name
  //     }' has been resolved. \n\nDetails:\n- Resolved At: '${
  //       alertUpdate.alert_end_time
  //         ? new Date(alertUpdate.alert_end_time).toLocaleString()
  //         : ""
  //     }'\n\nNo further action is required.`;
  //     html = `<html>
  //       <body>
  //         <h1>Alert Resolved: '${alert.name}'</h1>
  //         <p>An alert has been resolved.</p>
  //         <p><strong>Details:</strong></p>
  //         <ul>
  //           <li>Resolved At: '${
  //             alertUpdate.alert_end_time
  //               ? new Date(alertUpdate.alert_end_time).toLocaleString()
  //               : ""
  //           }'</li>
  //         </ul>
  //         <p>No further action is required.</p>
  //       </body>
  //       </html>`;
  //   } else {
  //     throw new Error("Invalid alert status");
  //   }

  //   return { subject, text, html };
  // }
}
