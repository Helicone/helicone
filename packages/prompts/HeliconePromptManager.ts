import { HeliconeTemplateManager } from "@helicone-package/prompts/templates";
import {
  HeliconeChatCreateParams,
  HeliconeChatCreateParamsStreaming,
} from "./types";
import {
  Prompt2025Version,
  ValidationError,
} from "@helicone-package/prompts/types";
import { ChatCompletionCreateParams } from "openai/resources/chat/completions";

interface HeliconePromptManagerOptions {
  apiKey: string;
  baseUrl?: string;
}

export class HeliconePromptManager {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: HeliconePromptManagerOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || "https://api.helicone.ai";
  }

  /**
   * Finds the prompt version dynamically based on prompt params
   * @param params - The chat completion parameters containing prompt_id, optional version_id, inputs, and other OpenAI parameters
   * @returns Object containing the compiled prompt body and any validation/substitution errors
   */
  async pullPromptVersion(
    params: HeliconeChatCreateParams | HeliconeChatCreateParamsStreaming
  ): Promise<Prompt2025Version> {
    const { prompt_id, version_id, environment } = params;
    
    if (!prompt_id) {
      throw new Error("No prompt ID provided");
    }
    
    if (environment) {
      return await this.getEnvironmentVersion(prompt_id, environment);
    }
    if (version_id) {
      return await this.getPromptVersion(version_id);
    }
    return await this.getProductionVersion(prompt_id);
  }

  /**
   * Pulls a prompt body from Helicone storage by prompt ID and optional version ID
   * @param promptId - The unique identifier of the prompt
   * @param versionId - Optional version ID, if not provided uses production version
   * @returns The raw prompt body from storage
   */
  async pullPromptBody(
    params: HeliconeChatCreateParams | HeliconeChatCreateParamsStreaming
  ): Promise<ChatCompletionCreateParams> {
    try {
      const promptVersion = await this.pullPromptVersion(params);

      const promptBody = await this.fetchPromptBodyFromS3(
        promptVersion?.s3_url
      );
      return promptBody as ChatCompletionCreateParams;
    } catch (error) {
      console.error("Error pulling prompt body:", error);
      throw error;
    }
  }

  /**
   * Pulls a prompt body from Helicone storage by version ID
   * @param versionId - The unique identifier of the prompt version
   * @returns The raw prompt body from storage
   */
  async pullPromptBodyByVersionId(versionId: string): Promise<ChatCompletionCreateParams> {
    try {
      const promptVersion = await this.getPromptVersion(versionId);
      const promptBody = await this.fetchPromptBodyFromS3(
        promptVersion?.s3_url
      );
      return promptBody as ChatCompletionCreateParams;
    } catch (error) {
      console.error("Error pulling prompt body:", error);
      throw error;
    }
  }

  /**
   * Merge 
   * @param params - The chat completion parameters containing prompt_id, optional version_id, inputs, and other OpenAI parameters
   * @returns Object containing the compiled prompt body and any validation/substitution errors
   */
  async mergePromptBody(
    params: HeliconeChatCreateParams | HeliconeChatCreateParamsStreaming,
    sourcePromptBody: ChatCompletionCreateParams,
  ): Promise<{ body: ChatCompletionCreateParams; errors: ValidationError[] }> {
    const errors: ValidationError[] = [];

    const substitutionValues = params.inputs || {};

    const mergedMessages = [
      ...(sourcePromptBody.messages || []),
      ...(params.messages || []),
    ];

    const substitutedMessages = mergedMessages.map((message) => {
      if (typeof message.content === "string") {
        const substituted = HeliconeTemplateManager.substituteVariables(
          message.content,
          substitutionValues
        );
        if (!substituted.success) {
          errors.push(...(substituted.errors || []));
        }
        return {
          ...message,
          content: substituted.success ? substituted.result : message.content,
        };
      }
      return message;
    });

    let finalResponseFormat = params.response_format ?? sourcePromptBody.response_format;
    if (finalResponseFormat) {
      const substitutedResponseFormat =
        HeliconeTemplateManager.substituteVariablesJSON(
          finalResponseFormat,
          substitutionValues
        );
      if (!substitutedResponseFormat.success) {
        errors.push(...(substitutedResponseFormat.errors || []));
      }
      finalResponseFormat = substitutedResponseFormat.success
        ? substitutedResponseFormat.result
        : finalResponseFormat;
    }

    let finalTools = [...(sourcePromptBody.tools ?? []), ...(params.tools ?? [])];
    if (finalTools) {
      const substitutedTools =
        HeliconeTemplateManager.substituteVariablesJSON(
          finalTools,
          substitutionValues
        );
      if (!substitutedTools.success) {
        errors.push(...(substitutedTools.errors || []));
      }
      finalTools = substitutedTools.success
        ? substitutedTools.result
        : finalTools;
    }

    const { prompt_id, version_id, inputs, environment, ...inputOpenaiParams } = params;
    const mergedBody = {
      ...sourcePromptBody,
      ...inputOpenaiParams,
      messages: substitutedMessages,
      response_format: finalResponseFormat,
      tools: finalTools,
    } as ChatCompletionCreateParams;

    return { body: mergedBody, errors };
  }

  /**
   * Retrieves and merges prompt body with input parameters and variable substitution
   * @param params - The chat completion parameters containing prompt_id, optional version_id, inputs, and other OpenAI parameters
   * @returns Object containing the compiled prompt body and any validation/substitution errors
   */
  async getPromptBody(
    params: HeliconeChatCreateParams | HeliconeChatCreateParamsStreaming
  ): Promise<{ body: ChatCompletionCreateParams; errors: ValidationError[] }> {
    if (!params.prompt_id) {
      const { prompt_id, version_id, inputs, environment, ...openaiParams } = params;
      return { body: openaiParams as ChatCompletionCreateParams, errors: [] };
    }

    try {
      const pulledPromptBody = await this.pullPromptBody(params); 
      return await this.mergePromptBody(params, pulledPromptBody);
    } catch (error) {
      console.error("Error getting prompt body:", error);
      throw error;
    }
  }

  private async getPromptVersion(
    versionId: string
  ): Promise<Prompt2025Version> {
    const response = await fetch(
      `${this.baseUrl}/v1/prompt-2025/query/version`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptVersionId: versionId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get prompt version: ${response.statusText}`);
    }

    const result = (await response.json()) as {
      data?: Prompt2025Version;
      error?: string;
    };
    if (result.error) {
      throw new Error(`API error: ${result.error}`);
    }

    return result.data as Prompt2025Version;
  }

  private async getProductionVersion(
    promptId: string
  ): Promise<Prompt2025Version> {
    const response = await fetch(
      `${this.baseUrl}/v1/prompt-2025/query/production-version`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptId: promptId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get production version: ${response.statusText}`
      );
    }

    const result = (await response.json()) as {
      data?: Prompt2025Version;
      error?: string;
    };
    if (result.error) {
      throw new Error(`API error: ${result.error}`);
    }

    return result.data as Prompt2025Version;
  }

  private async getEnvironmentVersion(
    promptId: string,
    environment: string
  ): Promise<Prompt2025Version> {
    const response = await fetch(
      `${this.baseUrl}/v1/prompt-2025/query/environment-version`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptId: promptId,
          environment: environment,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get environment version: ${response.statusText}`
      );
    }

    const result = (await response.json()) as {
      data?: Prompt2025Version;
      error?: string;
    };
    if (result.error) {
      throw new Error(`API error: ${result.error}`);
    }

    return result.data as Prompt2025Version;
  }

  private async fetchPromptBodyFromS3(s3Url?: string): Promise<any> {
    if (!s3Url) {
      throw new Error("No S3 URL provided for prompt body");
    }

    const response = await fetch(s3Url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch prompt body from S3: ${response.statusText}`
      );
    }

    return await response.json();
  }
}
