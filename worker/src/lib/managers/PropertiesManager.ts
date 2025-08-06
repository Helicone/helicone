import { Env } from "../..";
import { RequestWrapper } from "../RequestWrapper";
import { PostgresClient } from "../db/postgres";

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
  const postgresClient = new PostgresClient(env);
  const sql = postgresClient.client;

  try {
    // Fetch the existing properties
    const requestData = await sql.oneOrNone(
      `SELECT properties FROM request
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (!requestData) {
      console.error("Request not found");
      return;
    }

    // Update the properties with the new values
    const updatedProperties = {
      ...requestData.properties,
      ...properties,
    };

    // Save the updated properties to the database
    await sql.none(
      `UPDATE request
       SET properties = $1::jsonb
       WHERE id = $2`,
      [JSON.stringify(updatedProperties), id]
    );

    console.log("Update successful");
  } catch (error) {
    console.error("Error updating properties:", error);
  }
}
