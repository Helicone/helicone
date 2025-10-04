import { AuthParams } from "../packages/common/auth/types";
import { dbExecute } from "../lib/shared/db/dbExecute";
import { ok, err, Result } from "../packages/common/result";
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
    params: IntegrationCreateParams,
  ): Promise<Result<{ id: string }, string>> {
    try {
      const result = await dbExecute<{ id: string }>(
        `INSERT INTO integrations (organization_id, integration_name, settings, active)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          this.authParams.organizationId,
          params.integration_name,
          params.settings,
          params.active ?? false,
        ],
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err(result.error ?? "Failed to create integration");
      }

      return ok({ id: result.data[0].id });
    } catch (error) {
      console.error("Error creating integration:", error);
      return err(String(error));
    }
  }

  public async getIntegrations(): Promise<Result<Array<Integration>, string>> {
    try {
      const result = await dbExecute<Integration>(
        `SELECT id, integration_name, active, settings
         FROM integrations
         WHERE organization_id = $1`,
        [this.authParams.organizationId],
      );

      if (result.error) {
        return err(result.error ?? "Failed to get integrations");
      }

      return ok(result.data ?? []);
    } catch (error) {
      console.error("Error getting integrations:", error);
      return err(String(error));
    }
  }

  public async updateIntegration(
    integrationId: string,
    params: IntegrationUpdateParams,
  ): Promise<Result<null, string>> {
    try {
      // Build the SET part of the query dynamically based on provided params
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (params.integration_name !== undefined) {
        updates.push(`integration_name = $${paramIndex++}`);
        values.push(params.integration_name);
      }

      if (params.settings !== undefined) {
        updates.push(`settings = $${paramIndex++}`);
        values.push(params.settings);
      }

      if (params.active !== undefined) {
        updates.push(`active = $${paramIndex++}`);
        values.push(params.active);
      }

      if (updates.length === 0) {
        return ok(null); // Nothing to update
      }

      // Add the WHERE condition parameters
      values.push(integrationId, this.authParams.organizationId);

      const result = await dbExecute(
        `UPDATE integrations
         SET ${updates.join(", ")}
         WHERE id = $${paramIndex++}
         AND organization_id = $${paramIndex}`,
        values,
      );

      if (result.error) {
        return err(result.error ?? "Failed to update integration");
      }

      return ok(null);
    } catch (error) {
      console.error("Error updating integration:", error);
      return err(String(error));
    }
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
    try {
      const result = await dbExecute<{
        id: string;
        integration_name: string;
        settings: Record<string, any>;
        active: boolean;
      }>(
        `SELECT id, integration_name, settings, active
         FROM integrations
         WHERE id = $1
         AND organization_id = $2
         LIMIT 1`,
        [integrationId, this.authParams.organizationId],
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err(result.error ?? "Integration not found");
      }

      return ok(result.data[0]);
    } catch (error) {
      console.error("Error getting integration:", error);
      return err(String(error));
    }
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
    try {
      const result = await dbExecute<{
        id: string;
        integration_name: string;
        settings: Json;
        active: boolean;
      }>(
        `SELECT id, integration_name, settings, active
         FROM integrations
         WHERE organization_id = $1
         AND integration_name = $2
         LIMIT 1`,
        [this.authParams.organizationId, integrationType],
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err(result.error ?? "Integration not found");
      }

      return ok(result.data[0]);
    } catch (error) {
      console.error("Error getting integration by type:", error);
      return err(String(error));
    }
  }

  public async getSlackChannels(): Promise<
    Result<Array<{ id: string; name: string }>, string>
  > {
    try {
      const result = await dbExecute<{
        id: string;
        integration_name: string;
        settings: Record<string, any>;
        active: boolean;
      }>(
        `SELECT id, integration_name, settings, active
         FROM integrations
         WHERE integration_name = 'slack'
         AND organization_id = $1
         LIMIT 1`,
        [this.authParams.organizationId],
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err("No Slack integration found");
      }

      const slackSettings = result.data[0].settings as Record<string, any>;
      let channels: Array<{ id: string; name: string }> = [];
      let nextCursor: string | null = null;

      const response = await fetch(
        "https://slack.com/api/conversations.list?limit=1000&types=public_channel,private_channel&exclude_archived=true",
        {
          // TODO: implement pagination
          headers: {
            Authorization: `Bearer ${slackSettings.access_token}`,
            "Content-Type": "application/json",
          },
        },
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
          },
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
          })),
        );
        nextCursor = nextJson.response_metadata?.next_cursor ?? null;
        iterations++;
      }

      return ok(channels as Array<{ id: string; name: string }>);
    } catch (error) {
      if (error instanceof Error) {
        return err(error.message);
      }
      return err("An unknown error occurred");
    }
  }
}
