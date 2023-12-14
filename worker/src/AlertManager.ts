import { Env } from ".";
import { Database } from "../supabase/database.types";
import { Result, err, ok } from "./results";
import { AlertStore } from "./db/AlertStore";

type AlertStateUpdate = {
  alert: Database["public"]["Tables"]["alert"]["Row"];
  status: "triggered" | "resolved" | "unchanged";
  timestamp: number;
  triggeredThreshold?: number;
};

type AlertState = {
  totalCount: number;
  errorCount: number;
};

export class AlertManager {
  COOLDOWN_PERIOD_MS = 5 * 60 * 1000;
  private utilityKv: Env["UTILITY_KV"];
  private resendApiKey: Env["RESEND_API_KEY"];

  constructor(private alertStore: AlertStore, private env: Env) {
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
        await this.alertStore.checkAlertClickhouse(
          alert.org_id,
          alert.time_window
        );

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

      const { error: sendEmailErr } = await this.sendAlertEmails(
        triggeredAlerts
      );

      if (sendEmailErr) {
        console.error(`Failed to send alert emails: ${sendEmailErr}`);
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

      const { error: sendEmailErr } = await this.sendAlertEmails(
        resolvedAlerts
      );

      if (sendEmailErr) {
        console.error(`Failed to send resolve emails: ${sendEmailErr}`);
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
            triggered_value:
              triggeredAlert.triggeredThreshold?.toString() ?? "",
          };
        })
      );

    if (alertHistoryUpdateErr) {
      return err(`Error inserting triggered alerts: ${alertHistoryUpdateErr}`);
    }

    return ok(null);
  }

  async getAlertStateUpdate(
    alert: Database["public"]["Tables"]["alert"]["Row"],
    alertState: AlertState,
    timestamp: number
  ): Promise<AlertStateUpdate> {
    const rate =
      alertState.totalCount > 0
        ? (alertState.errorCount / alertState.totalCount) * 100
        : 0;
    const isRateBelowThreshold = rate < alert.threshold;

    // Handle scenarios where rate is below threshold
    if (isRateBelowThreshold) {
      return this.handleRateBelowThreshold(alert, timestamp);
    }

    // Handle scenarios where rate is above or equal to threshold
    return this.handleRateAboveThreshold(alert, rate, timestamp);
  }

  async handleRateBelowThreshold(
    alert: Database["public"]["Tables"]["alert"]["Row"],
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
    alert: Database["public"]["Tables"]["alert"]["Row"],
    rate: number,
    timestamp: number
  ): Promise<AlertStateUpdate> {
    if (alert.status === "resolved") {
      await this.deleteCooldown(alert.id);
      return {
        status: "triggered",
        timestamp,
        triggeredThreshold: rate,
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
    await this.utilityKv.put(
      this.getCooldownStartTimestamp(alertId),
      timestamp.toString(),
      { expirationTtl: 600 }
    );
  }

  private getCooldownStartTimestamp = (alertId: string) =>
    `alert:${alertId}:cooldown_start_timestamp`;

  private async sendAlertEmails(
    alertStatusUpdates: AlertStateUpdate[]
  ): Promise<Result<null, string>> {
    try {
      const promises = alertStatusUpdates.map(async (alertStatusUpdate) => {
        const { error: emailResErr } = await this.sendAlertEmail(
          alertStatusUpdate
        );

        if (emailResErr) {
          console.error(`Error sending email: ${emailResErr}`);
          throw new Error(emailResErr); // Throw the error to catch it outside
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error(`sendAlertEmails error: ${error}`);
      return err(`sendAlertEmails failed: ${error}`);
    }

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
        `Error sending emails: ${res.status} ${
          res.statusText
        } ${await res.text()}`
      );
    }

    return ok(null);
  }

  private formatAlertNotification(alertStatusUpdate: AlertStateUpdate): {
    subject: string;
    text: string;
    html: string;
  } {
    const alert = alertStatusUpdate.alert;
    const status = alertStatusUpdate.status ?? "";
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

    const formatTimestamp = (timestamp: string) =>
      timestamp ? new Date(timestamp).toLocaleString() : "N/A";

    const formatTimespan = (ms: number) => {
      const minutes = Math.floor(ms / 60000);
      const hours = Math.floor(minutes / 60);
      return hours > 0 ? `${hours} hour(s)` : `${minutes} minute(s)`;
    };

    const headerClass =
      alertStatusUpdate.status === "triggered" ? "Triggered" : "Resolved";
    const subject = `Alert ${capitalizedStatus}: ${alert.name}`;
    const alertTime = alertStatusUpdate.timestamp.toString();
    const actionMessage =
      status === "triggered"
        ? "Please take the necessary action."
        : "No further action is required.";

    const text = `Alert '${
      alert.name
    }' has been ${capitalizedStatus}.\n\nDetails:\n- ${capitalizedStatus} At: ${formatTimestamp(
      alertTime
    )}\n- Threshold: ${alert.threshold}%\n\n${actionMessage}`;
    const html = `<!DOCTYPE html>
    <html lang="en" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" style="color-scheme:light dark;supported-color-schemes:light dark;">
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1 user-scalable=yes">
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title></title>
        <!--[if mso]> 
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <!--[if mso]>
        <style>table,tr,td,p,span,a{mso-line-height-rule:exactly !important;line-height:120% !important;mso-table-lspace:0 !important;mso-table-rspace:0 !important;}.mso-padding{padding-top:20px !important;padding-bottom:20px !important;}
        </style>
        <![endif]-->
        <style>a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}u+#body a{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}#MessageViewBody a{color:inherit!important;text-decoration:none!important;font-size:inherit!important;
          font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}:root{color-scheme:light dark;supported-color-schemes:light dark;}tr{vertical-align:middle;}p,a,li{color:#000000;font-size:16px;mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;}p:first-child{margin-top:0!important;}p:last-child{margin-bottom:0!important;}a{text-decoration:underline;font-weight:bold;color:#0000ff}.alert p{vertical-align:top;color:#fff;font-weight:500;text-align:
          center;border-radius:3px 3px 0 0;background-color:#FF9F00;margin:0;padding:20px;}@media only screen and (max-width:599px){.full-width-mobile{width:100%!important;height:auto!important;}.mobile-padding{padding-left:10px!important;padding-right:10px!important;}.mobile-stack{display:block!important;width:100%!important;}}@media (prefers-color-scheme:dark){body,div,table,td{background-color:#000000!important;color:#ffffff!important;}.content{background-color:#222222!important;}p,li,.white-text{color:#B3BDC4!important;}a{color:#84cfe2!important;}a span,.alert-dark p{color:#ffffff!important;}}
        </style>
      </head>
      <body class="body" style="background-color:#f4f4f4;">
        <div style="display:none;font-size:1px;color:#f4f4f4;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;"></div>
        <span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;"> &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>
        <div role="article" aria-roledescription="email" aria-label="Your Email" lang="en" dir="ltr" style="font-size:16px;font-size:1rem;font-size:max(16px,1rem);background-color:#f4f4f4;">
          <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;max-width:600px;width:100%;background-color:#f4f4f4;">
            <tr style="vertical-align:middle;" valign="middle">
              <td>
                <!--[if mso]>
                <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;">
                  <tr>
                    <td align="center">
                      <!--<![endif]-->
                    </td>
                  </tr>
                  <tr style="vertical-align:middle;" valign="middle">
                    <td align="center">
                      <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;max-width:600px;width:100%;background-color:#fffffe;">
                        <tr style="vertical-align:middle;" valign="middle">
                          <td>
                            <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;max-width:600px;width:100%;">
                              <tr style="vertical-align:middle;" valign="middle">
                                <td class="mso-padding alert alert-warning alert-dark" align="center" bgcolor="#000000" valign="top">
                                  <p style="font-size:20px; mso-line-height-rule:exactly; line-height:28px; font-family:Arial, sans-serif; vertical-align:top; color:${
                                    headerClass === "Resolved"
                                      ? "#00FF00"
                                      : "#FF0000"
                                  }; font-weight:500; text-align:center; border-radius:3px 3px 0 0; background-color:#000000; margin:0; padding:20px; margin-top:0!important; margin-bottom:0!important;">
                                  Helicone Alert ${
                                    headerClass.charAt(0).toUpperCase() +
                                    headerClass.slice(1)
                                  }<br/>${alert.name}
                                  </p>    
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr style="vertical-align:middle;" valign="middle">
                          <td align="center" style="padding:30px;" class="content">
                            <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;max-width:600px;width:100%;background-color:#fffffe;">
                              <tr style="vertical-align:middle;" valign="middle">
                                <td class="content">
                                  <ul style="list-style-type: none; padding: 0; margin: 0; color:#000000; font-size:16px; line-height:24px; font-family:Arial, sans-serif;">
                                    <li><strong>Status:</strong> ${capitalizedStatus}</li>
                                    <li><strong>Triggered At:</strong> ${formatTimestamp(
                                      alertTime
                                    )}</li>
                                    <li><strong>Threshold:</strong> ${
                                      alert.threshold
                                    }%</li>
                                    <li><strong>Metric:</strong> ${
                                      alert.metric
                                    }</li>
                                    <li><strong>Time Window:</strong> ${formatTimespan(
                                      alert.time_window
                                    )}
                                    </li>
                                    <li style="margin-top: 10px;">${actionMessage}</li>
                                  </ul>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr style="vertical-align:middle;" valign="middle">
                          <td align="center" class="content">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%">
                              <tr style="vertical-align:middle;" valign="middle">
                                <td align="left" style="padding:0 0 0 30px;" class="content">
                                  <a href="https://helicone.ai/organization/alerts" style="font-size:16px;mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;font-weight:bold;background:#000000;text-decoration:none;padding:15px 25px;color:#fff;border-radius:4px;display:inline-block;mso-padding-alt:0;text-underline-color:#348eda;" class="dark-button">
                                    <!--[if mso]><i style="letter-spacing:25px;mso-font-width:-100%;mso-text-raise:30pt" hidden>&nbsp;</i>
                                    <![endif]--><span style="mso-text-raise:15pt;">View alert here</span>
                                    <!--[if mso]><i style="letter-spacing:25px;mso-font-width:-100%" hidden>&nbsp;</i>
                                    <![endif]-->
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr style="vertical-align:middle;" valign="middle">
                          <td align="center" style="padding:30px;" class="content">
                            <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;max-width:600px;width:100%;background-color:#fffffe;">
                              <tr style="vertical-align:middle;" valign="middle">
                                <td class="content">
                                  <p style="color:#000000;font-size:16px;mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;margin-top:0!important;margin-bottom:0!important;">Helicone.ai</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;max-width:600px;width:100%;">
                        <tr style="vertical-align:middle;" valign="middle">
                          <td align="center" style="padding:30px 0;">
                            <p style="mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;font-size:14px;color:#999;margin-top:0!important;margin-bottom:0!important;"><a href="https://helicone.ai/organization/alerts" style="mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;text-decoration:underline;font-weight:bold;font-size:14px;color:#999;">Unsubscribe</a> from these&nbsp;alerts.</p>
                            </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!--[if mso]>
                  </td></tr>
                </table>
                <!--<![endif]-->
          </table>
        </div>
      </body>
    </html>`;

    return { subject, text, html };
  }
}

/*
1. Get triggered & resolved alerts from DB
2. Check if triggered alerts are resolved (below threshold and past cooldown)
3. Check if resolved alerts are triggered (above threshold)
4. 
*/
