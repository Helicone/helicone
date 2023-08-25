import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { Env } from "../..";

export type RequestBodyKV = {
  requestBody: Database["public"]["Tables"]["request"]["Row"]["body"];
};

export type RequestQueueBody = {
  requestBodyKVKey: string;
  responseId: string;
  requestId: string;
  request: Database["public"]["Tables"]["request"]["Insert"];
  properties: Database["public"]["Tables"]["properties"]["Insert"][];
};

export type ResponseBodyKV = {
  responseBody: Database["public"]["Tables"]["response"]["Insert"]["body"];
};

export type ResponseQueueBody = {
  requestBodyKVKey: string;
  responseBodyKVKey: string;
  responseId: string;
  response: Database["public"]["Tables"]["response"]["Insert"];
};

export async function handleRequestQueue(
  batch: MessageBatch<RequestQueueBody>,
  env: Env
): Promise<void> {
  const dbClient = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const promises = batch.messages.map(async (message) => {
    if (!message.body?.request) {
      console.error(
        `Request is null for RequestQueueBody message ${message.id}`
      );
      return null;
    }

    if (!message.body.requestBodyKVKey) {
      console.error(
        `Request body KV key is null for RequestQueueBody message ${message.id} and request ${message.body.request.id}`
      );
      return null;
    }

    const body = await env.INSERT_KV.get(message.body.requestBodyKVKey);

    if (!body) {
      console.error(
        `Request body is null for RequestQueueBody message ${message.id} and request ${message.body.request.id}`
      );
      return null;
    }

    message.body.request.body = body;
    return message;
  });

  const messages = await Promise.all(promises);

  const requestList: Database["public"]["Tables"]["request"]["Insert"][] = [];
  let properties: Database["public"]["Tables"]["properties"]["Insert"][] = [];
  const response: Database["public"]["Tables"]["response"]["Insert"][] = [];
  messages.forEach((requestMessage) => {
    if (!requestMessage || !requestMessage.body) {
      console.error(`Request or body is null for RequestQueueBody message`);
      return;
    }

    requestList.push(requestMessage.body.request);

    if (requestMessage.body.properties) {
      properties = properties.concat(requestMessage.body.properties);
    }

    response.push({
      request: requestMessage.body.requestId,
      id: requestMessage.body.responseId,
      delay_ms: -1,
      body: {},
      status: -1,
    });
  });

  const requestInsertResult = await dbClient
    .from("request")
    .insert(requestList);

  if (requestInsertResult.error) {
    return batch.retryAll();
  }

  const deleteRequestBodyKvPromises = messages.map(async (message) => {
    if (!message?.body?.requestBodyKVKey) {
      console.error(
        `Request body KV key is null for message ${message?.id} and request ${message?.body?.request?.id}`
      );
      return null;
    }

    return env.INSERT_KV.delete(message.body.requestBodyKVKey);
  });

  const responseInsertPromise = dbClient
    .from("response")
    .upsert(response, { onConflict: "id", ignoreDuplicates: true });

  const propertiesInsertPromise = dbClient
    .from("properties")
    .insert(properties);

  await Promise.all([
    deleteRequestBodyKvPromises,
    responseInsertPromise,
    propertiesInsertPromise,
  ]);

  const responseInsertResult = await responseInsertPromise;

  if (responseInsertResult.error) {
    console.log(`Failed to insert initial responses for batch.`);
  }

  const propertiesInsertResult = await propertiesInsertPromise;

  if (propertiesInsertResult.error) {
    console.error(`Failed to insert properties for batch.`);
  }
}

export async function handleResponseQueue(
  batch: MessageBatch<ResponseQueueBody>,
  env: Env
): Promise<void> {
  const dbClient = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const promises = batch.messages.map(async (message) => {
    if (!message.body.response) {
      console.error(`Response is null for message ${message.id}`);
      return null;
    }

    if (!message.body.requestBodyKVKey) {
      console.error(
        `Request body KV key is null for message ${message.id} and response ${message.body.response.id}`
      );
      return null;
    }

    if (!message.body.responseBodyKVKey) {
      console.error(
        `Response body KV key is null for message ${message.id} and response ${message.body.response.id}`
      );
      return null;
    }

    const requestBody = await env.INSERT_KV.get(message.body.requestBodyKVKey);

    if (requestBody) {
      console.error(
        `Request has not yet been inserted for message ${message.id} and response ${message.body.response.id}`
      );
      return null;
    }

    const body = await env.INSERT_KV.get(message.body.responseBodyKVKey);

    if (!body) {
      console.error(
        `Response body is null for message ${message.id} and response ${message.body.response.id}`
      );
      return null;
    }

    message.body.response.body = body;
    return message;
  });

  const messages = await Promise.all(promises);

  const responseList: Database["public"]["Tables"]["response"]["Insert"][] = [];
  messages.forEach((responseMessage) => {
    if (!responseMessage || !responseMessage.body) {
      console.error(`Response is null for message`);
      return;
    }

    responseList.push(responseMessage.body.response);
  });

  const responseInsertResult = await dbClient
    .from("response")
    .upsert(responseList, { onConflict: "id", ignoreDuplicates: false });

  if (responseInsertResult.error) {
    return batch.retryAll();
  }

  const deleteResponseBodyKvPromises = messages.map(async (message) => {
    if (!message?.body?.responseBodyKVKey) {
      console.error(
        `Response body KV key is null for message ${message?.id} and response ${message?.body?.response?.id}`
      );

      return null;
    }

    await env.INSERT_KV.delete(message?.body.responseBodyKVKey);
  });

  await Promise.all([deleteResponseBodyKvPromises]);
}
