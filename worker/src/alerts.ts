import { SupabaseClient } from "@supabase/supabase-js";
import { Alerter } from "./db/Alerter";
import { Database } from "../supabase/database.types";
import { AlertMetricEvent, ResolvedAlert } from "./db/AtomicAlerter";
import { Result, err, ok } from "./results";

export class Alerts {
  private supabaseClient: SupabaseClient<Database>;
  private alerter: Alerter;

  constructor(
    supabaseClient: SupabaseClient<Database>,
    atomicAlerter: DurableObjectNamespace
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

    const triggeredRes = await this.supabaseClient
      .from("alert_history")
      .insert(alertRes.data.triggered);

    if (triggeredRes.error) {
      console.error("Error inserting triggered alerts", triggeredRes.error);
    }

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
        await this.alerter.resolveTriggeredAlert(triggeredAlert);

      if (resAlertsErr || !resAlert) {
        console.log("Error resolving alert", resAlertsErr);
        continue;
      }

      resolvedAlerts.push(resAlert);
    }

    for (const alertUpdate of resolvedAlerts) {
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
    }
  }
}
