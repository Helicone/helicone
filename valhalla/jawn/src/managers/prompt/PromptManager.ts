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
import { supabaseServer } from "../../lib/db/supabase";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { buildFilterPostgres } from "../../lib/shared/filters/filters";
import { Result, err, ok, resultMap } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";
import { RequestManager } from "../request/RequestManager";

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
    });

    if (prompt.error || !prompt.data) {
      return err(prompt.error);
    }

    return ok(prompt.data.prompt_version_id);
  }

  private async getPromptVersionFromRequest(
    requestId: string
  ): Promise<Result<string, string>> {
    const res = await supabaseServer.client
      .from("prompt_input_record")
      .select("*")
      .eq("source_request", requestId)
      .single();

    if (res.error || !res.data) {
      return err("Failed to get prompt version from request");
    }

    return ok(res.data.prompt_version);
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
    INSERT INTO prompts_versions (prompt_v2, helicone_template, model, organization, major_version, minor_version, metadata, experiment_id, parent_prompt_version)
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
        $6,
        $7,
        ppv.id
    FROM parent_prompt_version ppv
    RETURNING 
        id,
        minor_version,
        major_version,
        helicone_template,
        prompt_v2,
        model,
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
    ${
      includeExperimentVersions
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
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), '{"isProduction": true}'::jsonb)
    RETURNING id
    `,
      [
        promptId,
        this.authParams.organizationId,
        1, // Starting with major version 1
        0, // Starting with minor version 0
        JSON.stringify(params.prompt),
        params.prompt.model,
      ]
    );

    if (insertVersionResult.error || !insertVersionResult.data) {
      return err(
        `Failed to create prompt version: ${insertVersionResult.error}`
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

  public getHeliconeTemplateKeys(template: string | object): string[] {
    try {
      // Convert to string if it's an object
      const templateString =
        typeof template === "string"
          ? template
          : JSON.stringify(template, null, 2);

      // Helper function to find keys in a string
      const findKeys = (str: string): string[] => {
        const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
        const matches = str.match(regex);
        return matches
          ? matches.map((match) =>
              match.replace(/<helicone-prompt-input key="|"\s*\/>/g, "")
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
}
