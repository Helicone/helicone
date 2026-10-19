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
import { maskProviderSecret } from "../utils/providerKeyAccess";

// ---------------------------------------------------------------------------
// Secret redaction for integration settings
//
// Integration settings can hold third-party credentials (e.g. the Slack OAuth
// response with access_token / authed_user.access_token). They must never be
// returned by the API. Any key that looks like a credential is masked in every
// GET response; on update, masked values sent back by the client are replaced
// with the stored secret so round-tripping settings does not destroy them.
// ---------------------------------------------------------------------------

const SECRET_KEY_PATTERN =
  /(token|secret|key|password|passwd|credential|signature|private)/i;
const MASK_MARKER = "\u2022\u2022\u2022\u2022";

export function isSecretSettingKey(key: string): boolean {
  return SECRET_KEY_PATTERN.test(key);
}

function maskAllStrings(value: Json | undefined): Json | undefined {
  if (typeof value === "string") {
    return maskProviderSecret(value) ?? "";
  }
  if (Array.isArray(value)) {
    return value.map((v) => maskAllStrings(v) as Json);
  }
  if (value && typeof value === "object") {
    const out: { [key: string]: Json | undefined } = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = maskAllStrings(v);
    }
    return out;
  }
  return value;
}

/** Returns a copy of `settings` with every credential-like value masked. */
export function redactIntegrationSettings(
  settings: Json | undefined
): Json | undefined {
  if (Array.isArray(settings)) {
    return settings.map((v) => redactIntegrationSettings(v) as Json);
  }
  if (settings && typeof settings === "object") {
    const out: { [key: string]: Json | undefined } = {};
    for (const [k, v] of Object.entries(settings)) {
      out[k] = isSecretSettingKey(k)
        ? maskAllStrings(v)
        : redactIntegrationSettings(v);
    }
    return out;
  }
  return settings;
}

export function redactIntegration<T extends { settings?: Json }>(
  integration: T
): T {
  return {
    ...integration,
    settings: redactIntegrationSettings(integration.settings) as Json,
  };
}

function containsMask(value: Json | undefined): boolean {
  if (typeof value === "string") return value.includes(MASK_MARKER);
  if (Array.isArray(value)) return value.some(containsMask);
  if (value && typeof value === "object") {
    return Object.values(value).some(containsMask);
  }
  return false;
}

/**
 * For an update, replaces credential-like values that are still masked (the
 * client echoed back what GET returned) with the stored value. Masked values
 * with no stored counterpart are dropped rather than persisted.
 */
export function restoreRedactedSecrets(
  incoming: Json | undefined,
  existing: Json | undefined
): Json | undefined {
  if (
    !incoming ||
    typeof incoming !== "object" ||
    Array.isArray(incoming)
  ) {
    return incoming;
  }
  const existingObj =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? existing
      : {};
  const out: { [key: string]: Json | undefined } = {};
  for (const [k, v] of Object.entries(incoming)) {
    if (isSecretSettingKey(k) && containsMask(v)) {
      if (k in existingObj) {
        out[k] = existingObj[k];
      }
      continue;
    }
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = restoreRedactedSecrets(v, existingObj[k]);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export class IntegrationManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  public async createIntegration(
    params: IntegrationCreateParams
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
        ]
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
        [this.authParams.organizationId]
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
    params: IntegrationUpdateParams
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
        let settings = params.settings;
        if (containsMask(settings)) {
          const existing = await dbExecute<{ settings: Json }>(
            `SELECT settings FROM integrations
             WHERE id = $1 AND organization_id = $2
             LIMIT 1`,
            [integrationId, this.authParams.organizationId]
          );
          if (existing.error) {
            return err(existing.error);
          }
          settings = restoreRedactedSecrets(
            settings,
            existing.data?.[0]?.settings
          ) as Json;
        }
        updates.push(`settings = $${paramIndex++}`);
        values.push(settings);
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
        values
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
        [integrationId, this.authParams.organizationId]
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
        [this.authParams.organizationId, integrationType]
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
        [this.authParams.organizationId]
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

      return ok(channels as Array<{ id: string; name: string }>);
    } catch (error) {
      if (error instanceof Error) {
        return err(error.message);
      }
      return err("An unknown error occurred");
    }
  }
}
