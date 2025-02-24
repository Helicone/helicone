import { mapTool } from "../../llm-mapper/mappers/tool";

describe("Tool Mapper", () => {
  it("should map hotel API tool request/response correctly", () => {
    const request = {
      _type: "tool",
      toolName: "HotelAPI",
      input: {
        destination: "Bali",
        checkIn: "December 10",
        checkOut: "December 20",
        guests: 2,
        rooms: 1,
      },
    };

    const response = {
      status: "success",
      hotels: [
        {
          id: "HTL_123456",
          name: "Grand Plaza Hotel",
          rating: 4.8,
          pricePerNight: 299,
          currency: "USD",
        },
        {
          id: "HTL_789012",
          name: "Boutique Garden Inn",
          rating: 4.5,
          pricePerNight: 199,
          currency: "USD",
        },
      ],
      filters: {
        priceRange: {
          min: 150,
          max: 800,
        },
      },
      _type: "tool",
      toolName: "HotelAPI",
    };

    const result = mapTool({
      request,
      response,
      statusCode: 200,
      model: "tool:HotelAPI",
    });

    expect(result.schema.request.model).toBe("tool:HotelAPI");
    expect(result.preview.request).toContain("Tool: HotelAPI");
    expect(result.preview.response).toContain("Found 2 hotels");
    expect(result.preview.response).toContain("Price range: $150 - $800");

    // Verify toolDetails are correctly mapped
    expect(result.schema.request.toolDetails).toBeDefined();
    expect(result.schema.request.toolDetails?._type).toBe("tool");
    expect(result.schema.request.toolDetails?.toolName).toBe("HotelAPI");
    expect(result.schema.request.toolDetails?.input).toEqual(request.input);

    expect(result.schema.response?.toolDetailsResponse).toBeDefined();
    expect(result.schema.response?.toolDetailsResponse?.status).toBe("success");
    expect(result.schema.response?.toolDetailsResponse?._type).toBe("tool");
    expect(result.schema.response?.toolDetailsResponse?.toolName).toBe(
      "HotelAPI"
    );
  });

  it("should handle error responses", () => {
    const request = {
      _type: "tool",
      toolName: "HotelAPI",
      input: {
        destination: "Invalid Location",
      },
    };

    const response = {
      status: "error",
      message: "Invalid destination provided",
      error: {
        code: "INVALID_INPUT",
        details: "Destination not found in our database",
      },
      _type: "tool",
      toolName: "HotelAPI",
    };

    const result = mapTool({
      request,
      response,
      statusCode: 400,
      model: "tool:HotelAPI",
    });

    expect(result.preview.response).toBe("Invalid destination provided");
    expect(result.schema.response?.toolDetailsResponse?.status).toBe("error");
    expect(result.schema.response?.toolDetailsResponse?.message).toBe(
      "Invalid destination provided"
    );
  });

  it("should handle vector DB search results", () => {
    const request = {
      _type: "tool",
      toolName: "VectorDB",
      input: {
        query: "Generate travel tips for New York City",
        database: "travel-tips",
      },
    };

    const response = {
      Operation: "search",
      Text: "Generate travel tips for New York City",
      Database: "travel-tips",
      Filter: { destination: "New York City" },
      failed: true,
      similarity: 0.8,
      actualSimilarity: 0.5,
      _type: "tool",
      toolName: "VectorDB",
    };

    const result = mapTool({
      request,
      response,
      statusCode: 200,
      model: "tool:VectorDB",
    });

    expect(result.preview.response).toContain("Operation: search");
    expect(result.preview.response).toContain("Failed:");
  });

  it("should handle generic tool responses", () => {
    const request = {
      _type: "tool",
      toolName: "WeatherAPI",
      input: {
        location: "New York",
        date: "2024-01-25",
      },
    };

    const response = {
      status: "success",
      temperature: 72,
      conditions: "Sunny",
      humidity: 45,
      _type: "tool",
      toolName: "WeatherAPI",
    };

    const result = mapTool({
      request,
      response,
      statusCode: 200,
      model: "tool:WeatherAPI",
    });

    expect(result.schema.request.model).toBe("tool:WeatherAPI");
    expect(result.preview.request).toContain("Tool: WeatherAPI");
    expect(result.preview.response).toContain("Status: success");
    expect(result.schema.response?.toolDetailsResponse?.status).toBe("success");
  });
});
