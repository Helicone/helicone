import { AuthParams } from "../../packages/common/auth/types";
import { Result, err, ok, promiseResultMap } from "../../packages/common/result";
import { BaseManager } from "../BaseManager";
import { AnnotationStore, ABAnnotationData, CreateAnnotationParams, AnnotationFilter } from "../../lib/stores/AnnotationStore";
import { HeliconeDatasetManager } from "../dataset/HeliconeDatasetManager";
import { Annotations } from "../../lib/db/ClickhouseWrapper";

export interface CreateABAnnotationParams {
  datasetId: string;
  datasetRowId: string;
  requestId: string;
  prompt: string;
  responseA: string;
  responseB: string;
  choice: "a" | "b";
}

export class AnnotationManager extends BaseManager {
  private annotationStore: AnnotationStore;
  private datasetManager: HeliconeDatasetManager;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.annotationStore = new AnnotationStore(authParams.organizationId);
    this.datasetManager = new HeliconeDatasetManager(authParams);
  }

  async createABAnnotation(
    params: CreateABAnnotationParams
  ): Promise<Result<string, string>> {
    // Validate that the dataset exists and user has access
    const datasetResult = await this.datasetManager.getDatasets({
      datasetIds: [params.datasetId],
    });

    if (datasetResult.error || !datasetResult.data || datasetResult.data.length === 0) {
      return err("Dataset not found or no access");
    }

    // Validate that the dataset row exists
    const datasetRowResult = await this.datasetManager.query(params.datasetId, {
      offset: 0,
      limit: 1000, // We'll need to search through these
    });

    if (datasetRowResult.error || !datasetRowResult.data) {
      return err("Failed to query dataset rows");
    }

    const datasetRow = datasetRowResult.data.find(
      (row) => row.id === params.datasetRowId
    );

    if (!datasetRow) {
      return err("Dataset row not found");
    }

    // Create the annotation data
    const annotationData: ABAnnotationData = {
      prompt: params.prompt,
      response_a: params.responseA,
      response_b: params.responseB,
      choice: params.choice,
    };

    // Create the annotation
    return this.annotationStore.createAnnotation({
      datasetId: params.datasetId,
      datasetRowId: params.datasetRowId,
      requestId: params.requestId,
      annotationType: "A/B",
      annotationData,
      annotatorId: this.authParams.userId || "anonymous",
    });
  }

  async getAnnotations(
    filter: AnnotationFilter
  ): Promise<Result<Annotations[], string>> {
    return this.annotationStore.getAnnotations(filter);
  }

  async getAnnotationById(id: string): Promise<Result<Annotations, string>> {
    return this.annotationStore.getAnnotationById(id);
  }

  async updateABAnnotation(
    id: string,
    params: {
      prompt?: string;
      responseA?: string;
      responseB?: string;
      choice?: "a" | "b";
    }
  ): Promise<Result<null, string>> {
    // Get existing annotation
    const existingResult = await this.annotationStore.getAnnotationById(id);
    if (existingResult.error || !existingResult.data) {
      return err(existingResult.error ?? "Annotation not found");
    }

    const existing = existingResult.data;
    if (existing.annotation_type !== "A/B") {
      return err("Cannot update non-A/B annotation with A/B data");
    }

    // Merge with existing data
    const updatedData: ABAnnotationData = {
      prompt: params.prompt ?? existing.annotation_data.prompt,
      response_a: params.responseA ?? existing.annotation_data.response_a,
      response_b: params.responseB ?? existing.annotation_data.response_b,
      choice: params.choice ?? existing.annotation_data.choice,
    };

    return this.annotationStore.updateAnnotation(id, updatedData);
  }

  async getDatasetAnnotations(
    datasetId: string,
    limit?: number,
    offset?: number
  ): Promise<Result<Annotations[], string>> {
    // Validate dataset access
    const datasetResult = await this.datasetManager.getDatasets({
      datasetIds: [datasetId],
    });

    if (datasetResult.error || !datasetResult.data || datasetResult.data.length === 0) {
      return err("Dataset not found or no access");
    }

    return this.annotationStore.getAnnotationsByDataset(datasetId, limit, offset);
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
    // Validate dataset access
    const datasetResult = await this.datasetManager.getDatasets({
      datasetIds: [datasetId],
    });

    if (datasetResult.error || !datasetResult.data || datasetResult.data.length === 0) {
      return err("Dataset not found or no access");
    }

    return this.annotationStore.getABAnnotationStats(datasetId);
  }

  async getRequestAnnotations(
    requestId: string
  ): Promise<Result<Annotations[], string>> {
    return this.annotationStore.getAnnotations({ requestId });
  }

  async getAnnotationsByAnnotator(
    annotatorId: string,
    filter?: {
      datasetId?: string;
      annotationType?: "A/B" | "Labeling" | "RL" | "SFT";
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Annotations[], string>> {
    return this.annotationStore.getAnnotations({
      annotatorId,
      ...filter,
    });
  }
} 