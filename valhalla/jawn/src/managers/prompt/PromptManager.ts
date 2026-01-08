// src/users/usersService.ts
import { autoFillInputs } from "@helicone/prompts";
import {
  CreatePromptResponse,
  PromptCreateSubversionParams,
  PromptEditSubversionLabelParams,
  PromptEditSubversionTemplateParams,
  PromptQueryParams,
  PromptResult,
  PromptVersionResult,
  PromptVersionResultCompiled,
  PromptVersionResultFilled,
  PromptsQueryParams,
  PromptsResult,
} from "../../controllers/public/promptController";
import {
  PromptCreateResponse,
  PromptVersionCounts,
} from "../../controllers/public/prompt2025Controller";
import { Prompt2025, Prompt2025Version } from "@helicone-package/prompts/types";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { HELICONE_DB } from "../../lib/shared/db/pgpClient";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { buildFilterPostgres } from "@helicone-package/filters/filters";
import { Result, err, ok, resultMap } from "../../packages/common/result";
import { BaseManager } from "../BaseManager";
import { RequestManager } from "../request/RequestManager";

import { S3Client } from "../../lib/shared/db/s3Client";
import type { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import { AuthParams } from "../../packages/common/auth/types";
import { Prompt2025Input } from "../../lib/db/ClickhouseWrapper";
import { resetPromptCache as invalidatePromptCache } from "../../lib/resetPromptCache";


const PROMPT_ID_LENGTH = 6;
const MAX_PROMPT_ID_GENERATION_ATTEMPTS = 3;
const PRODUCTION_ENVIRONMENT = 'production';

export class Prompt2025Manager extends BaseManager {
  private s3Client: S3Client;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY || undefined,
      process.env.S3_SECRET_KEY || undefined,
      process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
      process.env.S3_PROMPT_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );
  }

  private async resetPromptCache(params: {
    promptId: string;
    versionId?: string;
    environment?: string;
  }): Promise<void> {
    try {
      await invalidatePromptCache({
        orgId: this.authParams.organizationId,
        ...params,
      });
    } catch (error) {
      console.error("Error resetting prompt cache:", error);
    }
  }

  private generateRandomPromptId(): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < PROMPT_ID_LENGTH; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  async totalPrompts(): Promise<Result<number, string>> {
    const result = await dbExecute<{ count: number }>(
      `SELECT COUNT(*) as count FROM prompts_2025 WHERE organization = $1 AND soft_delete is false`,
      [this.authParams.organizationId]
    );
    if (result.error) {
      return err(result.error);
    }
    return ok(Number(result.data?.[0]?.count ?? 0));
  }

  async getPromptEnvironments(): Promise<Result<string[], string>> {
    const result = await dbExecute<{ environment: string }>(
      `SELECT DISTINCT unnest(environments) as environment
       FROM prompts_2025_versions
       WHERE organization = $1 AND soft_delete = false AND environments IS NOT NULL
       ORDER BY environment`,
      [this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    const environments = result.data?.map(row => row.environment) || [];
    return ok(environments);
  }


  async getPromptTags(): Promise<Result<string[], string>> {
    const result = await dbExecute<{ tags: string }>(
      `SELECT DISTINCT UNNEST(tags) as tags FROM prompts_2025 WHERE organization = $1 AND soft_delete is false`,
      [this.authParams.organizationId]
    );
    if (result.error) {
      return err(result.error);
    }
    return ok(result.data?.map((tag: { tags: string }) => tag.tags) ?? []);
  }

  async getPrompt(promptId: string): Promise<Result<Prompt2025, string>> {
    const result = await dbExecute<Prompt2025>(
      `SELECT
        id,
        name,
        tags,
        created_at
      FROM prompts_2025
      WHERE id = $1 AND organization = $2 AND soft_delete is false
      LIMIT 1
      `,
      [promptId, this.authParams.organizationId]
    );
    if (result.error) {
      return err(result.error);
    }
    if (!result.data?.[0]) {
      return err("Prompt not found");
    }
    return ok(result.data[0]);
  }

  async renamePrompt(params: {
    promptId: string;
    name: string;
  }): Promise<Result<null, string>> {
    const result = await dbExecute<null>(
      `UPDATE prompts_2025 SET name = $1 WHERE id = $2 AND organization = $3 AND soft_delete is false`,
      [params.name, params.promptId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    return ok(null);
  }

  async updatePromptTags(params: {
    promptId: string;
    tags: string[];
  }): Promise<Result<string[], string>> {
    const sanitizedTags = Array.from(
      new Set(
        (params.tags ?? [])
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      )
    );

    const result = await dbExecute<{ tags: string[] }>(
      `UPDATE prompts_2025 
       SET tags = $1 
       WHERE id = $2 AND organization = $3 AND soft_delete is false
       RETURNING tags`,
      [sanitizedTags, params.promptId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    if (!result.data?.[0]) {
      return err("Prompt not found");
    }

    return ok(result.data[0].tags ?? []);
  }

  async getPrompts(params: {
    search: string;
    tagsFilter: string[];
    page: number;
    pageSize: number;
  }): Promise<Result<Prompt2025[], string>> {
    const tagsFilterClause = params.tagsFilter.length > 0 ? `AND tags && $3::text[]` : "";
    const result = await dbExecute<Prompt2025>(
      `
      SELECT
        id,
        name,
        tags,
        created_at
      FROM prompts_2025
      WHERE name ILIKE $1 AND organization = $2 AND soft_delete is false
      ${tagsFilterClause}
      ORDER BY created_at DESC
      LIMIT $4 OFFSET $5
    `,
      [
        `%${params.search}%`,
        this.authParams.organizationId,
        params.tagsFilter,
        params.pageSize,
        params.page * params.pageSize
      ]
    );

    if (result.error) {
      return err(result.error);
    }

    return ok(result.data ?? []);
  }

  async getPromptInputs(params: {
    promptId: string;
    versionId: string;
    requestId: string;
  }): Promise<Result<Prompt2025Input | null, string>> {
    const existsResult = await dbExecute<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM prompts_2025_versions 
        WHERE prompt_id = $1 AND id = $2 AND organization = $3 AND soft_delete is false
      )`,
      [params.promptId, params.versionId, this.authParams.organizationId]
    );

    if (existsResult.error) {
      return err(existsResult.error);
    }

    if (!existsResult.data?.[0]?.exists) {
      return err("Prompt version not found");
    }

    const result = await dbExecute<Prompt2025Input>(
      `SELECT 
        request_id,
        version_id,
        inputs,
        environment
      FROM prompts_2025_inputs
      WHERE version_id = $1 AND request_id = $2
      LIMIT 1
      `,
      [params.versionId, params.requestId]
    );

    if (result.error) {
      return err(result.error);
    }

    return ok(result.data?.[0] ?? null);
  }


  async getPromptVersionCounts(params: {
    promptId: string;
  }): Promise<Result<PromptVersionCounts, string>> {
    const result = await dbExecute<{ total_versions: number, major_versions: number }>(
      `SELECT
        COUNT(*)::integer as total_versions,
        MAX(major_version) as major_versions
      FROM prompts_2025_versions
      WHERE prompt_id = $1 AND organization = $2 AND soft_delete is false
      `,
      [params.promptId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    return ok({
      totalVersions: result.data?.[0]?.total_versions ?? 0,
      majorVersions: result.data?.[0]?.major_versions ?? 0,
    });
  }

  async getPromptProductionVersion(params: {
    promptId: string;
  }): Promise<Result<Prompt2025Version, string>> {
    const result = await dbExecute<Prompt2025Version>(
      `
      SELECT
        versions.id,
        versions.prompt_id,
        versions.major_version,
        versions.minor_version,
        versions.commit_message,
        versions.created_at,
        versions.model,
        versions.environments
      FROM prompts_2025 AS prompts
      INNER JOIN prompts_2025_versions AS versions
      ON prompts.production_version = versions.id
      WHERE prompts.id = $1 AND prompts.organization = $2 AND prompts.soft_delete is false AND versions.soft_delete is false
      `,
      [params.promptId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    if (!result.data?.[0]) {
      return err("Prompt production version not found");
    }

    const promptVersion = result.data[0];

    const s3UrlResult = await this.getPromptVersionS3Url(promptVersion.prompt_id, promptVersion.id);
    if (s3UrlResult.error) {
      return err(s3UrlResult.error);
    }
    promptVersion.s3_url = s3UrlResult.data ?? undefined;

    return ok(promptVersion);
  }

  async getPromptVersions(params: {
    promptId: string;
    majorVersion?: number;
  }): Promise<Result<Prompt2025Version[], string>> {
    const result = await dbExecute<Prompt2025Version>(
      `
      SELECT
        id,
        prompt_id,
        major_version,
        minor_version,
        commit_message,
        created_at,
        model,
        environments
      FROM prompts_2025_versions
      WHERE prompt_id = $1
      AND organization = $2 AND soft_delete is false
      ${params.majorVersion !== undefined ? `AND major_version = $3` : ''}
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [params.promptId, this.authParams.organizationId, params.majorVersion]
    );

    if (result.error) {
      return err(result.error);
    }

    return ok(result.data ?? []);
  }

  async getPromptVersionWithBodyByEnvironment(params: {
    promptId: string;
    environment: string;
  }): Promise<Result<Prompt2025Version, string>> {
    const result = await dbExecute<Prompt2025Version>(
      `
      SELECT
        id,
        prompt_id,
        major_version,
        minor_version,
        commit_message,
        created_at,
        model,
        environments
      FROM prompts_2025_versions
      WHERE prompt_id = $1 AND environments @> ARRAY[$2]::text[] AND organization = $3 AND soft_delete is false
      LIMIT 1
      `,
      [params.promptId, params.environment, this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    if (!result.data?.[0]) {
      return err("Prompt version not found");
    }

    const promptVersion = result.data[0];

    const s3UrlResult = await this.getPromptVersionS3Url(promptVersion.prompt_id, promptVersion.id);
    if (s3UrlResult.error) {
      return err(s3UrlResult.error);
    }
    promptVersion.s3_url = s3UrlResult.data ?? undefined;

    return ok(promptVersion);
  }

  async getPromptVersionWithBody(params: {
    promptVersionId: string;
  }): Promise<Result<Prompt2025Version, string>> {
    const result = await dbExecute<Prompt2025Version>(
      `
      SELECT
        id,
        prompt_id,
        major_version,
        minor_version,
        commit_message,
        created_at,
        model,
        environments
      FROM prompts_2025_versions
      WHERE id = $1
      AND organization = $2 AND soft_delete is false
      LIMIT 1
      `,
      [params.promptVersionId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    if (!result.data?.[0]) {
      return err("Prompt version not found");
    }

    const promptVersion = result.data[0];

    const s3UrlResult = await this.getPromptVersionS3Url(promptVersion.prompt_id, promptVersion.id);
    if (s3UrlResult.error) {
      return err(s3UrlResult.error);
    }
    promptVersion.s3_url = s3UrlResult.data ?? undefined;

    return ok(promptVersion);
  }

  async createPrompt(params: {
    name: string,
    tags: string[],
    promptBody: OpenAIChatRequest,
  }): Promise<Result<PromptCreateResponse, string>> {
    // Create prompt
    let attempts = 0;
    let insertPromptResult = null;

    while (attempts < MAX_PROMPT_ID_GENERATION_ATTEMPTS) {
      const promptId = this.generateRandomPromptId();
      try {
        insertPromptResult = await dbExecute<{ id: string }>(
          `
        INSERT INTO prompts_2025 (id, name, tags, created_at, organization)
        VALUES ($1, $2, $3, NOW(), $4)
        RETURNING id
          `, [
          promptId,
          params.name,
          params.tags,
          this.authParams.organizationId,
        ]
        );
        break;
      } catch (error: any) {
        if (error.code === '23505') {
          attempts++;
          continue;
        }
        return err(error);
      }
    }

    if (insertPromptResult?.error) {
      return err(insertPromptResult.error);
    }

    const promptId = insertPromptResult?.data?.[0]?.id ?? '';


    const insertPromptVersionResult = await dbExecute<{ id: string }>(
      `
      INSERT INTO prompts_2025_versions (
        created_at,
        prompt_id,
        major_version,
        minor_version,
        commit_message,
        created_by,
        organization,
        model
      )
      VALUES (NOW(), $1, 0, 0, 'First version.', $2, $3, $4)
      RETURNING id
      `, [
      promptId,
      this.authParams.userId,
      this.authParams.organizationId,
      params.promptBody.model,
    ]
    )

    if (insertPromptVersionResult?.error) {
      return err(insertPromptVersionResult.error);
    }

    const promptVersionId = insertPromptVersionResult?.data?.[0]?.id ?? '';

    const updateProductionVersionResult = await this.setPromptVersionEnvironment({
      promptId,
      promptVersionId,
      environment: PRODUCTION_ENVIRONMENT,
    });
    if (updateProductionVersionResult?.error) {
      return err(updateProductionVersionResult.error);
    }

    const s3Result = await this.storePromptBody(promptId, promptVersionId, params.promptBody);
    if (s3Result.error) {
      return err(s3Result.error);
    }

    return ok({ id: promptId, versionId: promptVersionId });
  }

  async newPromptVersion(params: {
    promptId: string;
    promptVersionId: string;
    newMajorVersion: boolean;
    environment?: string;
    commitMessage: string;
    promptBody: OpenAIChatRequest;
  }): Promise<Result<{ id: string }, string>> {
    const currentVersionInfo = await dbExecute<{
      major_version: number;
      minor_version: number;
      prompt_id: string;
    }>(
      `SELECT major_version, minor_version, prompt_id 
      FROM prompts_2025_versions 
      WHERE id = $1 AND organization = $2 AND soft_delete is false`,
      [params.promptVersionId, this.authParams.organizationId]
    );

    if (currentVersionInfo.error || !currentVersionInfo.data?.[0]) {
      return err(currentVersionInfo.error || "Current version not found");
    }

    const current = currentVersionInfo.data[0];
    let nextMajor: number;
    let nextMinor: number;

    if (params.newMajorVersion) {
      const maxMajorResult = await dbExecute<{ next_major: number }>(
        `SELECT COALESCE(MAX(major_version), 0) + 1 as next_major 
        FROM prompts_2025_versions 
        WHERE prompt_id = $1 AND organization = $2 AND soft_delete is false`,
        [params.promptId, this.authParams.organizationId]
      );

      if (maxMajorResult.error || !maxMajorResult.data?.[0]) {
        return err(maxMajorResult.error || "Failed to calculate next major version");
      }

      nextMajor = maxMajorResult.data[0].next_major;
      nextMinor = 0;
    } else {
      const maxMinorResult = await dbExecute<{ next_minor: number }>(
        `SELECT COALESCE(MAX(minor_version), 0) + 1 as next_minor 
        FROM prompts_2025_versions 
        WHERE prompt_id = $1 AND major_version = $2 AND organization = $3 AND soft_delete is false`,
        [params.promptId, current.major_version, this.authParams.organizationId]
      );

      if (maxMinorResult.error || !maxMinorResult.data?.[0]) {
        return err(maxMinorResult.error || "Failed to calculate next minor version");
      }

      nextMajor = current.major_version;
      nextMinor = maxMinorResult.data[0].next_minor;
    }

    const insertPromptVersionResult = await dbExecute<{ id: string }>(
      `
      INSERT INTO prompts_2025_versions (
        created_at,
        prompt_id,
        major_version,
        minor_version,
        commit_message,
        created_by,
        organization,
        model
      )
      VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `, [
      params.promptId,
      nextMajor,
      nextMinor,
      params.commitMessage,
      this.authParams.userId,
      this.authParams.organizationId,
      params.promptBody.model,
    ]
    )

    if (insertPromptVersionResult?.error) {
      return err(insertPromptVersionResult.error);
    }

    const promptVersionId = insertPromptVersionResult?.data?.[0]?.id ?? '';

    if (params.environment) {
      const updateEnvironmentVersionResult = await this.setPromptVersionEnvironment({
        promptId: params.promptId,
        promptVersionId,
        environment: params.environment,
      });
      if (updateEnvironmentVersionResult?.error) {
        return err(updateEnvironmentVersionResult.error);
      }
    }

    const s3Result = await this.storePromptBody(params.promptId, promptVersionId, params.promptBody);
    if (s3Result.error) {
      return err(s3Result.error);
    }

    return ok({ id: promptVersionId });
  }

  async setPromptVersionEnvironment(params: {
    promptId: string;
    promptVersionId: string;
    environment: string;
  }): Promise<Result<null, string>> {
    try {
      await HELICONE_DB.tx(async (t) => {
        // Check version exists and belongs to this prompt/org
        const versionCheck = await t.oneOrNone<{ id: string }>(
          `SELECT id FROM prompts_2025_versions
           WHERE id = $1 AND prompt_id = $2 AND organization = $3 AND soft_delete = false`,
          [params.promptVersionId, params.promptId, this.authParams.organizationId]
        );

        if (!versionCheck) {
          throw new Error("Prompt version not found or does not belong to the specified prompt");
        }

        // Update production version ref
        if (params.environment === PRODUCTION_ENVIRONMENT) {
          await t.none(
            `UPDATE prompts_2025 SET production_version = $1 WHERE id = $2 AND organization = $3 AND soft_delete = false`,
            [params.promptVersionId, params.promptId, this.authParams.organizationId]
          );
        }

        // Remove this environment from all other versions of this prompt
        await t.none(
          `UPDATE prompts_2025_versions
           SET environments = array_remove(COALESCE(environments, ARRAY[]::text[]), $3)
           WHERE prompt_id = $1 AND organization = $2 AND soft_delete = false`,
          [params.promptId, this.authParams.organizationId, params.environment]
        );

        // Add the environment to the target version
        await t.none(
          `UPDATE prompts_2025_versions
           SET environments = array_append(COALESCE(environments, ARRAY[]::text[]), $3)
           WHERE id = $4 AND prompt_id = $1 AND organization = $2 AND soft_delete = false
           AND NOT (COALESCE(environments, ARRAY[]::text[]) @> ARRAY[$3]::text[])`,
          [params.promptId, this.authParams.organizationId, params.environment, params.promptVersionId]
        );
      });

      await this.resetPromptCache({
        promptId: params.promptId,
        environment: params.environment,
      });

      return ok(null);
    } catch (error: any) {
      return err(error.message || "Failed to set environment on version");
    }
  }

  async removeEnvironmentFromVersion(params: {
    promptId: string;
    promptVersionId: string;
    environment: string;
  }): Promise<Result<null, string>> {
    try {
      await HELICONE_DB.tx(async (t) => {
        // Check version exists
        const versionCheck = await t.oneOrNone<{ id: string }>(
          `SELECT id FROM prompts_2025_versions
           WHERE id = $1 AND prompt_id = $2 AND organization = $3 AND soft_delete = false`,
          [params.promptVersionId, params.promptId, this.authParams.organizationId]
        );

        if (!versionCheck) {
          throw new Error("Prompt version not found or does not belong to the specified prompt");
        }

        // Remove environment from array
        await t.none(
          `UPDATE prompts_2025_versions
           SET environments = array_remove(COALESCE(environments, ARRAY[]::text[]), $3)
           WHERE id = $4 AND prompt_id = $1 AND organization = $2 AND soft_delete = false`,
          [params.promptId, this.authParams.organizationId, params.environment, params.promptVersionId]
        );

        // Clear production_version ref if removing production
        if (params.environment === PRODUCTION_ENVIRONMENT) {
          await t.none(
            `UPDATE prompts_2025 SET production_version = NULL
             WHERE id = $1 AND production_version = $2 AND organization = $3 AND soft_delete = false`,
            [params.promptId, params.promptVersionId, this.authParams.organizationId]
          );
        }
      });

      await this.resetPromptCache({
        promptId: params.promptId,
        environment: params.environment,
      });

      return ok(null);
    } catch (error: any) {
      return err(error.message || "Failed to remove environment from version");
    }
  }

  async deletePrompt(params: {
    promptId: string;
  }): Promise<Result<null, string>> {
    const versionsResult = await dbExecute<{ id: string }>(
      `SELECT id FROM prompts_2025_versions WHERE prompt_id = $1 AND organization = $2 AND soft_delete is false`,
      [params.promptId, this.authParams.organizationId]
    );

    if (versionsResult.error) {
      return err(versionsResult.error);
    }

    const versionIds = versionsResult.data || [];
    for (const version of versionIds) {
      const s3Result = await this.deletePromptBody(params.promptId, version.id);
      if (s3Result.error) {
        console.error(`Failed to delete S3 object for version ${version.id}:`, s3Result.error);
        // continue with other deletions even if one fails
      }
    }

    // this will happen on cascade anyways when we delete the source prompt.
    const versionResult = await dbExecute<null>(
      `UPDATE prompts_2025_versions SET soft_delete = true WHERE prompt_id = $1 AND organization = $2`,
      [params.promptId, this.authParams.organizationId]
    );

    if (versionResult.error) {
      return err(versionResult.error);
    }

    const result = await dbExecute<null>(
      `UPDATE prompts_2025 SET soft_delete = true WHERE id = $1 AND organization = $2`,
      [params.promptId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    // remove prod cache
    await this.resetPromptCache({
      promptId: params.promptId,
    });

    return ok(null);
  }

  async deletePromptVersion(params: {
    promptId: string;
    promptVersionId: string;
  }): Promise<Result<null, string>> {
    const result = await dbExecute<null>(
      `UPDATE prompts_2025_versions SET soft_delete = true WHERE id = $1 AND organization = $2`,
      [params.promptVersionId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    const s3Result = await this.deletePromptBody(params.promptId, params.promptVersionId);
    if (s3Result.error) {
      return err(s3Result.error);
    }

    await this.resetPromptCache({
      promptId: params.promptId,
      versionId: params.promptVersionId
    });

    return ok(null);
  }

  // Unsure about typing of the data, should double check this when writing using code.
  // Unsure if we use every field in CompletionCreateParams.
  private async storePromptBody(
    promptId: string,
    promptVersionId: string,
    promptBody: OpenAIChatRequest
  ): Promise<Result<null, string>> {
    if (!promptId) return err("Prompt ID is required");
    const key = this.s3Client.getPromptKey(promptId, promptVersionId, this.authParams.organizationId);

    const s3result = await this.s3Client.store(key, JSON.stringify(promptBody));
    if (s3result.error) return err(s3result.error);

    return ok(null);
  }

  private async deletePromptBody(
    promptId: string,
    promptVersionId: string
  ): Promise<Result<null, string>> {
    const key = this.s3Client.getPromptKey(promptId, promptVersionId, this.authParams.organizationId);

    const s3Result = await this.s3Client.remove(key);
    if (s3Result.error) return err(s3Result.error);
    return ok(null);
  }

  private async getPromptVersionS3Url(promptId: string, promptVersionId: string): Promise<Result<string, string>> {
    const key = this.s3Client.getPromptKey(promptId, promptVersionId, this.authParams.organizationId);
    const s3Result = await this.s3Client.getSignedUrl(key);
    if (s3Result.error) return err(s3Result.error);
    return ok(s3Result.data ?? '');
  }

  // TODO: add other methods for deletion, etc.
  // TODO: Add query methods for getting prompts and metrics from Postgres, Clickhouse.
}

// DEPRECATED
// TODO: Remove this once Prompt2025Manager and new prompt system is live
export class PromptManager extends BaseManager {
  async getOrCreatePromptVersionFromRequest(
    requestId: string
  ): Promise<Result<string, string>> {
    const requestManager = new RequestManager(this.authParams);
    const requestResult = await requestManager.uncachedGetRequestByIdWithBody(
      requestId
    );
    if (requestResult.error || !requestResult.data) {
      return err(requestResult.error);
    }

    const promptVersionResult = await this.getPromptVersionFromRequest(
      requestId
    );
    if (promptVersionResult.data) {
      return ok(promptVersionResult.data);
    }
    const prompt = await this.createPrompt({
      metadata: {
        promptFromRequest: true,
      },
      prompt: requestResult.data.request_body,
      userDefinedId: `prompt-from-request-${requestId}-${Date.now()}`,
      createdAt: requestResult.data.request_created_at ?? undefined,
    });

    if (prompt.error || !prompt.data) {
      return err(prompt.error);
    }

    return ok(prompt.data.prompt_version_id);
  }

  private async getPromptVersionFromRequest(
    requestId: string
  ): Promise<Result<string, string>> {
    try {
      const result = await dbExecute<{ prompt_version: string }>(
        `SELECT prompt_version
         FROM prompt_input_record
         WHERE source_request = $1
         LIMIT 1`,
        [requestId]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err("Failed to get prompt version from request");
      }

      return ok(result.data[0].prompt_version);
    } catch (error) {
      return err(`Error retrieving prompt version: ${error}`);
    }
  }
  async createNewPromptVersion(
    parentPromptVersionId: string,
    params: PromptCreateSubversionParams
  ): Promise<Result<PromptVersionResult, string>> {
    if (JSON.stringify(params.newHeliconeTemplate).length > 1_000_000_000) {
      return err("Helicone template too large");
    }

    const isMajorVersion = params.isMajorVersion || false;

    const metadata = {
      ...params.metadata,
      isProduction: false, // Set isProduction to false for new versions
    };

    let model = "";
    try {
      const templateObj =
        typeof params.newHeliconeTemplate === "string"
          ? JSON.parse(params.newHeliconeTemplate)
          : params.newHeliconeTemplate;

      model =
        templateObj.model ||
        templateObj.messages?.[0]?.model ||
        (Array.isArray(templateObj) ? templateObj[0]?.model : "") ||
        "";

      if (!model) {
        console.warn("No model found in template:", templateObj);
      }
    } catch (error) {
      console.error("Error parsing or extracting model from template:", error);
      console.error("Template:", params.newHeliconeTemplate);
    }

    const result = await dbExecute<{
      id: string;
      minor_version: number;
      major_version: number;
      helicone_template: string;
      prompt_v2: string;
      model: string;
      created_at: string;
      metadata: Record<string, any>;
      experiment_id: string | null;
    }>(
      `
    WITH parent_prompt_version AS (
      SELECT * FROM prompts_versions WHERE id = $1
    ),
    bump_version AS (
      SELECT major_version, minor_version 
      FROM prompts_versions 
      WHERE id = $8
    )
    INSERT INTO prompts_versions (prompt_v2, helicone_template, model, organization, major_version, minor_version, metadata, experiment_id, parent_prompt_version, updated_at)
    SELECT
        ppv.prompt_v2,
        $2, 
        $3,
        $4,
        CASE 
          WHEN $8 IS NOT NULL AND $8 != ppv.id THEN (SELECT major_version FROM bump_version)
          WHEN $5 THEN ppv.major_version + 1 
          ELSE ppv.major_version 
        END,
        CASE 
          WHEN $8 IS NOT NULL AND $8 != ppv.id THEN (
            SELECT minor_version + 1
            FROM prompts_versions pv1
            WHERE pv1.major_version = (SELECT major_version FROM bump_version)
            AND pv1.prompt_v2 = ppv.prompt_v2
            ORDER BY pv1.major_version DESC, pv1.minor_version DESC
            LIMIT 1
          )
          WHEN $5 THEN 0
          ELSE (
            SELECT minor_version + 1
            FROM prompts_versions pv1
            WHERE pv1.major_version = ppv.major_version
            AND pv1.prompt_v2 = ppv.prompt_v2
            ORDER BY pv1.major_version DESC, pv1.minor_version DESC
            LIMIT 1
          )
        END,
        $6::jsonb,
        $7::uuid,
        ppv.id,
        CASE 
          WHEN $7::uuid IS NOT NULL THEN ppv.created_at
          ELSE NOW()
        END
    FROM parent_prompt_version ppv
    RETURNING 
        id,
        minor_version,
        major_version,
        helicone_template,
        prompt_v2,
        model,
        metadata,
        experiment_id;
    `,
      [
        parentPromptVersionId,
        params.newHeliconeTemplate,
        model,
        this.authParams.organizationId,
        isMajorVersion,
        metadata,
        params.experimentId || null,
        params.bumpForMajorPromptVersionId || null,
      ]
    );

    return resultMap(result, (data) => data[0]);
  }

  async editPromptVersionTemplate(
    promptVersionId: string,
    params: PromptEditSubversionTemplateParams
  ): Promise<Result<null, string>> {
    if (
      params.heliconeTemplate &&
      JSON.stringify(params.heliconeTemplate).length > 1_000_000_000
    ) {
      return err("Helicone template too large");
    }

    const result = await dbExecute<PromptVersionResult>(
      `
    UPDATE prompts_versions
    SET helicone_template = $1,
    updated_at = now()
    WHERE id = $2 AND organization = $3
    `,
      [params.heliconeTemplate, promptVersionId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(result.error);
    }

    if (params.experimentId) {
      const newPromptVersionInputKeys = Array.from(
        (typeof params.heliconeTemplate === "string"
          ? params.heliconeTemplate
          : JSON.stringify(params.heliconeTemplate)
        ).matchAll(/<helicone-prompt-input key=\\"(\w+)\\" \/>/g)
      ).map((match) => match[1]);

      // Get existing input keys for experiment
      const existingKeysResult = await dbExecute<{ input_keys: string[] }>(
        `SELECT input_keys
         FROM experiment_v3
         WHERE id = $1
         LIMIT 1`,
        [params.experimentId]
      );

      const existingInputKeys = existingKeysResult.data?.[0]?.input_keys ?? [];

      // Update experiment input keys
      const res = await Promise.all([
        dbExecute(
          `UPDATE experiment_v3
           SET input_keys = $1
           WHERE organization = $2
           AND id = $3`,
          [
            [...new Set([...existingInputKeys, ...newPromptVersionInputKeys])],
            this.authParams.organizationId,
            params.experimentId,
          ]
        ),
        dbExecute(
          `INSERT INTO prompt_input_keys (key, prompt_version)
           SELECT unnest($1::text[]), $2
           ON CONFLICT (key, prompt_version) DO NOTHING`,
          [`{${newPromptVersionInputKeys.join(",")}}`, promptVersionId]
        ),
      ]);

      if (res.some((r) => r.error)) {
        return err("Failed to update experiment input keys");
      }

      return ok(null);
    }

    return ok(null);
  }

  async editPromptVersionLabel(
    promptVersionId: string,
    params: PromptEditSubversionLabelParams
  ): Promise<Result<{ metadata: Record<string, any> }, string>> {
    if (params.label.length > 100) {
      return err("Label too long");
    }

    if (params.label.length === 0) {
      return err("Label cannot be empty");
    }

    const result = await dbExecute<{
      metadata: Record<string, any>;
    }>(
      `
    UPDATE prompts_versions
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{label}',
      to_jsonb($1::text)
    )
    WHERE id = $2 AND organization = $3
    RETURNING 
      metadata
    `,
      [params.label, promptVersionId, this.authParams.organizationId]
    );

    return resultMap(result, (data) => data[0]);
  }

  async promotePromptVersionToProduction(
    promptVersionId: string,
    previousProductionVersionId: string
  ): Promise<Result<PromptVersionResult, string>> {
    const removeProductionFlagFromPreviousVersion = await dbExecute(
      `
    UPDATE prompts_versions
    SET metadata = COALESCE(metadata, '{}'::jsonb) - 'isProduction'
    WHERE id = $1 AND organization = $2
    `,
      [previousProductionVersionId, this.authParams.organizationId]
    );

    if (removeProductionFlagFromPreviousVersion.error) {
      return err(
        `Failed to remove production flag from previous version: ${removeProductionFlagFromPreviousVersion.error}`
      );
    }

    const result = await dbExecute<PromptVersionResult>(
      `
    UPDATE prompts_versions
    SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"isProduction": true}'::jsonb
    WHERE id = $1 AND organization = $2
    RETURNING 
      id,
      minor_version,
      major_version,
      helicone_template,
      prompt_v2,
      model,
      created_at,
      metadata
    `,
      [promptVersionId, this.authParams.organizationId]
    );

    if (result.error || !result.data || result.data.length === 0) {
      return err(`Failed to promote prompt version: ${result.error}`);
    }

    return ok(result.data[0]);
  }

  async deletePromptVersion(
    promptVersionId: string
  ): Promise<Result<null, string>> {
    const promptVersion = await this.getPromptVersion({
      promptVersionId,
    });

    if (
      promptVersion.error ||
      !promptVersion.data ||
      promptVersion.data.length === 0
    ) {
      return err(`Failed to get prompt version: ${promptVersion.error}`);
    }

    if (
      promptVersion.data[0].metadata &&
      promptVersion.data[0].metadata.isProduction
    ) {
      return err("Cannot delete production version");
    }

    const result = await dbExecute(
      `
    UPDATE prompts_versions
    SET soft_delete = true
    WHERE id = $1 AND organization = $2
    `,
      [promptVersionId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(`Failed to delete prompt version: ${result.error}`);
    }

    return ok(null);
  }

  async removePromptVersionFromExperiment(
    promptVersionId: string,
    experimentId: string
  ): Promise<Result<null, string>> {
    const promptVersion = await this.getPromptVersion({
      promptVersionId,
    });

    if (
      promptVersion.error ||
      !promptVersion.data ||
      promptVersion.data.length === 0
    ) {
      return err(`Failed to get prompt version: ${promptVersion.error}`);
    }

    const result = await dbExecute(
      `
    UPDATE prompts_versions
    SET experiment_id = null
    WHERE id = $1 AND organization = $2 AND experiment_id = $3
    `,
      [promptVersionId, this.authParams.organizationId, experimentId]
    );

    if (result.error) {
      return err(`Failed to delete prompt version: ${result.error}`);
    }

    return ok(null);
  }

  async getPromptVersions(
    filter: FilterNode,
    includeExperimentVersions: boolean = false
  ): Promise<Result<PromptVersionResult[], string>> {
    const filterWithAuth = buildFilterPostgres({
      filter,
      argsAcc: [this.authParams.organizationId],
    });

    const result = dbExecute<{
      id: string;
      minor_version: number;
      major_version: number;
      helicone_template: string;
      prompt_v2: string;
      model: string;
      created_at: string;
      metadata: Record<string, any>;
      experiment_id?: string | null;
      parent_prompt_version?: string | null;
      updated_at: string;
    }>(
      `
    SELECT 
      prompts_versions.id,
      minor_version,
      major_version,
      helicone_template,
      prompt_v2,
      model,
      prompts_versions.created_at,
      prompts_versions.metadata,
      prompts_versions.experiment_id,
      prompts_versions.parent_prompt_version,
      prompts_versions.updated_at
    FROM prompts_versions
    left join prompt_v2 on prompt_v2.id = prompts_versions.prompt_v2
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    AND prompts_versions.soft_delete = false
    AND (${filterWithAuth.filter})
    ${includeExperimentVersions
        ? ""
        : `AND (
              prompts_versions.metadata->>'experimentAssigned' IS NULL
              OR prompts_versions.metadata->>'experimentAssigned' != 'true'
            )`
      }
    `,
      filterWithAuth.argsAcc
    );

    return result;
  }

  async getCompiledPromptVersions(
    filter: FilterNode,
    inputs: Record<string, string>
  ): Promise<Result<PromptVersionResultCompiled, string>> {
    const filterWithAuth = buildFilterPostgres({
      filter,
      argsAcc: [this.authParams.organizationId],
    });

    const result = await dbExecute<{
      id: string;
      minor_version: number;
      major_version: number;
      helicone_template: string;
      prompt_v2: string;
      model: string;
      auto_prompt_inputs: any;
    }>(
      `
    SELECT 
      prompts_versions.id,
      minor_version,
      major_version,
      helicone_template,
      prompt_v2,
      model,
      prompt_input_record.auto_prompt_inputs
    FROM prompts_versions
    left join prompt_v2 on prompt_v2.id = prompts_versions.prompt_v2
    left join prompt_input_record on prompt_input_record.prompt_version = prompts_versions.id
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    AND (prompts_versions.metadata->>'isProduction')::boolean = true
    AND (${filterWithAuth.filter})
    `,
      filterWithAuth.argsAcc
    );

    if (result.error || !result.data || result.data.length === 0) {
      return err(result.error || "Failed to get compiled prompt versions");
    }

    const lastVersion = result.data[result.data.length - 1];

    return ok({
      id: lastVersion.id,
      minor_version: lastVersion.minor_version,
      major_version: lastVersion.major_version,
      prompt_v2: lastVersion.prompt_v2,
      model: lastVersion.model,
      prompt_compiled: autoFillInputs({
        inputs: inputs,
        autoInputs: lastVersion.auto_prompt_inputs,
        template: lastVersion.helicone_template,
      }),
    });
  }

  async getPormptVersionsTemplates(
    filter: FilterNode,
    inputs: Record<string, string>
  ): Promise<Result<PromptVersionResultFilled, string>> {
    const filterWithAuth = buildFilterPostgres({
      filter,
      argsAcc: [this.authParams.organizationId],
    });

    const result = await dbExecute<{
      id: string;
      minor_version: number;
      major_version: number;
      helicone_template: string;
      prompt_v2: string;
      model: string;
      auto_prompt_inputs: any;
    }>(
      `
    SELECT 
      prompts_versions.id,
      minor_version,
      major_version,
      helicone_template,
      prompt_v2,
      model,
      prompt_input_record.auto_prompt_inputs,
      prompt_input_record.inputs
    FROM prompts_versions
    left join prompt_v2 on prompt_v2.id = prompts_versions.prompt_v2
    left join prompt_input_record on prompt_input_record.prompt_version = prompts_versions.id
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    AND (prompts_versions.metadata->>'isProduction')::boolean = true
    AND (${filterWithAuth.filter})
    `,
      filterWithAuth.argsAcc
    );

    if (result.error || !result.data || result.data.length === 0) {
      return err("Failed to get compiled prompt versions");
    }

    const lastVersion = result.data[result.data.length - 1];
    const filledTemplate = autoFillInputs({
      inputs: inputs,
      autoInputs: lastVersion.auto_prompt_inputs ?? [],
      template: lastVersion.helicone_template,
    });

    return ok({
      id: lastVersion.id,
      minor_version: lastVersion.minor_version,
      major_version: lastVersion.major_version,
      prompt_v2: lastVersion.prompt_v2,
      model: lastVersion.model,
      filled_helicone_template: filledTemplate,
    });
  }

  async getPrompts(
    params: PromptsQueryParams
  ): Promise<Result<PromptsResult[], string>> {
    const filterWithAuth = buildFilterPostgres({
      filter: params.filter,
      argsAcc: [this.authParams.organizationId],
    });

    filterWithAuth.argsAcc;
    const result = dbExecute<{
      id: string;
      user_defined_id: string;
      description: string;
      pretty_name: string;
      created_at: string;
      major_version: number;
      metadata: Record<string, any>;
    }>(
      `
    SELECT 
      id,
      user_defined_id,
      description,
      pretty_name,
      prompt_v2.created_at,
      (SELECT major_version FROM prompts_versions pv WHERE pv.prompt_v2 = prompt_v2.id ORDER BY major_version DESC LIMIT 1) as major_version,
      metadata
    FROM prompt_v2
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    AND (${filterWithAuth.filter})
    AND (prompt_v2.metadata->>'promptFromRequest' != 'true' OR prompt_v2.metadata->>'promptFromRequest' IS NULL)
    AND (prompt_v2.metadata->>'emptyPrompt' != 'true' OR prompt_v2.metadata->>'emptyPrompt' IS NULL)
    ORDER BY created_at DESC
    `,
      filterWithAuth.argsAcc
    );
    return result;
  }

  async getPrompt(
    params: PromptQueryParams,
    promptId: string
  ): Promise<Result<PromptResult, string>> {
    const result = await dbExecute<{
      id: string;
      user_defined_id: string;
      description: string;
      pretty_name: string;
      major_version: number;
      latest_version_id: string;
      latest_model_used: string;
      created_at: string;
      last_used: string;
      versions: string[];
      metadata: Record<string, any>;
    }>(
      `
    SELECT 
      prompt_v2.id,
      prompt_v2.user_defined_id,
      prompt_v2.description,
      prompt_v2.pretty_name,
      prompts_versions.major_version,
      prompts_versions.id as latest_version_id,
      prompts_versions.model as latest_model_used,
      prompt_v2.created_at as created_at,
      (SELECT created_at FROM prompt_input_record WHERE prompt_version = prompts_versions.id ORDER BY created_at DESC LIMIT 1) as last_used,
      (
        SELECT array_agg(pv2.versions) as versions
        FROM 
        (
          SELECT prompts_versions.id as versions
          from prompts_versions
          WHERE prompts_versions.prompt_v2 = prompt_v2.id
          ORDER BY prompts_versions.major_version DESC, prompts_versions.minor_version DESC
          LIMIT 100
        ) as pv2
      ) as versions,
      prompt_v2.metadata
    FROM prompts_versions
    left join prompt_v2 on prompt_v2.id = prompts_versions.prompt_v2
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    AND prompt_v2.id = $2
    ORDER BY prompts_versions.major_version DESC, prompts_versions.minor_version DESC
    `,
      [this.authParams.organizationId, promptId]
    );

    return resultMap(result, (data) => data[0]);
  }

  async getPromptVersion(params: {
    promptVersionId: string;
  }): Promise<Result<PromptVersionResult[], string>> {
    const result = dbExecute<{
      id: string;
      minor_version: number;
      major_version: number;
      helicone_template: string;
      prompt_v2: string;
      model: string;
      created_at: string;
      metadata: Record<string, any>;
    }>(
      `
    SELECT 
      id,
      minor_version,
      major_version,
      helicone_template,
      prompt_v2,
      model,
      prompts_versions.created_at,
      metadata
    FROM prompts_versions
    WHERE prompts_versions.organization = $1
    AND prompts_versions.id = $2
    `,
      [this.authParams.organizationId, params.promptVersionId]
    );
    return result;
  }

  async createPrompt(params: {
    userDefinedId: string;
    prompt: {
      model: string;
      messages: any[];
    };
    metadata: Record<string, any>;
    createdAt?: string;
  }): Promise<Result<CreatePromptResponse, string>> {
    const existingPrompt = await dbExecute<{
      id: string;
    }>(
      `
    SELECT id FROM prompt_v2 WHERE user_defined_id = $1 AND organization = $2
    `,
      [params.userDefinedId, this.authParams.organizationId]
    );

    if (existingPrompt.data && existingPrompt.data.length > 0) {
      return err(`Prompt with name ${params.userDefinedId} already exists`);
    }

    const metadata = {
      ...params.metadata,
      createdFromUi: true,
    };

    const result = await dbExecute<{
      id: string;
    }>(
      `
    INSERT INTO prompt_v2 (organization, user_defined_id, metadata) 
    VALUES ($1, $2, $3) 
    RETURNING id
    `,
      [this.authParams.organizationId, params.userDefinedId, metadata]
    );

    if (result.error || !result.data) {
      return err(`Failed to create prompt: ${result.error}`);
    }

    const promptId = result.data[0].id;

    const insertVersionResult = await dbExecute<{
      id: string;
    }>(
      `
    INSERT INTO prompts_versions (prompt_v2, organization, major_version, minor_version, helicone_template, model, created_at, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()), '{"isProduction": true, "provider": "OPENAI"}'::jsonb)
    RETURNING id
    `,
      [
        promptId,
        this.authParams.organizationId,
        1, // Starting with major version 1
        0, // Starting with minor version 0
        JSON.stringify(params.prompt),
        params.prompt.model,
        params.createdAt,
      ]
    );

    if (insertVersionResult.error || !insertVersionResult.data) {
      return err(
        `Failed to create prompt version: ${insertVersionResult.error}`
      );
    }

    const createPromptInputKeysResult = await this.createPromptInputKeys(
      insertVersionResult.data[0].id,
      JSON.stringify(params.prompt)
    );

    if (createPromptInputKeysResult.error) {
      return err(
        `Failed to create prompt input keys: ${createPromptInputKeysResult.error}`
      );
    }

    return ok({
      id: promptId,
      prompt_version_id: insertVersionResult.data[0].id,
    });
  }

  async deletePrompt(params: {
    promptId: string;
  }): Promise<Result<null, string>> {
    const result = await dbExecute(
      `
    UPDATE prompt_v2
    SET 
    soft_delete = true,
    user_defined_id = user_defined_id || '_deleted_' || id
    WHERE id = $1
    AND organization = $2
    `,
      [params.promptId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(`Failed to delete prompt: ${result.error}`);
    }

    return ok(null);
  }

  async updatePromptUserDefinedId(
    promptId: string,
    newUserDefinedId: string
  ): Promise<Result<null, string>> {
    // First check if the new ID already exists
    const existingPrompt = await dbExecute<{
      id: string;
    }>(
      `
    SELECT id FROM prompt_v2 
    WHERE user_defined_id = $1 
    AND organization = $2
    AND soft_delete = false
    `,
      [newUserDefinedId, this.authParams.organizationId]
    );

    if (existingPrompt.data && existingPrompt.data.length > 0) {
      return err(`Prompt with name ${newUserDefinedId} already exists`);
    }

    // Update the prompt's user_defined_id
    const result = await dbExecute(
      `
    UPDATE prompt_v2
    SET user_defined_id = $1
    WHERE id = $2
    AND organization = $3
    AND soft_delete = false
    `,
      [newUserDefinedId, promptId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(`Failed to update prompt user_defined_id: ${result.error}`);
    }

    return ok(null);
  }

  public getHeliconeTemplateKeys(template: string | object): string[] {
    try {
      // Convert to string if it's an object
      const templateString =
        typeof template === "string"
          ? template
          : JSON.stringify(template, null, 2);

      // Helper function to find keys in a string
      const findKeys = (str: string): string[] => {
        const regex = /<helicone-prompt-input key=\\?"([^"]+)\\?"\s*\/>/g;
        const matches = str.match(regex);
        return matches
          ? matches.map((match) =>
            match
              .replace(
                /<helicone-prompt-input key=\\?"(.*?)\\?"\s*\/>/g,
                "$1"
              )
              .replace(/\\/g, "")
          )
          : [];
      };

      // For objects, we need to search through all nested properties
      if (typeof template === "object") {
        const keys: string[] = [];
        const searchObject = (obj: any) => {
          for (const value of Object.values(obj)) {
            if (typeof value === "string") {
              keys.push(...findKeys(value));
            } else if (Array.isArray(value)) {
              value.forEach((item) => {
                if (typeof item === "string") {
                  keys.push(...findKeys(item));
                } else if (typeof item === "object") {
                  searchObject(item);
                }
              });
            } else if (typeof value === "object" && value !== null) {
              searchObject(value);
            }
          }
        };
        searchObject(template);
        return [...new Set(keys)]; // Remove duplicates
      }

      // For strings, just search directly
      return findKeys(templateString);
    } catch (error) {
      // Log the error if needed
      console.error("Error in getHeliconeTemplateKeys:", error);
      return [];
    }
  }

  async createPromptInputKeys(
    promptVersionId: string,
    heliconeTemplate: string
  ): Promise<Result<null, string>> {
    const newPromptVersionInputKeys =
      this.getHeliconeTemplateKeys(heliconeTemplate);

    try {
      await dbExecute(
        `INSERT INTO prompt_input_keys (key, prompt_version)
       SELECT unnest($1::text[]), $2
       ON CONFLICT (key, prompt_version) DO NOTHING`,
        [`{${newPromptVersionInputKeys.join(",")}}`, promptVersionId]
      );

      return ok(null);
    } catch (error) {
      return err(`Failed to create prompt input keys: ${error}`);
    }
  }
}
