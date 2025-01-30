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
    expect(result.schema.request.messages?.[0].content).toBe(
      "Tool operation: HotelAPI"
    );
    expect(result.preview.request).toContain("Tool: HotelAPI");
    expect(result.preview.response).toContain("Found 2 hotels");
    expect(result.preview.response).toContain("Price range: $150 - $800");
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
    expect(result.schema.response?.messages?.[0].content).toBe(
      "Invalid destination provided"
    );
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
  });
});
