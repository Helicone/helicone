import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../db/database.types";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { BaseStore } from "./baseStore";
import { dbExecute } from "../shared/db/dbExecute";
import { FilterLeafSubset } from "../shared/filters/filterDefs";
import { buildFilterPostgres } from "../shared/filters/filters";

export class DatasetStore extends BaseStore {
  async getDataset(datasetId: string) {
    return dbExecute<{
      name: string;
      id: string;
      created_at: string;
    }>(
      `
    SELECT 
      experiment_dataset_v2.name,
      experiment_dataset_v2.id,
      experiment_dataset_v2.created_at
    FROM experiment_dataset_v2
    WHERE experiment_dataset_v2.organization = $1
    AND experiment_dataset_v2.id = $2
    `,
      [this.organizationId, datasetId]
    );
  }
}
