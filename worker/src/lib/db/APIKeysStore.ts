import pgPromise from "pg-promise";

export type APIKey = {
  api_key_hash: string;
  organization_id: string;
  soft_delete: boolean;
};

export class APIKeysStore {
  constructor(private sql: pgPromise.IDatabase<any>) {}

  async getAPIKeys(): Promise<APIKey[] | null> {
    const pageSize = 1000;
    let allData: APIKey[] = [];
    let offset = 0;

    try {
      const ONE_DAY_AGO = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      while (true) {
        const data = await this.sql.query(
          `SELECT organization_id, api_key_hash, soft_delete
           FROM helicone_api_keys
           WHERE temp_key = false
             AND api_key_name != 'auto-generated-experiment-key'
             AND (created_at >= $1 OR updated_at >= $1)
           ORDER BY api_key_hash
           LIMIT $2
           OFFSET $3`,
          [ONE_DAY_AGO, pageSize, offset]
        );

        if (!data || data.length === 0) {
          break;
        }

        allData.push(...data);

        // If we got fewer results than the page size, we've reached the end
        if (data.length < pageSize) {
          break;
        }

        offset += pageSize;
      }

      return allData;
    } catch (error) {
      console.error("Error fetching API keys:", error);
      return null;
    }
  }

  async getAPIKeyWithFetch(apiKeyHash: string): Promise<APIKey | null> {
    try {
      const data = await this.sql.query<APIKey>(
        `SELECT organization_id, api_key_hash, soft_delete
         FROM helicone_api_keys
         WHERE api_key_hash = $1
           AND soft_delete = false
         LIMIT 1`,
        [apiKeyHash]
      );

      // TODO: dbExecute
      // if (!data || data.length === 0) {
      //   return null;
      // }

      return data;
    } catch (error) {
      console.error("Error fetching API key:", error);
      return null;
    }
  }
}
