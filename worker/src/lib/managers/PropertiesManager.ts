import { createClient } from "@supabase/supabase-js";
import { Env } from "../..";
import { RequestWrapper } from "../RequestWrapper";

interface LoggingRequestBody {
  "helicone-id": string;
  [key: string]: unknown;
}

export async function handleLoggingEndpoint(
  request: RequestWrapper,
  env: Env
): Promise<Response> {
  const body = await request.getJson<LoggingRequestBody>();
  const heliconeId = body["helicone-id"];
  const propTag = "helicone-property-";
  const heliconeHeaders = Object.fromEntries(
    [...request.getHeaders().entries()]
      .filter(
        ([key, _]) => key.startsWith(propTag) && key.length > propTag.length
      )
      .map(([key, value]) => [key.substring(propTag.length), value])
  );

  await updateRequestProperties(heliconeId, heliconeHeaders, env);
  const propertyNames = Object.keys(heliconeHeaders).join(", ");

  return new Response(`Properties updated with properties: ${propertyNames}`, {
    status: 200,
  });
}

export async function updateRequestProperties(
  id: string,
  properties: Record<string, string>,
  env: Env
): Promise<void> {
  const dbClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch the existing properties
  const { data: requestData, error: fetchError } = await dbClient
    .from("request")
    .select("properties")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Error fetching properties:", fetchError.message);
    return;
  }

  // Update the properties with the new values
  const updatedProperties = {
    ...requestData.properties,
    ...properties,
  };

  // Save the updated properties to the database
  const { error: updateError } = await dbClient
    .from("request")
    .update({ properties: updatedProperties })
    .eq("id", id);

  if (updateError) {
    console.error("Error updating properties:", updateError.message);
  } else {
    console.log("Update successful");
  }
}

export async function hideProperty(
    request: RequestWrapper,
    env: Env
): Promise<Response> {
  const body = await request.getJson<{
    organization_id: string;
    property_key: string;
    user_id: string;
  }>();
  if (!body.organization_id || !body.property_key || !body.user_id) {
    return new Response("Missing required fields", { status: 400 });
  }

  const dbClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { error } = await dbClient.from("hidden_properties").insert({
      organization_id: body.organization_id,
      property_key: body.property_key,
      hidden_by: body.user_id,
      hidden_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error hiding property:", (error as Error).message);
      throw error;
    }

    return new Response("Property hidden successfully", { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Failed to hide property:", errorMessage);
    return new Response(`Failed to hide property: ${errorMessage}`, {
      status: 500,
    });
  }
}

export async function unhideProperty(
    request: RequestWrapper,
    env: Env
): Promise<Response> {
  const body = await request.getJson<{
    organization_id: string;
    property_key: string;
  }>();
  if (!body.organization_id || !body.property_key) {
    return new Response("Missing required fields", { status: 400 });
  }

  const dbClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { error } = await dbClient.from("hidden_properties").delete().match({
      organization_id: body.organization_id,
      property_key: body.property_key,
    });

    if (error) {
      console.error("Error unhiding property:", error.message);
      throw error;
    }

    return new Response("Property unhidden successfully", { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Failed to unhide property:", errorMessage);
    return new Response(`Failed to unhide property: ${errorMessage}`, {
      status: 500,
    });
  }
}
