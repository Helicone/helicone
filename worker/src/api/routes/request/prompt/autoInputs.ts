import { z } from "zod";
import { Path, Str } from "@cloudflare/itty-router-openapi";
import { IRequest } from "itty-router";
import { Env } from "../../../../";
import { Json } from "../../../../../supabase/database.types";
import { RequestWrapper } from "../../../../lib/RequestWrapper";
import { AuthParams } from "../../../../lib/dbLogger/DBLoggable";
import { APIClient } from "../../../lib/apiClient";
import { BaseAPIRoute, OpenAPIdata } from "../../baseAPIRoute";

// Recurs through obj and finds any value that is a string and replaces
// any portion of the string that matches the value with <helicone-prompt-input key=KEY>
function recurAndReplaceString(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  inputs: { key: string; value: string }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (typeof obj === "string") {
    for (const { key, value } of inputs) {
      obj = obj.replace(value, `<helicone-prompt-input key=${key}/>`);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((o) => recurAndReplaceString(o, inputs));
  }
  if (typeof obj === "object") {
    for (const key in obj) {
      obj[key] = recurAndReplaceString(obj[key], inputs);
    }
    return obj;
  }
  return obj;
}

const ReturnBody = z
  .object({
    providerKey: z.string(),
  })
  .array();

type ReturnBodyType = z.infer<typeof ReturnBody>;

export class AutoPromptInputs extends BaseAPIRoute {
  static schema = {
    tags: ["Prompt", "Request"],
    summary: "Gets the provider key for a customer",
    // requestBody: BodyOpenAPI,
    parameters: {
      requestId: Path(Str, {
        description: "request id",
      }),
      promptId: Path(Str, {
        description: "prompt id",
      }),
    },
    requestBody: z.record(z.string()),
    responses: {
      "200": {
        description: "Task fetched successfully",
        schema: {
          metaData: {},
          task: ReturnBody,
        },
      },
      "401": {
        description: "Unauthorized",
      },
      "500": {
        description: "Internal Server Error",
      },
    },
  };

  async heliconeHandle({
    client,
    authParams,
    data,
  }: {
    request: IRequest;
    requestWrapper: RequestWrapper;
    env: Env;
    ctx: ExecutionContext;
    client: APIClient;
    authParams: AuthParams;
    data: OpenAPIdata;
  }): Promise<ReturnBodyType> {
    const {
      params: { requestId, promptId },
      body,
    } = data as {
      params: { requestId: string; promptId: string };
      body: Record<string, string>;
    };

    if (promptId.length > 32) {
      throw new Error("Prompt id is too long");
    }
    await client.queue.waitForResponse(
      requestId,
      authParams.organizationId,
      1000 * 10 // 10 seconds
    );
    const { data: heliconeRequest, error: heliconeRequestError } =
      await client.db.getRequestById(requestId);
    if (heliconeRequestError) {
      throw new Error(JSON.stringify(heliconeRequestError));
    }

    if (!heliconeRequest) {
      throw new Error("Request not found");
    }
    const inputsToAdd = Object.entries(body).map(([key, value]) => {
      return { key: key, value: value };
    });
    const newProperties = inputsToAdd.map(({ key, value }) => {
      return { key: `Helicone-Prompt-Input-${key}`, value: value };
    });
    newProperties.push({
      key: "Helicone-Prompt-Id",
      value: promptId,
    });

    const allProperties = {
      ...((heliconeRequest?.properties as Record<string, Json>) || {}),
      ...newProperties.reduce((acc, { key, value }) => {
        return { ...acc, [key]: value };
      }, {}),
    };

    await client.queue.putRequestProperty(
      requestId,
      allProperties,
      newProperties,
      authParams.organizationId,
      heliconeRequest
    );

    const heliconeTemplate = recurAndReplaceString(
      heliconeRequest.body,
      inputsToAdd
    );

    const upsertResult = await client.queue.upsertPrompt(
      heliconeTemplate,
      promptId,
      heliconeRequest,
      authParams.organizationId
    );

    if (upsertResult.error) {
      console.error("Error upserting prompt", upsertResult.error);
      throw new Error(JSON.stringify(upsertResult.error));
    }

    return [
      {
        providerKey: "hello",
      },
    ];
  }
}
