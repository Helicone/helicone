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

    const headerClass =
      alertUpdate.status === "triggered" ? "Triggered" : "Resolved";
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
                                  }<br/>${alert.name}.
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
                                  <a href="https://helicone.ai" style="font-size:16px;mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;font-weight:bold;background:#000000;text-decoration:none;padding:15px 25px;color:#fff;border-radius:4px;display:inline-block;mso-padding-alt:0;text-underline-color:#348eda;" class="dark-button">
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
                            <p style="mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;font-size:14px;color:#999;margin-top:0!important;margin-bottom:0!important;"><a href="https://helicone.ai" style="mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;text-decoration:underline;font-weight:bold;font-size:14px;color:#999;">Unsubscribe</a> from these&nbsp;alerts.</p>
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
