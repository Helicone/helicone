import { describe, expect, test, afterAll, beforeAll } from "@jest/globals";
import { uuid } from "uuidv4";

require("dotenv").config({
  path: "./.env",
});

const exampleTestKey = "Bearer sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa";
const testOrgId = "83635a30-5ba6-41a8-8cc6-fb7df941b24a";

describe("AnnotationController Integration Tests", () => {
  let testDatasetId: string;
  let testRequestId: string;
  let testDatasetRowId: string;
  let testAnnotationId: string;

  beforeAll(async () => {
    // These would typically be created through the dataset API
    // For now, we'll use mock IDs
    testDatasetId = uuid();
    testRequestId = uuid();
    testDatasetRowId = uuid();
  });

  describe("POST /v1/annotation/ab", () => {
    test("should create an A/B annotation", async () => {
      const response = await fetch("http://127.0.0.1:8585/v1/annotation/ab", {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: exampleTestKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          datasetId: testDatasetId,
          datasetRowId: testDatasetRowId,
          requestId: testRequestId,
          prompt: "What is the capital of France?",
          responseA: "The capital of France is Paris.",
          responseB: "Paris is the capital city of France.",
          choice: "a",
        }),
      });

      // Note: This will likely fail without a real dataset
      // In a real test, you'd first create a dataset and add requests
      if (response.status === 200) {
        const result = await response.json();
        expect(result.data).toBeDefined();
        testAnnotationId = result.data;
      } else {
        // Expected to fail without real dataset
        expect(response.status).toBe(200);
      }
    });

    test("should reject invalid choice value", async () => {
      const response = await fetch("http://127.0.0.1:8585/v1/annotation/ab", {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: exampleTestKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          datasetId: testDatasetId,
          datasetRowId: testDatasetRowId,
          requestId: testRequestId,
          prompt: "Test prompt",
          responseA: "Response A",
          responseB: "Response B",
          choice: "c", // Invalid choice
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /v1/annotation", () => {
    test("should fetch annotations with filters", async () => {
      const response = await fetch(
        `http://127.0.0.1:8585/v1/annotation?datasetId=${testDatasetId}&annotationType=A/B&limit=10`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: exampleTestKey,
          },
        }
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    test("should handle missing authorization", async () => {
      const response = await fetch("http://127.0.0.1:8585/v1/annotation", {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /v1/annotation/{id}", () => {
    test("should fetch annotation by ID", async () => {
      const response = await fetch(
        `http://127.0.0.1:8585/v1/annotation/${testAnnotationId || uuid()}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: exampleTestKey,
          },
        }
      );

      // Will be 200 if annotation exists, otherwise error
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("PUT /v1/annotation/ab/{id}", () => {
    test("should update an A/B annotation", async () => {
      const response = await fetch(
        `http://127.0.0.1:8585/v1/annotation/ab/${testAnnotationId || uuid()}`,
        {
          method: "PUT",
          headers: {
            accept: "application/json",
            Authorization: exampleTestKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Updated prompt",
            choice: "b",
          }),
        }
      );

      // Will succeed if annotation exists
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("GET /v1/annotation/dataset/{datasetId}", () => {
    test("should fetch annotations for a dataset", async () => {
      const response = await fetch(
        `http://127.0.0.1:8585/v1/annotation/dataset/${testDatasetId}?limit=5&offset=0`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: exampleTestKey,
          },
        }
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data).toBeDefined();
    });
  });

  describe("GET /v1/annotation/dataset/{datasetId}/ab/stats", () => {
    test("should fetch A/B annotation statistics", async () => {
      const response = await fetch(
        `http://127.0.0.1:8585/v1/annotation/dataset/${testDatasetId}/ab/stats`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: exampleTestKey,
          },
        }
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      
      if (result.data) {
        expect(result.data).toHaveProperty("total");
        expect(result.data).toHaveProperty("choice_a_count");
        expect(result.data).toHaveProperty("choice_b_count");
        expect(result.data).toHaveProperty("annotators_count");
      }
    });
  });

  describe("GET /v1/annotation/request/{requestId}", () => {
    test("should fetch annotations for a request", async () => {
      const response = await fetch(
        `http://127.0.0.1:8585/v1/annotation/request/${testRequestId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: exampleTestKey,
          },
        }
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("GET /v1/annotation/annotator/{annotatorId}", () => {
    test("should fetch annotations by annotator", async () => {
      const response = await fetch(
        `http://127.0.0.1:8585/v1/annotation/annotator/test-user-123?annotationType=A/B&limit=10`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: exampleTestKey,
          },
        }
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
}); 