import {
  InsertRequestResponseVersioned,
  clickhouseDb,
} from "../../db/ClickhouseWrapper";
import { dbExecute } from "../../shared/db/dbExecute";
import { Result, err, ok, resultMap } from "../../shared/result";

export function formatTimeString(timeString: string): string {
  return new Date(timeString).toISOString().replace("Z", "");
}

export class VersionedRequestStore {
  constructor(private orgId: string) {}

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

  // Updates the request_response_versioned table in Clickhouse
  // We must include all of the primary keys in the delete statement and then insert the new row
  private async putPropertyIntoClickhouse(newVersion: {
    id: string;
    version: number;
    provider: string;
    properties: Record<string, string>;
  }): Promise<Result<InsertRequestResponseVersioned, string>> {
    let rowContents = resultMap(
      await clickhouseDb.dbQuery<InsertRequestResponseVersioned>(
        `
      SELECT *
      FROM request_response_versioned
      WHERE request_id = {val_0: UUID}
      AND version = {val_1: UInt64}
      AND organization_id = {val_2: String}
      AND provider = {val_3: String}
    `,
        [newVersion.id, newVersion.version - 1, this.orgId, newVersion.provider]
      ),
      (x) => x[0]
    );

    if (rowContents.error) {
      return rowContents;
    }
    if (!rowContents.data) {
      rowContents = resultMap(
        await clickhouseDb.dbQuery<InsertRequestResponseVersioned>(
          `
        SELECT *
        FROM request_response_versioned
        WHERE request_id = {val_0: UUID}
        AND organization_id = {val_1: String}
        AND provider = {val_2: String}
        ORDER BY version DESC
        LIMIT 1
      `,
          [newVersion.id, this.orgId, newVersion.provider]
        ),
        (x) => x[0]
      );
    }

    if (rowContents.error || !rowContents.data) {
      return err("Could not find previous version of request");
    }

    const res = await clickhouseDb.dbInsertClickhouse(
      "request_response_versioned",
      [
        // Delete the previous version
        {
          sign: -1,
          version: rowContents.data.version,
          request_id: newVersion.id,
          organization_id: this.orgId,
          provider: newVersion.provider,
          model: rowContents.data.model,
          request_created_at: rowContents.data.request_created_at,
        },
        // Insert the new version
        {
          ...rowContents.data,
          sign: 1,
          version: newVersion.version,
          properties: newVersion.properties,
        },
      ]
    );

    if (res.error) {
      return err(res.error);
    }

    return ok(rowContents.data);
  }

  private async addPropertiesToLegacyTables(
    request: InsertRequestResponseVersioned,
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
