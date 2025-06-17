import { Result, err, ok } from "../../packages/common/result";
import { BaseStore } from "./baseStore";
import { clickhouseDb, Annotations } from "../db/ClickhouseWrapper";
import { v4 as uuidv4 } from "uuid";

export interface ABAnnotationData {
  prompt: string;
  response_a: string;
  response_b: string;
  choice: "a" | "b";
}

export interface CreateAnnotationParams {
  datasetId: string;
  datasetRowId: string;
  requestId: string;
  annotationType: "A/B" | "Labeling" | "RL" | "SFT";
  annotationData: Record<string, any>;
  annotatorId: string;
}

export interface AnnotationFilter {
  datasetId?: string;
  requestId?: string;
  annotationType?: "A/B" | "Labeling" | "RL" | "SFT";
  annotatorId?: string;
  limit?: number;
  offset?: number;
}

export class AnnotationStore extends BaseStore {
  async createAnnotation(
    params: CreateAnnotationParams
  ): Promise<Result<string, string>> {
    try {
      const annotation: Annotations = {
        id: uuidv4(),
        dataset_id: params.datasetId,
        dataset_row_id: params.datasetRowId,
        request_id: params.requestId,
        organization_id: this.organizationId,
        annotation_type: params.annotationType,
        annotation_data: params.annotationData,
        annotator_id: params.annotatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await clickhouseDb.dbInsertClickhouse("annotations", [
        annotation,
      ]);

      if (result.error || !result.data) {
        return err(result.error ?? "Failed to create annotation");
      }

      return ok(annotation.id);
    } catch (error) {
      return err(`Failed to create annotation: ${error}`);
    }
  }

  async getAnnotations(
    filter: AnnotationFilter
  ): Promise<Result<Annotations[], string>> {
    try {
      const params: any[] = [this.organizationId];
      let paramIndex = 2;
      let whereClause = "WHERE organization_id = {val_0: String}";

      if (filter.datasetId) {
        whereClause += ` AND dataset_id = {val_${paramIndex - 1}: UUID}`;
        params.push(filter.datasetId);
        paramIndex++;
      }

      if (filter.requestId) {
        whereClause += ` AND request_id = {val_${paramIndex - 1}: UUID}`;
        params.push(filter.requestId);
        paramIndex++;
      }

      if (filter.annotationType) {
        whereClause += ` AND annotation_type = {val_${paramIndex - 1}: String}`;
        params.push(filter.annotationType);
        paramIndex++;
      }

      if (filter.annotatorId) {
        whereClause += ` AND annotator_id = {val_${paramIndex - 1}: String}`;
        params.push(filter.annotatorId);
        paramIndex++;
      }

      const limitClause = filter.limit ? `LIMIT ${filter.limit}` : "";
      const offsetClause = filter.offset ? `OFFSET ${filter.offset}` : "";

      const query = `
        SELECT *
        FROM annotations
        ${whereClause}
        ORDER BY created_at DESC
        ${limitClause}
        ${offsetClause}
      `;

      const result = await clickhouseDb.dbQuery<Annotations>(query, params);

      if (result.error || !result.data) {
        return err(result.error ?? "Failed to fetch annotations");
      }

      return ok(result.data);
    } catch (error) {
      return err(`Failed to fetch annotations: ${error}`);
    }
  }

  async getAnnotationById(id: string): Promise<Result<Annotations, string>> {
    try {
      const query = `
        SELECT *
        FROM annotations
        WHERE id = {val_0: UUID}
        AND organization_id = {val_1: String}
        LIMIT 1
      `;

      const result = await clickhouseDb.dbQuery<Annotations>(query, [
        id,
        this.organizationId,
      ]);

      if (result.error || !result.data || result.data.length === 0) {
        return err(result.error ?? "Annotation not found");
      }

      return ok(result.data[0]);
    } catch (error) {
      return err(`Failed to fetch annotation: ${error}`);
    }
  }

  async updateAnnotation(
    id: string,
    annotationData: Record<string, any>
  ): Promise<Result<null, string>> {
    try {
      // First, get the existing annotation
      const existingAnnotation = await this.getAnnotationById(id);
      if (existingAnnotation.error || !existingAnnotation.data) {
        return err(existingAnnotation.error ?? "Annotation not found");
      }

      const updatedAnnotation: Annotations = {
        ...existingAnnotation.data,
        annotation_data: annotationData,
        updated_at: new Date().toISOString(),
      };

      // Insert with updated data (ClickHouse handles updates via re-insertion)
      const result = await clickhouseDb.dbInsertClickhouse("annotations", [
        updatedAnnotation,
      ]);

      if (result.error) {
        return err(result.error);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to update annotation: ${error}`);
    }
  }

  async getAnnotationsByDataset(
    datasetId: string,
    limit?: number,
    offset?: number
  ): Promise<Result<Annotations[], string>> {
    return this.getAnnotations({ datasetId, limit, offset });
  }

  async getABAnnotationStats(datasetId: string): Promise<
    Result<
      {
        total: number;
        choice_a_count: number;
        choice_b_count: number;
        annotators_count: number;
      },
      string
    >
  > {
    try {
      const query = `
        SELECT 
          count(*) as total,
          countIf(JSONExtractString(annotation_data, 'choice') = 'a') as choice_a_count,
          countIf(JSONExtractString(annotation_data, 'choice') = 'b') as choice_b_count,
          uniqExact(annotator_id) as annotators_count
        FROM annotations
        WHERE dataset_id = {val_0: UUID}
        AND organization_id = {val_1: String}
        AND annotation_type = 'A/B'
      `;

      const result = await clickhouseDb.dbQuery<{
        total: number;
        choice_a_count: number;
        choice_b_count: number;
        annotators_count: number;
      }>(query, [datasetId, this.organizationId]);

      if (result.error || !result.data || result.data.length === 0) {
        return err(result.error ?? "Failed to fetch annotation stats");
      }

      return ok(result.data[0]);
    } catch (error) {
      return err(`Failed to fetch annotation stats: ${error}`);
    }
  }
} 