import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import { AnnotationManager } from "../../src/managers/annotation/AnnotationManager";
import { AnnotationStore } from "../../src/lib/stores/AnnotationStore";
import { HeliconeDatasetManager } from "../../src/managers/dataset/HeliconeDatasetManager";
import { AuthParams } from "../../src/packages/common/auth/types";
import { ok, err } from "../../src/packages/common/result";

// Mock the stores
jest.mock("../../src/lib/stores/AnnotationStore");
jest.mock("../../src/managers/dataset/HeliconeDatasetManager");

describe("AnnotationManager", () => {
  let annotationManager: AnnotationManager;
  let mockAnnotationStore: jest.Mocked<AnnotationStore>;
  let mockDatasetManager: jest.Mocked<HeliconeDatasetManager>;
  
  const mockAuthParams: AuthParams = {
    organizationId: "test-org-123",
    userId: "test-user-123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instances
    mockAnnotationStore = new AnnotationStore(mockAuthParams.organizationId) as jest.Mocked<AnnotationStore>;
    mockDatasetManager = new HeliconeDatasetManager(mockAuthParams) as jest.Mocked<HeliconeDatasetManager>;
    
    // Create the manager
    annotationManager = new AnnotationManager(mockAuthParams);
    
    // Replace the internal stores with mocks
    (annotationManager as any).annotationStore = mockAnnotationStore;
    (annotationManager as any).datasetManager = mockDatasetManager;
  });

  describe("createABAnnotation", () => {
    const mockCreateParams = {
      datasetId: "dataset-123",
      datasetRowId: "row-123",
      requestId: "request-123",
      prompt: "Test prompt",
      responseA: "Response A",
      responseB: "Response B",
      choice: "a" as const,
    };

    test("should create an A/B annotation successfully", async () => {
      // Mock dataset exists
      mockDatasetManager.getDatasets.mockResolvedValue(ok([{
        id: "dataset-123",
        name: "Test Dataset",
        created_at: "2024-01-01",
        dataset_type: "helicone",
        meta: null,
        organization: "test-org-123",
        requests_count: 10,
      }]));

      // Mock dataset row exists
      mockDatasetManager.query.mockResolvedValue(ok([{
        id: "row-123",
        origin_request_id: "request-123",
        dataset_id: "dataset-123",
        created_at: "2024-01-01",
        signed_url: ok("https://example.com/signed"),
      }]));

      // Mock annotation creation
      mockAnnotationStore.createAnnotation.mockResolvedValue(ok("anno-123"));

      const result = await annotationManager.createABAnnotation(mockCreateParams);

      expect(result.error).toBeNull();
      expect(result.data).toBe("anno-123");

      expect(mockDatasetManager.getDatasets).toHaveBeenCalledWith({
        datasetIds: ["dataset-123"],
      });

      expect(mockAnnotationStore.createAnnotation).toHaveBeenCalledWith({
        datasetId: "dataset-123",
        datasetRowId: "row-123",
        requestId: "request-123",
        annotationType: "A/B",
        annotationData: {
          prompt: "Test prompt",
          response_a: "Response A",
          response_b: "Response B",
          choice: "a",
        },
        annotatorId: "test-user-123",
      });
    });

    test("should return error when dataset not found", async () => {
      mockDatasetManager.getDatasets.mockResolvedValue(ok([]));

      const result = await annotationManager.createABAnnotation(mockCreateParams);

      expect(result.error).toBe("Dataset not found or no access");
      expect(result.data).toBeNull();
    });

    test("should return error when dataset row not found", async () => {
      mockDatasetManager.getDatasets.mockResolvedValue(ok([{
        id: "dataset-123",
        name: "Test Dataset",
        created_at: "2024-01-01",
        dataset_type: "helicone",
        meta: null,
        organization: "test-org-123",
        requests_count: 10,
      }]));

      mockDatasetManager.query.mockResolvedValue(ok([]));

      const result = await annotationManager.createABAnnotation(mockCreateParams);

      expect(result.error).toBe("Dataset row not found");
      expect(result.data).toBeNull();
    });
  });

  describe("updateABAnnotation", () => {
    test("should update A/B annotation successfully", async () => {
      const existingAnnotation = {
        id: "anno-123",
        dataset_id: "dataset-123",
        dataset_row_id: "row-123",
        request_id: "request-123",
        organization_id: "test-org-123",
        annotation_type: "A/B" as const,
        annotation_data: {
          prompt: "Old prompt",
          response_a: "Old A",
          response_b: "Old B",
          choice: "a",
        },
        annotator_id: "test-user-123",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockAnnotationStore.getAnnotationById.mockResolvedValue(ok(existingAnnotation));
      mockAnnotationStore.updateAnnotation.mockResolvedValue(ok(null));

      const result = await annotationManager.updateABAnnotation("anno-123", {
        prompt: "New prompt",
        choice: "b",
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();

      expect(mockAnnotationStore.updateAnnotation).toHaveBeenCalledWith("anno-123", {
        prompt: "New prompt",
        response_a: "Old A",
        response_b: "Old B",
        choice: "b",
      });
    });

    test("should return error for non-A/B annotation", async () => {
      const existingAnnotation = {
        id: "anno-123",
        dataset_id: "dataset-123",
        dataset_row_id: "row-123",
        request_id: "request-123",
        organization_id: "test-org-123",
        annotation_type: "Labeling" as const,
        annotation_data: {},
        annotator_id: "test-user-123",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockAnnotationStore.getAnnotationById.mockResolvedValue(ok(existingAnnotation));

      const result = await annotationManager.updateABAnnotation("anno-123", {
        choice: "b",
      });

      expect(result.error).toBe("Cannot update non-A/B annotation with A/B data");
      expect(result.data).toBeNull();
    });
  });

  describe("getDatasetAnnotations", () => {
    test("should get dataset annotations with access check", async () => {
      const mockAnnotations = [{
        id: "anno-123",
        dataset_id: "dataset-123",
        dataset_row_id: "row-123",
        request_id: "request-123",
        organization_id: "test-org-123",
        annotation_type: "A/B" as const,
        annotation_data: {},
        annotator_id: "test-user-123",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      }];

      mockDatasetManager.getDatasets.mockResolvedValue(ok([{
        id: "dataset-123",
        name: "Test Dataset",
        created_at: "2024-01-01",
        dataset_type: "helicone",
        meta: null,
        organization: "test-org-123",
        requests_count: 10,
      }]));

      mockAnnotationStore.getAnnotationsByDataset.mockResolvedValue(ok(mockAnnotations));

      const result = await annotationManager.getDatasetAnnotations("dataset-123", 10, 0);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockAnnotations);
    });

    test("should return error when no dataset access", async () => {
      mockDatasetManager.getDatasets.mockResolvedValue(ok([]));

      const result = await annotationManager.getDatasetAnnotations("dataset-123");

      expect(result.error).toBe("Dataset not found or no access");
      expect(result.data).toBeNull();
    });
  });

  describe("getABAnnotationStats", () => {
    test("should get A/B annotation statistics", async () => {
      const mockStats = {
        total: 100,
        choice_a_count: 60,
        choice_b_count: 40,
        annotators_count: 5,
      };

      mockDatasetManager.getDatasets.mockResolvedValue(ok([{
        id: "dataset-123",
        name: "Test Dataset",
        created_at: "2024-01-01",
        dataset_type: "helicone",
        meta: null,
        organization: "test-org-123",
        requests_count: 10,
      }]));

      mockAnnotationStore.getABAnnotationStats.mockResolvedValue(ok(mockStats));

      const result = await annotationManager.getABAnnotationStats("dataset-123");

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockStats);
    });
  });
}); 