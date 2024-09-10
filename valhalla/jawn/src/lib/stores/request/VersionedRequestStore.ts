import {
  ClickhouseDB,
  RequestResponseRMT,
  clickhouseDb,
} from "../../db/ClickhouseWrapper";
import { dbExecute } from "../../shared/db/dbExecute";
import {
  PromiseGenericResult,
  Result,
  err,
  ok,
  resultMap,
} from "../../shared/result";

export function formatTimeString(timeString: string): string {
  return new Date(timeString).toISOString().replace("Z", "");
}

export class VersionedRequestStore {
  constructor(private orgId: string) {}

  async insertRequestResponseVersioned(
    requestResponseLog: RequestResponseRMT[]
  ): PromiseGenericResult<string> {
    const result = await clickhouseDb.dbInsertClickhouse(
      "request_response_rmt",
      requestResponseLog
    );

    // DELETE THIS
    const legacy = await clickhouseDb.dbInsertClickhouse(
      "request_response_versioned",
      requestResponseLog.map((row) => ({
        response_id: row.response_id,
        response_created_at: row.response_created_at,
        latency: row.latency,
        status: row.status,
        completion_tokens: row.completion_tokens,
        prompt_tokens: row.prompt_tokens,
        model: row.model,
        request_id: row.request_id,
        request_created_at: row.request_created_at,
        user_id: row.user_id,
        organization_id: row.organization_id,
        proxy_key_id: row.proxy_key_id,
        threat: row.threat,
        time_to_first_token: row.time_to_first_token,
        provider: row.provider,
        country_code: row.country_code,
        target_url: row.target_url,
        properties: row.properties,
        request_body: row.request_body,
        response_body: row.response_body,
        assets: row.assets,
        scores: row.scores,
        sign: 1,
        version: 1,
      }))
    );

    if (result.error || !result.data) {
      return err(`Error inserting request response logs: ${result.error}`);
    }

    return ok(result.data);
  }

  // Updates the propeties column (JSONB) of the request table
  // to include {property: value}
  // and bumps the version column
  private async putPropertyAndBumpVersion(
    requestId: string,
    property: string,
    value: string
  ) {
    return await dbExecute<{
      id: string;
      version: number;
      provider: string;
      properties: Record<string, string>;
    }>(
      `
      UPDATE request
      SET properties = properties || $1,
          version = version + 1
      WHERE helicone_org_id = $2
      AND id = $3
      RETURNING version, id, provider, properties
      `,
      [{ [property]: value }, this.orgId, requestId]
    );
  }

  // Updates the request_response_rmt table in Clickhouse
  // We must include all of the primary keys in the delete statement and then insert the new row
  private async putPropertyIntoClickhouse(newVersion: {
    id: string;
    version: number;
    provider: string;
    properties: Record<string, string>;
  }): Promise<Result<RequestResponseRMT, string>> {
    let rowContents = resultMap(
      await clickhouseDb.dbQuery<RequestResponseRMT>(
        `
      SELECT *
      FROM request_response_rmt
      WHERE request_id = {val_0: UUID}
      AND organization_id = {val_1: String}
      AND provider = {val_2: String}
      ORDER BY updated_at DESC
      LIMIT 1
    `,
        [newVersion.id, this.orgId, newVersion.provider]
      ),
      (x) => x[0]
    );

    if (rowContents.error || !rowContents.data) {
      return err("Could not find previous version of request");
    }

    const row = rowContents.data;
    const res = await clickhouseDb.dbInsertClickhouse("request_response_rmt", [
      {
        response_id: row.response_id,
        response_created_at: row.response_created_at,
        latency: row.latency,
        status: row.status,
        completion_tokens: row.completion_tokens,
        prompt_tokens: row.prompt_tokens,
        model: row.model ?? this.getModelFromPath(row.target_url),
        request_id: row.request_id,
        request_created_at: row.request_created_at,
        user_id: row.user_id,
        organization_id: row.organization_id,
        proxy_key_id: row.proxy_key_id,
        threat: row.threat,
        time_to_first_token: row.time_to_first_token,
        provider: row.provider,
        country_code: row.country_code,
        target_url: row.target_url,
        request_body: row.request_body,
        response_body: row.response_body,
        assets: row.assets,
        scores: row.scores,
        properties: newVersion.properties,
      },
    ]);

    if (res.error) {
      return err(res.error);
    }

    return ok(rowContents.data);
  }

  private getModelFromPath(path: string): string {
    const regex1 = /\/engines\/([^/]+)/;
    const regex2 = /models\/([^/:]+)/;

    let match = path.match(regex1);

    if (!match) {
      match = path.match(regex2);
    }

    if (match && match[1]) {
      return match[1];
    }

    return "";
  }

  private async addPropertiesToLegacyTables(
    request: RequestResponseRMT,
    newProperties: { key: string; value: string }[]
  ): Promise<Result<null, string>> {
    const { error: e } = await clickhouseDb.dbInsertClickhouse(
      "property_with_response_v1",
      newProperties.map((p) => {
        return {
          ...request,
          auth_hash: "",
          property_key: p.key,
          property_value: p.value,
        };
      })
    );
    if (e) {
      console.error("Error inserting into clickhouse:", e);
    }

    await clickhouseDb.dbInsertClickhouse(
      "properties_v3",
      newProperties.map((p) => {
        return {
          id: 1,
          request_id: request.request_id,
          key: p.key,
          value: p.value,
          organization_id: request.organization_id,
          created_at: formatTimeString(new Date().toISOString()),
        };
      })
    );

    return ok(null);
  }

  async addPropertyToRequest(
    requestId: string,
    property: string,
    value: string
  ): Promise<Result<null, string>> {
    const request = await this.putPropertyAndBumpVersion(
      requestId,
      property,
      value
    );

    if (request.error || !request.data) {
      return request;
    }

    const requestInClickhouse = await this.putPropertyIntoClickhouse(
      request.data[0]
    );

    if (requestInClickhouse.error || !requestInClickhouse.data) {
      return requestInClickhouse;
    }

    await this.addPropertiesToLegacyTables(requestInClickhouse.data, [
      { key: property, value },
    ]);

    return ok(null);
  }
}
