import { uuid } from "uuidv4";
import { Database } from "../lib/db/database.types";
import { supabaseServer } from "../lib/db/supabase";
import { dbExecute, dbQueryClickhouse } from "../lib/shared/db/dbExecute";
import { Result } from "../lib/shared/result";
import generateApiKey from "generate-api-key";

type HashedPasswordRow = {
  hashed_password: string;
};

export type DecryptedProviderKey = {
  id: string | null;
  org_id: string | null;
  provider_key: string | null;
  provider_name: string | null;
  provider_key_name: string | null;
};

async function getDecryptedProviderKeyById(
  providerKeyId: string
): Promise<Result<DecryptedProviderKey, string>> {
  const key = await supabaseServer.client
    .from("decrypted_provider_keys")
    .select(
      "id, org_id, decrypted_provider_key, provider_key_name, provider_name"
    )
    .eq("id", providerKeyId)
    .eq("soft_delete", false)
    .single();

  if (key.error !== null || key.data === null) {
    return { data: null, error: key.error.message };
  }

  const providerKey: DecryptedProviderKey = {
    id: key.data.id,
    org_id: key.data.org_id,
    provider_key: key.data.decrypted_provider_key,
    provider_name: key.data.provider_name,
    provider_key_name: key.data.provider_key_name,
  };

  return { data: providerKey, error: null };
}
async function createProxyKey(
  providerKeyId: string,
  heliconeProxyKeyName: string
) {
  if (providerKeyId === undefined) {
    return;
  }

  if (heliconeProxyKeyName === undefined) {
    return;
  }

  const { data: providerKey, error } = await getDecryptedProviderKeyById(
    providerKeyId
  );

  if (error || !providerKey?.id) {
    console.error("Failed to retrieve provider key", error);
    return;
  }

  // Generate a new proxy key
  const proxyKeyId = uuid();
  const proxyKey = `sk-helicone-proxy-${generateApiKey({
    method: "base32",
    dashes: true,
  }).toString()}-${proxyKeyId}`.toLowerCase();

  const query = `SELECT encode(pgsodium.crypto_pwhash_str($1), 'hex') as hashed_password;`;
  const hashedResult = await dbExecute<HashedPasswordRow>(query, [proxyKey]);

  if (
    hashedResult.error ||
    !hashedResult.data ||
    hashedResult.data.length === 0
  ) {
    return;
  }

  // Constraint prevents provider key mapping twice to same helicone proxy key
  // e.g. HeliconeKey1 can't map to OpenAIKey1 and OpenAIKey2
  if (!providerKey.org_id) {
    return;
  }
  const newProxyMapping = await supabaseServer.client
    .from("helicone_proxy_keys")
    .insert({
      id: proxyKeyId,
      org_id: providerKey.org_id,
      helicone_proxy_key_name: heliconeProxyKeyName,
      helicone_proxy_key: hashedResult.data[0].hashed_password,
      provider_key_id: providerKey.id,
      experiment_use: true,
    })
    .select("*")
    .single();

  console.log("newProxyMapping", newProxyMapping);

  return {
    data: {
      proxyKey,
      newProxyMapping: newProxyMapping?.data,
    },
    error: null,
  };
}

export const experimentsLoop = async () => {
  // This is a loop that runs every 1 second
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const experiement = await dbExecute<{
    id: string;
    status: "queued" | "running" | "completed" | "failed" | "canceled";
    name: string;
    created_at: string;
    dataset: string;
    provider_key: string;
    origin_prompt_uuid: string;
    test_prompt_uuid: string;
    origin_prompt_version: number;
    origin_prompt_id: string;
    test_prompt_version: number;
    test_prompt_id: string;
    organization_id: string;
  }>(
    `
    WITH selected_experiment AS (
      SELECT id
      FROM experiments
      WHERE status = 'running'
      ORDER BY created_at ASC
      LIMIT 1
  ), updated_experiment AS (
      UPDATE experiments
      SET status = 'running'
      WHERE id IN (SELECT id FROM selected_experiment)
      RETURNING *
  )
    SELECT 
      ue.id,
      ue.status,
      ue.name,
      ue.created_at,
      ue.dataset,
      ue.provider_key,
      ue.origin_prompt AS origin_prompt_uuid,
      ue.test_prompt AS test_prompt_uuid,
      origin_prompts.version AS origin_prompt_version,
      origin_prompts.id AS origin_prompt_id,
      test_prompts.version AS test_prompt_version,
      test_prompts.id AS test_prompt_id,
      ue.organization_id AS organization_id
    FROM updated_experiment ue
    LEFT JOIN prompts AS origin_prompts ON origin_prompts.uuid = ue.origin_prompt
    LEFT JOIN prompts AS test_prompts ON test_prompts.uuid = ue.test_prompt;
    `,

    []
  );
  console.log("experiement", experiement);
  if (!experiement.data || experiement.data.length === 0) {
    return;
  }
  const testPrompt = await supabaseServer.client
    .from("prompts")
    .select("*")
    .eq("uuid", experiement?.data?.[0].test_prompt_uuid ?? "");

  const dataSetValues = await dbExecute<{
    id: string;
    dataset_id: string;
    request_id: string;
    properties: Record<string, string>;
    path: string;
  }>(
    `
      SELECT experiment_dataset_values.id, dataset_id, request_id, request.properties, request.path
      FROM experiment_dataset_values
      left join request on request.id = experiment_dataset_values.request_id
      WHERE dataset_id = $1
      `,
    [experiement?.data?.[0].dataset]
  );

  console.log(
    "dataSetValues",
    dataSetValues.data?.[0].properties,
    dataSetValues.data?.[0].path
  );

  await new Promise((resolve) => setTimeout(resolve, 1_000));

  const inputValues: Record<string, string> = Object.entries(
    dataSetValues.data?.[0].properties as Record<string, string>
  )
    .map(([key, value]) => {
      return {
        [key.replace("Helicone-Prompt-Input-", "")]: value,
      };
    })
    .reduce((acc, val) => {
      return { ...acc, ...val };
    }, {});

  function traverseAndTransform(obj: any): any {
    if (typeof obj === "string") {
      const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
      return obj.replace(regex, (match, key) => {
        return inputValues[key] ?? match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(traverseAndTransform);
    } else if (typeof obj === "object" && obj !== null) {
      const result: { [key: string]: any } = {};
      for (const key of Object.keys(obj)) {
        result[key] = traverseAndTransform(obj[key]);
      }
      return result;
    }
    return obj;
  }

  const randomId = uuid();
  const proxyKey = await createProxyKey(
    experiement?.data?.[0].provider_key,
    experiement?.data?.[0].name + "-" + randomId
  );

  console.log("proxyKey", proxyKey);
  const requestId = uuid();
  const res = await fetch(dataSetValues.data?.[0].path ?? "", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${proxyKey?.data.proxyKey}`,
      "Helicone-Request-Id": requestId,
    },
    body: JSON.stringify(
      traverseAndTransform(testPrompt?.data?.[0]?.heliconeTemplate)
    ),
  });

  const deleteResult = await supabaseServer.client
    .from("helicone_proxy_keys")
    .delete({
      count: "exact",
    })
    .eq("id", proxyKey?.data.newProxyMapping?.id ?? "")
    .eq("experiment_use", true);

  const testDataset = await supabaseServer.client
    .from("experiment_dataset")
    .insert({
      organization_id: experiement?.data?.[0].organization_id ?? "",
    })
    .select("*")
    .single();

  const testValues = await supabaseServer.client
    .from("experiment_dataset_values")
    .insert([
      {
        dataset_id: testDataset?.data?.id ?? "",
        request_id: requestId,
      },
    ]);

  const putResult = await supabaseServer.client
    .from("experiments")
    .update({
      result_dataset: testDataset?.data?.id ?? "",
    })
    .eq("id", experiement?.data?.[0].id ?? "");

  console.log("deleteResult", deleteResult);
  console.log("res", await res.json());
};
