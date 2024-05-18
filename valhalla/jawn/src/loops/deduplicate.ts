import { clickhouseDb } from "../lib/db/ClickhouseWrapper";

export async function deduplicateRequestResponseVersioned() {
  const query = `
    OPTIMIZE TABLE 
      request_response_versioned 
    FINAL DEDUPLICATE BY 
      request_id, 
      model, 
      request_created_at, 
      organization_id, 
      provider, 
      version, 
      sign
  `;
  await clickhouseDb.dbQuery(query, []);
}
