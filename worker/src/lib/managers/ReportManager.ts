import { Env } from "../..";
import { Result, err, ok } from "../util/results";
import { Integration, ReportStore } from "../db/ReportStore";

export class ReportManager {
  private resendApiKey: Env["RESEND_API_KEY"];

  constructor(private reportStore: ReportStore, private env: Env) {
    this.resendApiKey = env.RESEND_API_KEY;
  }

  public async sendReports() {
    const { data: allReports, error: allReportsErr } =
      await this.reportStore.getReports();

    if (allReportsErr) {
      return err(`Error fetching reports: ${allReportsErr}`);
    }

    if (!allReports) {
      return ok(`No reports found`);
    }
    const { error: sendEmailErr } = await this.sendReportEmails(allReports);
    const { error: sendSlackErr } = await this.sendReportSlacks(allReports);

    if (sendEmailErr) {
      return err(`Failed to send report emails: ${sendEmailErr}`);
    }

    if (sendSlackErr) {
      return err(`Failed to send report slacks: ${sendSlackErr}`);
    }

    return ok(null);
  }

  private async sendReportEmails(
    reports: Integration[]
  ): Promise<Result<null, string>> {
    const promises = reports.map(async (report) => {
      const settings = report.settings as {
        emails: string[];
        slack_channels: string[];
      };
      if (settings.emails.length > 0) {
        const { error: emailResErr } = await this.sendReportEmail(
          report,
          settings.emails
        );
        if (emailResErr) {
          console.error(`Error sending email: ${emailResErr}`);
          return err(emailResErr);
        }
      }
    });

    await Promise.all(promises);

    return ok(null);
  }

  private async sendReportEmail(
    report: Integration,
    emails: string[]
  ): Promise<Result<null, string>> {
    const { subject, text, html } = await this.formatReportNotification(report);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Helicone Report <reports@helicone.ai>",
        to: emails,
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

  private async sendReportSlacks(
    reports: Integration[]
  ): Promise<Result<null, string>> {
    const promises = reports.map(async (report) => {
      const settings = report.settings as {
        emails: string[];
        slack_channels: string[];
      };
      if (settings.slack_channels.length > 0) {
        const { error: slackResErr } = await this.sendReportSlack(
          report,
          settings.slack_channels
        );
        if (slackResErr) {
          console.error(`Error sending slack: ${slackResErr}`);
          return err(slackResErr);
        }
      }
    });

    await Promise.all(promises);

    return ok(null);
  }

  private async sendReportSlack(
    report: Integration,
    slack_channels: string[]
  ): Promise<Result<null, string>> {
    const { slack_json } = await this.formatReportNotification(report);

    for (const channel of slack_channels) {
      const slackIntegration = report.organization.integrations.filter(
        (integration) => integration.integration_name === "slack"
      )[0];
      if (!slackIntegration) {
        return err(
          `Slack integration not found for report ${report.integration_name}`
        );
      }
      const settings = slackIntegration.settings as { access_token: string };
      if (!settings.access_token) {
        return err(
          `Slack access token not found for organization ${report.organization.name}`
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
          `Error sending slack messages: ${res.status} ${
            res.statusText
          } ${await res.text()}`
        );
      }

      const data = (await res.json()) as { ok: boolean; error?: string };

      if (!data.ok) {
        return err(`Error sending slack messages: ${data.error}`);
      }
    }

    return ok(null);
  }

  private async formatReportNotification(report: Integration): Promise<{
    subject: string;
    text: string;
    html: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slack_json: Record<string, any>;
  }> {
    const text = `This is a test report`;
    const subject = `Report`;

    const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

    const [
      cost,
      numberOfRequests,
      errorRate,
      numberOfUsers,
      numberOfThreats,
      numberOfSessions,
      avgCostOfSessions,
    ] = await Promise.all([
      this.reportStore.getCost(report.organization_id, ONE_WEEK_MS),
      this.reportStore.getNumberOfRequests(report.organization_id, ONE_WEEK_MS),
      this.reportStore.getErrorRate(report.organization_id, ONE_WEEK_MS),
      this.reportStore.getNumberOfUsers(report.organization_id, ONE_WEEK_MS),
      this.reportStore.getNumberOfThreats(report.organization_id, ONE_WEEK_MS),
      this.reportStore.getNumberOfSessions(report.organization_id, ONE_WEEK_MS),
      this.reportStore.getAvgCostOfSessions(
        report.organization_id,
        ONE_WEEK_MS
      ),
    ]);

    const EMOJIS = {
      up: "arrow_upper_right",
      down: "arrow_lower_right",
    };

    const slack_json = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `:memo: Weekly Report`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Here's a summary of your usage this week",
          },
        },
        {
          type: "rich_text",
          elements: [
            {
              type: "rich_text_list",
              style: "bullet",
              elements: [
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: "Cost: ",
                    },
                    {
                      type: "text",
                      text: `$${cost.data?.value} (`,
                    },
                    {
                      type: "emoji",
                      name: `${
                        EMOJIS[
                          this.formatChangeData(
                            cost.data?.value || 0,
                            cost.data?.previous || 0
                          )[1]
                        ]
                      }`,
                    },
                    {
                      type: "text",
                      text: ` ${
                        this.formatChangeData(
                          cost.data?.value || 0,
                          cost.data?.previous || 0
                        )[0]
                      })`,
                    },
                  ],
                },
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: "Requests: ",
                    },
                    {
                      type: "text",
                      text: `${numberOfRequests.data?.value} (`,
                    },
                    {
                      type: "emoji",
                      name: `${
                        EMOJIS[
                          this.formatChangeData(
                            numberOfRequests.data?.value || 0,
                            numberOfRequests.data?.previous || 0
                          )[1]
                        ]
                      }`,
                    },
                    {
                      type: "text",
                      text: ` ${
                        this.formatChangeData(
                          numberOfRequests.data?.value || 0,
                          numberOfRequests.data?.previous || 0
                        )[0]
                      })`,
                    },
                  ],
                },
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: "Error Rate: ",
                    },
                    {
                      type: "text",
                      text: `${errorRate.data?.value} (`,
                    },
                    {
                      type: "emoji",
                      name: `${
                        EMOJIS[
                          this.formatChangeData(
                            errorRate.data?.value || 0,
                            errorRate.data?.previous || 0,
                            true
                          )[1]
                        ]
                      }`,
                    },
                    {
                      type: "text",
                      text: ` ${
                        this.formatChangeData(
                          errorRate.data?.value || 0,
                          errorRate.data?.previous || 0
                        )[0]
                      })`,
                    },
                  ],
                },
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: "Users: ",
                    },
                    {
                      type: "text",
                      text: `${numberOfUsers.data?.value} (`,
                    },
                    {
                      type: "emoji",
                      name: `${
                        EMOJIS[
                          this.formatChangeData(
                            numberOfUsers.data?.value || 0,
                            numberOfUsers.data?.previous || 0
                          )[1]
                        ]
                      }`,
                    },
                    {
                      type: "text",
                      text: ` ${
                        this.formatChangeData(
                          numberOfUsers.data?.value || 0,
                          numberOfUsers.data?.previous || 0
                        )[0]
                      })`,
                    },
                  ],
                },
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: "Threats: ",
                    },
                    {
                      type: "text",
                      text: `${numberOfThreats.data?.value} (`,
                    },
                    {
                      type: "emoji",
                      name: `${
                        EMOJIS[
                          this.formatChangeData(
                            numberOfThreats.data?.value || 0,
                            numberOfThreats.data?.previous || 0
                          )[1]
                        ]
                      }`,
                    },
                    {
                      type: "text",
                      text: ` ${
                        this.formatChangeData(
                          numberOfThreats.data?.value || 0,
                          numberOfThreats.data?.previous || 0
                        )[0]
                      })`,
                    },
                  ],
                },
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: "Sessions: ",
                    },
                    {
                      type: "text",
                      text: `${numberOfSessions.data?.value} (`,
                    },
                    {
                      type: "emoji",
                      name: `${
                        EMOJIS[
                          this.formatChangeData(
                            numberOfSessions.data?.value || 0,
                            numberOfSessions.data?.previous || 0
                          )[1]
                        ]
                      }`,
                    },
                    {
                      type: "text",
                      text: ` ${
                        this.formatChangeData(
                          numberOfSessions.data?.value || 0,
                          numberOfSessions.data?.previous || 0
                        )[0]
                      })`,
                    },
                  ],
                },
                {
                  type: "rich_text_section",
                  elements: [
                    {
                      type: "text",
                      text: "Avg Cost of Sessions: ",
                    },
                    {
                      type: "text",
                      text: `$${avgCostOfSessions.data?.value} (`,
                    },
                    {
                      type: "emoji",
                      name: `${
                        EMOJIS[
                          this.formatChangeData(
                            avgCostOfSessions.data?.value || 0,
                            avgCostOfSessions.data?.previous || 0
                          )[1]
                        ]
                      }`,
                    },
                    {
                      type: "text",
                      text: ` ${
                        this.formatChangeData(
                          avgCostOfSessions.data?.value || 0,
                          avgCostOfSessions.data?.previous || 0
                        )[0]
                      })`,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Checkout your dashboard for more details",
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Dashboard",
            },
            url: "https://us.helicone.ai/dashboard",
          },
        },
      ],
    };

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
                                  <p style="font-size:20px; mso-line-height-rule:exactly; line-height:28px; font-family:Arial, sans-serif; vertical-align:top; color:#FF0000; font-weight:500; text-align:center; border-radius:3px 3px 0 0; background-color:#000000; margin:0; padding:20px; margin-top:0!important; margin-bottom:0!important;">
                                  Helicone Weekly Report
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
                                  <ul>
                                    <li>Cost: $${cost.data?.value} (${
      this.formatChangeData(cost.data?.value || 0, cost.data?.previous || 0)[1]
    } by ${
      this.formatChangeData(cost.data?.value || 0, cost.data?.previous || 0)[0]
    })</li>
                                    <li>Requests: ${
                                      numberOfRequests.data?.value
                                    } (${
      this.formatChangeData(
        numberOfRequests.data?.value || 0,
        numberOfRequests.data?.previous || 0
      )[1]
    } by ${
      this.formatChangeData(
        numberOfRequests.data?.value || 0,
        numberOfRequests.data?.previous || 0
      )[0]
    })</li>
                                    <li>Error Rate: ${errorRate.data?.value} (${
      this.formatChangeData(
        errorRate.data?.value || 0,
        errorRate.data?.previous || 0,
        true
      )[1]
    } by ${
      this.formatChangeData(
        errorRate.data?.value || 0,
        errorRate.data?.previous || 0
      )[0]
    })</li>
                                    <li>Users: ${numberOfUsers.data?.value} (${
      this.formatChangeData(
        numberOfUsers.data?.value || 0,
        numberOfUsers.data?.previous || 0
      )[1]
    } by ${
      this.formatChangeData(
        numberOfUsers.data?.value || 0,
        numberOfUsers.data?.previous || 0
      )[0]
    })</li>
                                    <li>Threats: ${
                                      numberOfThreats.data?.value
                                    } (${
      this.formatChangeData(
        numberOfThreats.data?.value || 0,
        numberOfThreats.data?.previous || 0
      )[1]
    } by ${
      this.formatChangeData(
        numberOfThreats.data?.value || 0,
        numberOfThreats.data?.previous || 0
      )[0]
    })</li>
    <li>Sessions: ${numberOfSessions.data?.value} (${
      this.formatChangeData(
        numberOfSessions.data?.value || 0,
        numberOfSessions.data?.previous || 0
      )[1]
    } by ${
      this.formatChangeData(
        numberOfSessions.data?.value || 0,
        numberOfSessions.data?.previous || 0
      )[0]
    })</li>
    <li>Avg Cost of Sessions: $${avgCostOfSessions.data?.value} (${
      this.formatChangeData(
        avgCostOfSessions.data?.value || 0,
        avgCostOfSessions.data?.previous || 0
      )[1]
    } by ${
      this.formatChangeData(
        avgCostOfSessions.data?.value || 0,
        avgCostOfSessions.data?.previous || 0
      )[0]
    })</li>
                                    
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
                                  <a href="https://helicone.ai/dashboard" style="font-size:16px;mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;font-weight:bold;background:#000000;text-decoration:none;padding:15px 25px;color:#fff;border-radius:4px;display:inline-block;mso-padding-alt:0;text-underline-color:#348eda;" class="dark-button">
                                    <!--[if mso]><i style="letter-spacing:25px;mso-font-width:-100%;mso-text-raise:30pt" hidden>&nbsp;</i>
                                    <![endif]--><span style="mso-text-raise:15pt;">View Dashboard</span>
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
                            <p style="mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;font-size:14px;color:#999;margin-top:0!important;margin-bottom:0!important;"><a href="https://helicone.ai/alerts" style="mso-line-height-rule:exactly;line-height:24px;font-family:Arial,sans-serif;text-decoration:underline;font-weight:bold;font-size:14px;color:#999;">Unsubscribe</a> from these&nbsp;alerts.</p>
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

    return { subject, text, html, slack_json };
  }

  private formatChangeData(
    current: number,
    previous: number,
    inPercentage = false
  ): [string, "up" | "down"] {
    const change =
      previous === 0 || inPercentage
        ? `${current - previous}`
        : `${Math.abs(((current - previous) / previous) * 100).toFixed(2)}%`;

    return [change, current > previous ? "up" : "down"];
  }
}
