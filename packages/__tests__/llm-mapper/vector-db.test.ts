import { mapVectorDB } from "../../llm-mapper/mappers/vector-db";

describe("Vector DB Mapper", () => {
  it("should map vector DB search request/response correctly", () => {
    const request = {
      _type: "vector_db",
      operation: "search",
      text: "Generate travel tips for Bali",
      vector: [0.1, 0.2, 0.3, 0.4],
      topK: 5,
      filter: {
        destination: "Bali",
      },
      databaseName: "travel-tips",
      query: JSON.stringify({
        destination: "Bali",
        startDate: "December 10",
        endDate: "December 20",
        activities: [
          "surfing",
          "visiting temples",
          "trying local food markets",
        ],
        destination_parsed: true,
      }),
    };

    const response = {
      status: "failed",
      message: "No travel tips found with sufficient similarity for Bali",
      similarityThreshold: 0.8,
      actualSimilarity: 0.5,
      metadata: {
        destination: "Bali",
        destination_parsed: true,
        timestamp: "2025-01-24T22:32:45.571Z",
      },
      _type: "vector_db",
    };

    const result = mapVectorDB({
      request,
      response,
      statusCode: 200,
      model: "vector_db",
    });

    expect(result.schema.request.model).toBe("vector_db");
    expect(result.schema.request.messages?.[1].content).toContain(
      "Operation: search"
    );
    expect(result.schema.request.messages?.[1].content).toContain(
      "Database: travel-tips"
    );
    expect(result.schema.response?.messages?.[0].content).toBe(
      response.message
    );
    expect(result.preview.request).toContain(
      "Text: Generate travel tips for Bali"
    );
    expect(result.preview.response).toBe(response.message);
  });

  it("should map vector DB insert operation correctly", () => {
    const request = {
      _type: "vector_db",
      operation: "insert",
      text: "Bali Travel Tip: Visit Uluwatu Temple at sunset",
      vector: [0.1, 0.2, 0.3],
      databaseName: "travel-tips",
      metadata: {
        category: "temples",
        time_of_day: "sunset",
        location: "Uluwatu",
      },
    };

    const response = {
      status: "success",
      message: "Document inserted successfully",
      documentId: "doc123",
      _type: "vector_db",
    };

    const result = mapVectorDB({
      request,
      response,
      statusCode: 200,
      model: "vector_db",
    });

    expect(result.schema.request.messages?.[0].content).toBe(
      "Vector DB insert operation"
    );
    expect(result.preview.request).toContain("Operation: insert");
    expect(result.preview.response).toBe(response.message);
  });

  it("should handle error responses", () => {
    const request = {
      _type: "vector_db",
      operation: "search",
      text: "Invalid query",
      databaseName: "travel-tips",
    };

    const response = {
      status: "error",
      message: "Database connection failed",
      error: {
        code: "CONNECTION_ERROR",
        details: "Unable to connect to vector database",
      },
      _type: "vector_db",
    };

    const result = mapVectorDB({
      request,
      response,
      statusCode: 500,
      model: "vector_db",
    });

    expect(result.preview.response).toBe("Database connection failed");
    expect(result.schema.response?.messages?.[0].content).toBe(
      "Database connection failed"
    );
  });

  it("should handle delete operation", () => {
    const request = {
      _type: "vector_db",
      operation: "delete",
      filter: {
        category: "outdated",
        older_than: "2023-01-01",
      },
      databaseName: "travel-tips",
    };

    const response = {
      status: "success",
      message: "3 documents deleted successfully",
      deletedCount: 3,
      _type: "vector_db",
    };

    const result = mapVectorDB({
      request,
      response,
      statusCode: 200,
      model: "vector_db",
    });

    expect(result.schema.request.messages?.[0].content).toBe(
      "Vector DB delete operation"
    );
    expect(result.preview.request).toContain("Operation: delete");
    expect(result.preview.request).toContain(
      'Filter: {"category":"outdated","older_than":"2023-01-01"}'
    );
    expect(result.preview.response).toBe(response.message);
  });
});
