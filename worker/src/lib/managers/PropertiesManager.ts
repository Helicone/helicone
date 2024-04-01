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
