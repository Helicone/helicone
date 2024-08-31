import { AuthParams, supabaseServer } from "../lib/db/supabase";
import { ok, err, Result } from "../lib/shared/result";
import { BaseManager } from "./BaseManager";
import {
  Integration,
  IntegrationCreateParams,
  IntegrationUpdateParams,
} from "../controllers/public/integrationController";

export class IntegrationManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  public async createIntegration(
    params: IntegrationCreateParams
  ): Promise<Result<{ id: string }, string>> {
    const { data, error } = await supabaseServer.client
      .from("integrations")
      .insert({
        organization_id: this.authParams.organizationId,
        integration_name: params.integration_name,
        settings: params.settings,
        active: params.active ?? false,
      })
      .select("id")
      .single();

    if (error) {
      return err(error.message);
    }

    return ok({ id: data.id });
  }

  public async getIntegrations(): Promise<Result<Array<Integration>, string>> {
    const { data, error } = await supabaseServer.client
      .from("integrations")
      .select("id, integration_name, active, settings")
      .eq("organization_id", this.authParams.organizationId);

    if (error) {
      return err(error.message);
    }

    return ok(data as Integration[]);
  }

  public async updateIntegration(
    integrationId: string,
    params: IntegrationUpdateParams
  ): Promise<Result<null, string>> {
    const { error } = await supabaseServer.client
      .from("integrations")
      .update(params)
      .eq("id", integrationId)
      .eq("organization_id", this.authParams.organizationId);

    if (error) {
      return err(error.message);
    }

    return ok(null);
  }

  public async getIntegration(integrationId: string): Promise<
    Result<
      {
        id: string;
        integration_name: string;
        settings: Record<string, any>;
        active: boolean;
      },
      string
    >
  > {
    const { data, error } = await supabaseServer.client
      .from("integrations")
      .select("id, integration_name, settings, active")
      .eq("id", integrationId)
      .eq("organization_id", this.authParams.organizationId)
      .single();

    if (error) {
      return err(error.message);
    }

    return ok(
      data as {
        id: string;
        integration_name: string;
        settings: Record<string, any>;
        active: boolean;
      }
    );
  }
}
