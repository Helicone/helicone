// src/users/usersService.ts
import {
  CreatePromptResponse,
  PromptCreateSubversionParams,
  PromptQueryParams,
  PromptResult,
  PromptVersionResult,
  PromptVersionResultCompiled,
  PromptVersionResultFilled,
  PromptsQueryParams,
  PromptsResult,
} from "../../controllers/public/promptController";
import { Result, err, ok } from "../../lib/shared/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { buildFilterPostgres } from "../../lib/shared/filters/filters";
import { resultMap } from "../../lib/shared/result";
import { User } from "../../models/user";
import { BaseManager } from "../BaseManager";
import { autoFillInputs } from "@helicone/prompts";

export class PromptManager extends BaseManager {
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
    };

    // Parse the newHeliconeTemplate to extract the model
    let model = "";
    try {
      const templateObj = JSON.parse(params.newHeliconeTemplate);
      model = templateObj.model || "";
    } catch (error) {
      console.error("Error parsing newHeliconeTemplate:", error);
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
    }>(
      `
    WITH parent_prompt_version AS (
      SELECT * FROM prompts_versions WHERE id = $1
    )
    INSERT INTO prompts_versions (prompt_v2, helicone_template, model, organization, major_version, minor_version, metadata)
    SELECT
        ppv.prompt_v2,
        $2, 
        $3,
        $4,
        CASE WHEN $5 THEN ppv.major_version + 1 ELSE ppv.major_version END,
        CASE 
          WHEN $5 THEN 0
          ELSE (SELECT minor_version + 1
                FROM prompts_versions pv1
                WHERE pv1.major_version = ppv.major_version
                AND pv1.prompt_v2 = ppv.prompt_v2
                ORDER BY pv1.major_version DESC, pv1.minor_version DESC
                LIMIT 1)
        END,
        $6
    FROM parent_prompt_version ppv
    RETURNING 
        id,
        minor_version,
        major_version,
        helicone_template,
        prompt_v2,
        model;
    
    `,
      [
        parentPromptVersionId,
        params.newHeliconeTemplate,
        model,
        this.authParams.organizationId,
        isMajorVersion, // New parameter for determining major/minor version
        metadata,
      ]
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

  async getPromptVersions(
    filter: FilterNode
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
      metadata
    FROM prompts_versions
    left join prompt_v2 on prompt_v2.id = prompts_versions.prompt_v2
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    AND prompts_versions.soft_delete = false
    AND (${filterWithAuth.filter})
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
      return err("Failed to get compiled prompt versions");
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
    const filledTemplate = this.fillTemplate(
      lastVersion.helicone_template,
      inputs
    );

    return ok({
      id: lastVersion.id,
      minor_version: lastVersion.minor_version,
      major_version: lastVersion.major_version,
      prompt_v2: lastVersion.prompt_v2,
      model: lastVersion.model,
      filled_helicone_template: filledTemplate,
    });
  }

  private fillTemplate(
    template: string | object,
    inputs: Record<string, string>
  ): string {
    let jsonTemplate: object;
    if (typeof template === "string") {
      try {
        jsonTemplate = JSON.parse(template);
      } catch (error) {
        console.error("Error parsing template:", error);
        return "";
      }
    } else {
      jsonTemplate = template;
    }

    const fillObject = (obj: any): any => {
      if (typeof obj === "string") {
        return obj.replace(
          /<helicone-prompt-input key="(\w+)" \/>/g,
          (match, key) => {
            const value = inputs[key] || "";
            return `<helicone-prompt-input key="${key}">${value}</helicone-prompt-input>`;
          }
        );
      }
      if (Array.isArray(obj)) {
        return obj.map(fillObject);
      }
      if (typeof obj === "object" && obj !== null) {
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          newObj[key] = fillObject(value);
        }
        return newObj;
      }
      return obj;
    };

    return fillObject(jsonTemplate);
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
    }>(
      `
    SELECT 
      id,
      user_defined_id,
      description,
      pretty_name,
      prompt_v2.created_at,
      (SELECT major_version FROM prompts_versions pv WHERE pv.prompt_v2 = prompt_v2.id ORDER BY major_version DESC LIMIT 1) as major_version
    FROM prompt_v2
    WHERE prompt_v2.organization = $1
    AND prompt_v2.soft_delete = false
    AND (${filterWithAuth.filter})
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
      ) as versions
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

    const result = await dbExecute<{
      id: string;
    }>(
      `
    INSERT INTO prompt_v2 (organization, user_defined_id) VALUES ($1, $2) RETURNING id
    `,
      [this.authParams.organizationId, params.userDefinedId]
    );

    if (result.error || !result.data) {
      return err(`Failed to create prompt: ${result.error}`);
    }

    const promptId = result.data[0].id;

    const metadata = {
      ...params.metadata,
      isProduction: true,
    };

    console.log("metadata", metadata);

    const insertVersionResult = await dbExecute<{
      id: string;
    }>(
      `
    INSERT INTO prompts_versions (prompt_v2, organization, major_version, minor_version, helicone_template, model, created_at, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
    RETURNING id
    `,
      [
        promptId,
        this.authParams.organizationId,
        1, // Starting with major version 1
        0, // Starting with minor version 0
        JSON.stringify(params.prompt),
        params.prompt.model,
        metadata,
      ]
    );

    if (insertVersionResult.error || !insertVersionResult.data) {
      return err(
        `Failed to create prompt version: ${insertVersionResult.error}`
      );
    }

    return ok({ id: promptId });
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
}
