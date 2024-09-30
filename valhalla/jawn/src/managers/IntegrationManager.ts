import { AuthParams, supabaseServer } from "../lib/db/supabase";
import { ok, err, Result } from "../lib/shared/result";
import { BaseManager } from "./BaseManager";
import {
  Integration,
  IntegrationCreateParams,
  IntegrationUpdateParams,
} from "../controllers/public/integrationController";
import { Json } from "../lib/db/database.types";

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

  public async getIntegrationByType(integrationType: string): Promise<
    Result<
      {
        id: string;
        integration_name: string;
        settings: Json;
        active: boolean;
      },
      string
    >
  > {
    const { data, error } = await supabaseServer.client
      .from("integrations")
      .select("id, integration_name, settings, active")
      .eq("organization_id", this.authParams.organizationId)
      .eq("integration_name", integrationType)
      .single();

    if (error) {
      return err(error.message);
    }

    return ok(
      data satisfies {
        id: string;
        integration_name: string;
        settings: Json;
        active: boolean;
      }
    );
  }

  public async getSlackChannels(): Promise<
    Result<Array<{ id: string; name: string }>, string>
  > {
    const { data, error } = await supabaseServer.client
      .from("integrations")
      .select("id, integration_name, settings, active")
      .eq("integration_name", "slack")
      .eq("organization_id", this.authParams.organizationId);

    if (error) {
      return err(error.message);
    }

    if (!data || data.length === 0) {
      return err("No data found");
    }

    const slackSettings = data[0].settings as Record<string, any>;
    let channels: Array<{ id: string; name: string }> = [];
    let nextCursor: string | null = null;
    try {
      const response = await fetch(
        "https://slack.com/api/conversations.list?limit=1000&types=public_channel,private_channel&exclude_archived=true",
        {
          // TODO: implement pagination
          headers: {
            Authorization: `Bearer ${slackSettings.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return err("Failed to fetch Slack channels");
      }

      const json = await response.json();

      if (!json.ok) {
        if (json.error === "ratelimited") {
          return err("Rate limited");
        }
        return err("Failed to fetch Slack channels");
      }

      channels = json.channels.map((channel: { id: string; name: string }) => ({
        id: channel.id,
        name: channel.name,
      }));
      nextCursor = json.response_metadata?.next_cursor ?? null;
      // this should be changed to a more scalable solution
      const MAX_ITERATIONS = 10;
      let iterations = 0;
      while (nextCursor && iterations < MAX_ITERATIONS) {
        const nextResponse = await fetch(
          `https://slack.com/api/conversations.list?limit=1000&types=private_channel,public_channel&exclude_archived=true&cursor=${nextCursor}`,
          {
            headers: {
              Authorization: `Bearer ${slackSettings.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!nextResponse.ok) {
          return err("Failed to fetch Slack channels");
        }

        const nextJson = await nextResponse.json();

        if (!nextJson.ok) {
          if (nextJson.error === "ratelimited") {
            return err("Rate limited");
          }
          return err("Failed to fetch Slack channels");
        }

        channels.push(
          ...nextJson.channels.map((channel: { id: string; name: string }) => ({
            id: channel.id,
            name: channel.name,
          }))
        );
        nextCursor = nextJson.response_metadata?.next_cursor ?? null;
        iterations++;
      }
      console.log("Fetched all Slack channels", channels.length);

      return ok(channels as Array<{ id: string; name: string }>);
    } catch (error) {
      if (error instanceof Error) {
        return err(error.message);
      }
      return err("An unknown error occurred");
    }
  }
}
