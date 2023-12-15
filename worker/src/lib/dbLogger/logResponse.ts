/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { Result } from "../../results";
import { AuthParams, DBLoggableProps } from "./DBLoggable";
import { InsertQueue } from "./insertQueue";

const MAX_USER_ID_LENGTH = 7000;

// Replaces all the image_url that is not a url or not { url: url }  with
// { unsupported_image: true }
//
function unsupportedImage(body: any): any {
  if (typeof body !== "object" || body === null) {
    return body;
  }
  if (Array.isArray(body)) {
    return body.map((item) => unsupportedImage(item));
  }
  const notSupportMessage = {
    helicone_message:
      "Storing images as bytes is currently not supported within Helicone.",
  };
  if (body["image_url"] !== undefined) {
    const imageUrl = body["image_url"];
    if (typeof imageUrl === "string" && !imageUrl.startsWith("http")) {
      body.image_url = notSupportMessage;
    }
    if (
      typeof imageUrl === "object" &&
      imageUrl.url !== undefined &&
      typeof imageUrl.url === "string" &&
      !imageUrl.url.startsWith("http")
    ) {
      body.image_url = notSupportMessage;
    }
  }
  const result: any = {};
  for (const key in body) {
    result[key] = unsupportedImage(body[key]);
  }
  return result;
}

export async function logRequest(
  request: DBLoggableProps["request"],
  responseId: string,
  dbClient: SupabaseClient<Database>,
  insertQueue: InsertQueue,
  authParams: AuthParams
): Promise<
  Result<
    {
      request: Database["public"]["Tables"]["request"]["Row"];
      properties: Database["public"]["Tables"]["properties"]["Insert"][];
      node: {
        id: string | null;
        job: string | null;
      };
    },
    string
  >
> {
  try {
    if (!authParams.organizationId) {
      return { data: null, error: "Helicone organization not found" };
    }

    let bodyText = request.bodyText ?? "{}";
    bodyText = bodyText.replace(/\\u0000/g, ""); // Remove unsupported null character in JSONB

    let requestBody = {
      error: `error parsing request body: ${bodyText}`,
    };
    try {
      requestBody = JSON.parse(bodyText ?? "{}");
    } catch (e) {
      console.error("Error parsing request body", e);
    }

    let truncatedUserId = request.userId ?? "";

    if (truncatedUserId.length > MAX_USER_ID_LENGTH) {
      truncatedUserId =
        truncatedUserId.substring(0, MAX_USER_ID_LENGTH) + "...";
    }

    const jobNode = request.nodeId
      ? await dbClient
          .from("job_node")
          .select("*")
          .eq("id", request.nodeId)
          .single()
      : null;
    if (jobNode && jobNode.error) {
      return { data: null, error: `No task found for id ${request.nodeId}` };
    }

    const createdAt = request.startTime ?? new Date();
    const requestData = {
      id: request.requestId,
      path: request.path,
      body: request.omitLog ? {} : unsupportedImage(requestBody),
      auth_hash: "",
      user_id: request.userId ?? null,
      prompt_id: request.promptId ?? null,
      properties: request.properties,
      formatted_prompt_id: null,
      prompt_values: null,
      helicone_user: authParams.userId ?? null,
      helicone_api_key_id: authParams.heliconeApiKeyId ?? null,
      helicone_org_id: authParams.organizationId,
      provider: request.provider,
      helicone_proxy_key_id: request.heliconeProxyKeyId ?? null,
      created_at: createdAt.toISOString(),
    };

    const customPropertyRows = Object.entries(request.properties).map(
      (entry) => ({
        request_id: request.requestId,
        auth_hash: null,
        user_id: null,
        key: entry[0],
        value: entry[1],
        created_at: createdAt.toISOString(),
      })
    );

    const requestResult = await insertQueue.addRequest(
      requestData,
      customPropertyRows,
      responseId
    );

    if (requestResult.error) {
      return { data: null, error: requestResult.error };
    }
    if (jobNode && jobNode.data) {
      const jobNodeResult = await insertQueue.addRequestNodeRelationship(
        jobNode.data.job,
        jobNode.data.id,
        request.requestId
      );
      if (jobNodeResult.error) {
        return {
          data: null,
          error: `Node Relationship error: ${jobNodeResult.error}`,
        };
      }
    }

    return {
      data: {
        request: requestData,
        properties: customPropertyRows,
        node: {
          id: jobNode?.data.id ?? null,
          job: jobNode?.data.job ?? null,
        },
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: JSON.stringify(e) };
  }
}
