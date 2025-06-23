import { dbExecute } from "../lib/shared/db/dbExecute";
import { AuthParams } from "../packages/common/auth/types";
import { err, ok, Result } from "../packages/common/result";
import { BaseManager } from "./BaseManager";
import crypto from "crypto";
import { KeyManager } from "./apiKeys/KeyManager";
import {
  CreateRouterConfigResult,
  LatestRouterConfig,
  RouterConfig,
} from "../controllers/public/gatewayController";

export class GatewayManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  async getRouterConfigs(): Promise<
    Result<
      {
        routerConfigs: RouterConfig[];
      },
      string
    >
  > {
    const result = await dbExecute<RouterConfig>(
      `SELECT
        router_configs.id,
        router_configs.name,
        router_config_versions.version as latestVersion,
        router_config_versions.created_at as lastUpdatedAt
      FROM router_configs
      INNER JOIN router_config_versions ON router_configs.id = router_config_versions.config_id
      WHERE router_configs.organization_id = $1
      ORDER BY router_config_versions.created_at DESC
      LIMIT 1`,
      [this.authParams.organizationId]
    );

    if (result.error || !result.data) {
      return err(`Failed to get gateway configs: ${result.error}`);
    }

    return ok({ routerConfigs: result.data });
  }

  async getLatestRouterConfig(
    id: string
  ): Promise<Result<LatestRouterConfig, string>> {
    const result = await dbExecute<LatestRouterConfig>(
      `SELECT router_configs.id, router_configs.name, router_config_versions.version, router_config_versions.config
      FROM router_configs
      INNER JOIN router_config_versions ON router_configs.id = router_config_versions.config_id
      WHERE router_configs.id = $1 AND router_configs.organization_id = $2
      ORDER BY router_config_versions.created_at DESC
      LIMIT 1`,
      [id, this.authParams.organizationId]
    );

    if (result.error || !result.data) {
      return err(`Failed to get gateway config: ${result.error}`);
    }

    return ok(result.data[0]);
  }

  async createRouterConfig(params: {
    name?: string;
    config?: string;
  }): Promise<Result<CreateRouterConfigResult, string>> {
    const { name, config } = params;

    const result = await dbExecute<{ id: string }>(
      `INSERT INTO router_configs (name, organization_id) VALUES ($1, $2) RETURNING id`,
      [name ?? "", this.authParams.organizationId]
    );

    if (result.error || !result.data) {
      return err(`Failed to create router config: ${result.error}`);
    }

    const routerConfigId = result.data[0].id;

    const versionHash = crypto
      .createHash("sha256")
      .update(config ?? "{}")
      .digest("hex");
    const versionResult = await dbExecute<{ id: string }>(
      `INSERT INTO router_config_versions (config_id, version, config) VALUES ($1, $2, $3)`,
      [routerConfigId, versionHash, config ?? "{}"]
    );
    if (versionResult.error || !versionResult.data) {
      return err(
        `Failed to create router config version: ${versionResult.error}`
      );
    }

    const keyManager = new KeyManager(this.authParams);

    const keyResult = await keyManager.createNormalKey(
      `router-${routerConfigId}`,
      "g"
    );
    if (keyResult.error || !keyResult.data) {
      return err(`Failed to create temporary key: ${keyResult.error}`);
    }

    const routerKeyResult = await dbExecute<{ id: string }>(
      `INSERT INTO router_keys (router_id, api_key_id) VALUES ($1, $2)`,
      [routerConfigId, keyResult.data.id]
    );
    if (routerKeyResult.error) {
      return err(`Failed to create router key: ${routerKeyResult.error}`);
    }

    return ok({
      routerConfigId,
      routerVersionId: versionResult.data[0].id,
      apiKey: keyResult.data.apiKey,
    });
  }

  async updateRouterConfig(params: {
    id: string;
    name?: string;
    config?: string;
  }): Promise<Result<null, string>> {
    const { id, name, config } = params;

    const routerConfigResult = await dbExecute<{ id: string }>(
      `SELECT id FROM router_configs WHERE id = $1 AND organization_id = $2`,
      [id, this.authParams.organizationId]
    );
    if (routerConfigResult.error || !routerConfigResult.data) {
      return err(`Failed to get router config: ${routerConfigResult.error}`);
    }

    if (name) {
      const nameResult = await dbExecute(
        `UPDATE router_configs SET name = $1 WHERE id = $2`,
        [name, id]
      );
      if (nameResult.error) {
        return err(`Failed to update router config name: ${nameResult.error}`);
      }
    }

    const versionHash = crypto
      .createHash("sha256")
      .update(config ?? "{}")
      .digest("hex");
    const versionResult = await dbExecute(
      `INSERT INTO router_config_versions (config_id, version, config) VALUES ($1, $2, $3)`,
      [routerConfigResult.data[0].id, versionHash, config ?? "{}"]
    );
    if (versionResult.error) {
      return err(`Failed to update router config: ${versionResult.error}`);
    }

    return ok(null);
  }
}
