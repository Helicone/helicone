import { dbExecute } from "../lib/shared/db/dbExecute";
import { AuthParams } from "../packages/common/auth/types";
import { err, ok, Result } from "../packages/common/result";
import { BaseManager } from "./BaseManager";
import crypto from "crypto";
import { KeyManager } from "./apiKeys/KeyManager";
import { GatewayConfig } from "../controllers/public/gatewayController";

export class GatewayManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  async getGatewayConfigs(): Promise<
    Result<{ gatewayConfigs: { id: string; name: string }[] }, string>
  > {
    const result = await dbExecute<{ id: string; name: string }>(
      `SELECT id, name FROM gateway_configs WHERE organization_id = $1`,
      [this.authParams.organizationId]
    );

    if (result.error || !result.data) {
      return err(`Failed to get gateway configs: ${result.error}`);
    }

    return ok({ gatewayConfigs: result.data });
  }

  async getGatewayConfig(id: string): Promise<Result<GatewayConfig, string>> {
    const result = await dbExecute<GatewayConfig>(
      `SELECT gateway_configs.id, gateway_configs.name, gateway_config_versions.version, gateway_config_versions.config
      FROM gateway_configs
      INNER JOIN gateway_config_versions ON gateway_configs.id = gateway_config_versions.config_id
      WHERE gateway_configs.id = $1 AND gateway_configs.organization_id = $2
      ORDER BY gateway_config_versions.created_at DESC
      LIMIT 1`,
      [id, this.authParams.organizationId]
    );

    if (result.error || !result.data) {
      return err(`Failed to get gateway config: ${result.error}`);
    }

    return ok(result.data[0]);
  }

  async createGatewayConfig(params: {
    name?: string;
    config?: string;
  }): Promise<
    Result<
      { gatewayConfigId: string; gatewayVersionId: string; apiKey: string },
      string
    >
  > {
    const { name, config } = params;

    const keyManager = new KeyManager(this.authParams);

    const keyResult = await keyManager.createTempKey(
      "auto-generated-experiment-key",
      "w"
    );
    if (keyResult.error || !keyResult.data) {
      return err(`Failed to create temporary key: ${keyResult.error}`);
    }

    const result = await dbExecute<{ id: string }>(
      `INSERT INTO gateway_configs (name, organization_id, key_id) VALUES ($1, $2, $3)`,
      [name ?? "", this.authParams.organizationId, keyResult.data.id]
    );

    if (result.error || !result.data) {
      return err(`Failed to create gateway config: ${result.error}`);
    }

    const gatewayConfigId = result.data[0].id;

    const versionHash = crypto
      .createHash("sha256")
      .update(config ?? "{}" + Date.now().toString())
      .digest("hex");
    const versionResult = await dbExecute<{ id: string }>(
      `INSERT INTO gateway_config_versions (config_id, version, config) VALUES ($1, $2, $3)`,
      [gatewayConfigId, versionHash, config ?? "{}"]
    );
    if (versionResult.error || !versionResult.data) {
      return err(
        `Failed to create gateway config version: ${versionResult.error}`
      );
    }

    return ok({
      gatewayConfigId,
      gatewayVersionId: versionResult.data[0].id,
      apiKey: keyResult.data.apiKey,
    });
  }

  async updateGatewayConfig(params: {
    id: string;
    name?: string;
    config?: string;
  }): Promise<Result<null, string>> {
    const { id, name, config } = params;

    const gatewayConfigResult = await dbExecute<{ id: string }>(
      `SELECT id FROM gateway_configs WHERE id = $1 AND organization_id = $2`,
      [id, this.authParams.organizationId]
    );
    if (gatewayConfigResult.error || !gatewayConfigResult.data) {
      return err(`Failed to get gateway config: ${gatewayConfigResult.error}`);
    }

    if (name) {
      const nameResult = await dbExecute(
        `UPDATE gateway_configs SET name = $1 WHERE id = $2`,
        [name, id]
      );
      if (nameResult.error) {
        return err(`Failed to update gateway config name: ${nameResult.error}`);
      }
    }

    const versionHash = crypto
      .createHash("sha256")
      .update(config ?? "{}" + Date.now().toString())
      .digest("hex");
    const versionResult = await dbExecute(
      `INSERT INTO gateway_config_versions (config_id, version, config) VALUES ($1, $2, $3)`,
      [gatewayConfigResult.data[0].id, versionHash, config ?? "{}"]
    );
    if (versionResult.error) {
      return err(`Failed to update gateway config: ${versionResult.error}`);
    }

    return ok(null);
  }
}
