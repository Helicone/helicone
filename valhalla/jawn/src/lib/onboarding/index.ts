import { OpenAI } from "openai";
import { v4 as uuid } from "uuid";
import { hpf } from "@helicone/prompts";
import { HeliconeManualLogger } from "@helicone/helpers";
import { examples } from "./travelExamples";
import { OPENAI_KEY } from "../clients/constant";
import { hotels, flights } from "./onboardingVariables";

async function findAndBookFlight(
  heliconeLogger: HeliconeManualLogger,
  openai: OpenAI,
  travelPlan: any,
  sessionId: string,
  userId: string
) {
  const flightSearch = await heliconeLogger.logRequest(
    {
      _type: "tool",
      toolName: "FlightAPI",
      input: {
        origin: "SFO",
        destination: travelPlan.destination,
        departDate: travelPlan.startDate,
        returnDate: travelPlan.endDate,
        passengers: 2,
        cabinClass: "economy",
      },
    },
    async (resultRecorder) => {
      resultRecorder.appendResults({
        status: "success",
        flights,
        filters: {
          airlines: ["United", "Delta", "American"],
          stops: [0, 1, 2],
          priceRange: { min: 500, max: 1500 },
        },
      });
      return { flights };
    },
    {
      "Helicone-Property-Environment": "development",
      "Helicone-Session-Name": "XPedia Travel Planner",
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": `/booking/flight/search`,
      "Helicone-User-Id": userId,
    }
  );

  // Use LLM to select the best flight (for show)
  const prompt = hpf`As a travel expert, select the most suitable flight for this trip. Consider the duration, price, and amenities.

  Travel Plan:
  ${{
    travelPlan: JSON.stringify(travelPlan),
    availableFlights: JSON.stringify(flights),
  }}

  YOUR OUTPUT SHOULD BE IN THE FOLLOWING FORMAT:
  {
    "selectedFlightId": string,
    "cabinClass": string,
    "reasoningPoints": string[],
    "alternativeId": string
  }`;

  const requestId = uuid();
  const flightSelection = await openai.chat.completions.create(
    {
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Prompt-Id": "select-flight",
        "Helicone-Session-Name": "XPedia Travel Planner",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/booking/flight/selection`,
        "Helicone-User-Id": userId,
      },
    }
  );

  // Ignore LLM's choice and use our predetermined selection
  const selection = {
    selectedFlightId: "FL_123456", // United Airlines
    cabinClass: "Economy",
    reasoningPoints:
      JSON.parse(flightSelection.choices[0].message.content || "{}")
        .reasoningPoints || [],
  };

  // Use our hardcoded selection for the booking
  const booking = await heliconeLogger.logRequest(
    {
      _type: "tool",
      toolName: "FlightBookingAPI",
      input: {
        flightId: selection.selectedFlightId,
        cabinClass: selection.cabinClass,
        passengers: 2,
        departDate: travelPlan.startDate,
        returnDate: travelPlan.endDate,
      },
    },
    async (resultRecorder) => {
      resultRecorder.appendResults({
        status: "success",
        booking: {
          bookingId: "BK" + Date.now(),
          confirmationNumber:
            "XPED" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          flight: {
            id: "FL_123456",
            outbound: {
              flightNumber: "UA456",
              airline: "United Airlines",
              departure: { airport: "SFO", time: "10:30" },
              arrival: { airport: "JFK", time: "19:00" },
              duration: "8h 30m",
              stops: 0,
              aircraft: "Boeing 787-9",
            },
            return: {
              flightNumber: "UA457",
              airline: "United Airlines",
              departure: { airport: "JFK", time: "11:30" },
              arrival: { airport: "SFO", time: "14:45" },
              duration: "6h 15m",
              stops: 0,
              aircraft: "Boeing 787-9",
            },
            price: {
              total: 842,
              currency: "USD",
              breakdown: {
                base: 720,
                taxes: 122,
                fees: 0,
              },
            },
            seatsAvailable: 4,
            cabinClass: "Economy",
            features: ["Meal", "WiFi", "Power outlets", "Entertainment"],
          },
          stay: {
            checkIn: travelPlan.startDate,
            checkOut: travelPlan.endDate,
            checkInTime: "15:00",
            checkOutTime: "11:00",
            nightsCount: 3,
            guestCount: 2,
          },
          payment: {
            total: 897,
            currency: "USD",
            breakdown: {
              roomRate: 299,
              taxesAndFees: 89.7,
              total: 897,
            },
            paid: true,
            method: "Credit Card (ending in 1234)",
          },
          amenities: [
            "Free WiFi",
            "Breakfast included",
            "Access to spa and fitness center",
            "Welcome drink",
          ],
          cancellation: {
            freeCancellationUntil: "2024-03-20T23:59:59Z",
            policy: "Free cancellation until 3 days before check-in",
          },
        },
      });
    },
    {
      "Helicone-Property-Environment": "development",
      "Helicone-Session-Name": "XPedia Travel Planner",
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": `/booking/flight/confirm`,
      "Helicone-User-Id": userId,
    }
  );

  return booking;
}

async function findAndBookHotel(
  heliconeLogger: HeliconeManualLogger,
  openai: OpenAI,
  travelPlan: any,
  sessionId: string,
  userId: string
) {
  const hotelSearch = await heliconeLogger.logRequest(
    {
      _type: "tool",
      toolName: "HotelAPI",
      input: {
        destination: travelPlan.destination,
        checkIn: travelPlan.startDate,
        checkOut: travelPlan.endDate,
        guests: 2,
        rooms: 1,
      },
    },
    async (resultRecorder) => {
      resultRecorder.appendResults({
        status: "success",
        hotels,
        filters: {
          priceRange: { min: 150, max: 800 },
          neighborhoods: ["City Center", "Historic District", "Waterfront"],
          amenities: ["Pool", "Spa", "WiFi", "Parking", "Restaurant"],
        },
      });
    },
    {
      "Helicone-Property-Environment": "development",
      "Helicone-Session-Name": "XPedia Travel Planner",
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": `/booking/hotel/search`,
      "Helicone-User-Id": userId,
    }
  );

  // Use LLM to select the best hotel (for show)
  const prompt = hpf`As a travel expert, select the most suitable hotel for this trip. Consider the location, amenities, and value for money.

  Travel Plan:
  ${{
    travelPlan: JSON.stringify(travelPlan),
    availableHotels: JSON.stringify(hotels),
  }}

  YOUR OUTPUT SHOULD BE IN THE FOLLOWING FORMAT:
  {
    "selectedHotelId": string,
    "roomType": string,
    "reasoningPoints": string[],
    "alternativeId": string
  }`;

  const requestId = uuid();
  const hotelSelection = await openai.chat.completions.create(
    {
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Prompt-Id": "select-hotel",
        "Helicone-Session-Name": "XPedia Travel Planner",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/booking/hotel/selection`,
        "Helicone-User-Id": userId,
      },
    }
  );

  // Ignore LLM's choice and use our predetermined selection
  const selection = {
    selectedHotelId: "HTL_123456", // Grand Plaza Hotel
    roomType: "Deluxe King",
    reasoningPoints:
      JSON.parse(hotelSelection.choices[0].message.content || "{}")
        .reasoningPoints || [],
  };

  // Use our hardcoded selection for the booking
  const booking = await heliconeLogger.logRequest(
    {
      _type: "tool",
      toolName: "HotelBookingAPI",
      input: {
        hotelId: selection.selectedHotelId,
        roomType: selection.roomType,
        guests: 2,
        checkIn: travelPlan.startDate,
        checkOut: travelPlan.endDate,
      },
    },
    async (resultRecorder) => {
      resultRecorder.appendResults({
        status: "success",
        booking: {
          bookingId: "BK" + Date.now(),
          confirmationNumber:
            "XPED" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          hotel: {
            name: "Grand Plaza Hotel",
            address: "123 Main Street",
            phone: "+1-555-0123",
            email: "reservations@grandplaza.example.com",
          },
          room: {
            type: "Deluxe King",
            bedType: "1 King Bed",
            floor: 15,
            roomNumber: "1507",
            specialRequests: "High floor, away from elevator",
          },
          stay: {
            checkIn: travelPlan.startDate,
            checkOut: travelPlan.endDate,
            checkInTime: "15:00",
            checkOutTime: "11:00",
            nightsCount: 3,
            guestCount: 2,
          },
          payment: {
            total: 897,
            currency: "USD",
            breakdown: {
              roomRate: 299,
              taxesAndFees: 89.7,
              total: 897,
            },
            paid: true,
            method: "Credit Card (ending in 1234)",
          },
          amenities: [
            "Free WiFi",
            "Breakfast included",
            "Access to spa and fitness center",
            "Welcome drink",
          ],
          cancellation: {
            freeCancellationUntil: "2024-03-20T23:59:59Z",
            policy: "Free cancellation until 3 days before check-in",
          },
        },
      });
    },
    {
      "Helicone-Property-Environment": "development",
      "Helicone-Session-Name": "XPedia Travel Planner",
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": `/booking/hotel/confirm`,
      "Helicone-User-Id": userId,
    }
  );

  return booking;
}

async function getUsersTravelPlan(
  openai: OpenAI,
  example: (typeof examples)[0],
  sessionId: string
) {
  const prompt = hpf`As a travel planner, extract the user's travel plans from their request.

  ${{
    userMessage: JSON.stringify(example.userMessage),
  }}

  YOUR OUTPUT SHOULD BE IN THE FOLLOWING FORMAT:
  {
    "destination": string,
    "startDate": string,
    "endDate": string,
    "activities": string[]
  }`;

  const requestId = uuid();
  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Property-Member": "john.smith@example.com",
        "Helicone-Prompt-Id": "extract-travel-plan",
        "Helicone-Session-Name": "XPedia Travel Planner",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/planning/extract-travel-plan`,
        "Helicone-User-Id": example.userId,
      },
    }
  );

  try {
    const result = JSON.parse(
      chatCompletion.choices[0].message.content || "{}"
    );
    return result;
  } catch (e) {
    console.error(e);
    return {};
  }
}

async function getTravelTips(
  openai: OpenAI,
  heliconeLogger: HeliconeManualLogger,
  example: (typeof examples)[0],
  sessionId: string,
  travelPlan: any
) {
  const destination = travelPlan?.destination || "unknown";

  const res = await heliconeLogger.logRequest(
    {
      _type: "vector_db",
      operation: "search",
      text: `Generate travel tips for ${destination}`,
      vector: [0.1, 0.2, 0.3, 0.4],
      topK: 5,
      filter: destination !== "unknown" ? { destination } : {},
      databaseName: "travel-tips",
      query: JSON.stringify({
        ...travelPlan,
        destination_parsed: destination !== "unknown",
      }),
    },
    async (resultRecorder) => {
      resultRecorder.appendResults({
        status: "failed",
        message: `No travel tips found with sufficient similarity for ${destination}`,
        similarityThreshold: 0.8,
        actualSimilarity: 0.5,
        metadata: {
          destination,
          destination_parsed: destination !== "unknown",
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      "Helicone-Property-Environment": "development",
      "Helicone-Session-Name": "XPedia Travel Planner",
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": `/planning/tips/vector-db`,
      "Helicone-User-Id": example.userId,
    }
  );

  const res2 = await heliconeLogger.logRequest(
    {
      _type: "tool",
      toolName: "TravelTipsAPI",
      input: {
        destination: travelPlan?.destination || "unknown",
        startDate: travelPlan?.startDate || "unknown",
        endDate: travelPlan?.endDate || "unknown",
        activities: Array.isArray(travelPlan?.activities)
          ? travelPlan.activities
          : ["general sightseeing"],
      },
      apiVersion: "v1",
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
    async (resultRecorder) => {
      // Simulate a successful tool call
      resultRecorder.appendResults({
        status: "success",
        message: `Successfully retrieved travel tips for ${
          travelPlan?.destination || "unknown"
        }`,
        tips: [
          "Visit the local museum",
          "Try the famous street food",
          "Explore the historic district",
        ],
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      "Helicone-Property-Environment": "development",
      "Helicone-Session-Name": "XPedia Travel Planner",
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": `/planning/tips/api-call`,
      "Helicone-User-Id": example.userId,
    }
  );

  const prompt = hpf`As a travel planner, generate travel tips based on the user's travel plans.

  ${{
    travelPlan: JSON.stringify(travelPlan),
  }}

  YOUR OUTPUT SHOULD BE IN THE FOLLOWING FORMAT:
  {
    "tips": string[]
  }`;

  const requestId = uuid();
  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Property-Member": "john.smith@example.com",
        "Helicone-Prompt-Id": "generate-travel-tips",
        "Helicone-Session-Name": "XPedia Travel Planner",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/planning/tips/generation`,
        "Helicone-User-Id": example.userId,
      },
    }
  );

  try {
    const result = JSON.parse(
      chatCompletion.choices[0].message.content || "{}"
    );
    return result;
  } catch (e) {
    console.error(e);
    return {};
  }
}

async function getDestinationWeather(
  heliconeLogger: HeliconeManualLogger,
  destination: string,
  startDate: string,
  endDate: string,
  sessionId: string,
  userId: string
) {
  const res = await heliconeLogger.logRequest(
    {
      _type: "tool",
      toolName: "WeatherAPI",
      input: {
        destination,
        startDate,
        endDate,
      },
      apiVersion: "v1",
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
    async (resultRecorder) => {
      // Simulate weather API response
      resultRecorder.appendResults({
        status: "success",
        forecast: {
          averageTemp: 22,
          conditions: "Mostly sunny",
          precipitation: "20% chance of rain",
          humidity: "Medium",
          seasonalNotes: "Peak tourist season",
        },
        metadata: {
          destination,
          dateRange: `${startDate} to ${endDate}`,
        },
      });
    },
    {
      "Helicone-Property-Environment": "development",
      "Helicone-Session-Name": "XPedia Travel Planner",
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": `/planning/packing/weather`,
      "Helicone-User-Id": userId,
    }
  );

  return res;
}

async function generatePackingList(
  openai: OpenAI,
  heliconeLogger: HeliconeManualLogger,
  example: (typeof examples)[0],
  sessionId: string,
  travelPlan: any,
  weatherData: any
) {
  const prompt = hpf`As a travel expert, generate a comprehensive packing list based on the destination, planned activities, and weather conditions.

  ${{
    travelPlan: JSON.stringify(travelPlan),
    weather: JSON.stringify(weatherData),
  }}

  YOUR OUTPUT SHOULD BE IN THE FOLLOWING FORMAT:
  {
    "essentials": string[],
    "clothing": string[],
    "electronics": string[],
    "toiletries": string[],
    "activitySpecific": Record<string, string[]>,
    "weatherConsiderations": string[],
    "documentsAndMoney": string[]
  }`;

  const requestId = uuid();
  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Prompt-Id": "generate-packing-list",
        "Helicone-Session-Name": "XPedia Travel Planner",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/planning/packing/list`,
        "Helicone-User-Id": example.userId,
      },
    }
  );

  try {
    const result = JSON.parse(
      chatCompletion.choices[0].message.content || "{}"
    );
    return result;
  } catch (e) {
    console.error(e);
    return {};
  }
}

async function processExample(
  openai: OpenAI,
  heliconeLogger: HeliconeManualLogger,
  example: (typeof examples)[0],
  sessionId: string
) {
  const travelPlan = await getUsersTravelPlan(openai, example, sessionId);

  // Get weather data first
  const weatherData = await getDestinationWeather(
    heliconeLogger,
    travelPlan.destination || "unknown",
    travelPlan.startDate || "unknown",
    travelPlan.endDate || "unknown",
    sessionId,
    example.userId
  );

  // Run these in parallel
  const [tips, packingList, flightBooking, hotelBooking] = await Promise.all([
    getTravelTips(openai, heliconeLogger, example, sessionId, travelPlan),
    generatePackingList(
      openai,
      heliconeLogger,
      example,
      sessionId,
      travelPlan,
      weatherData
    ),
    findAndBookFlight(
      heliconeLogger,
      openai,
      travelPlan,
      sessionId,
      example.userId
    ),
    findAndBookHotel(
      heliconeLogger,
      openai,
      travelPlan,
      sessionId,
      example.userId
    ),
  ]);

  return {
    travelPlan,
    tips,
    weatherData,
    packingList,
    flightBooking,
    hotelBooking,
  };
}

export async function setupDemoOrganizationRequests({
  heliconeApiKey,
}: {
  heliconeApiKey: string;
}) {
  const heliconeWorkerUrl = process.env.HELICONE_WORKER_URL
    ? process.env.HELICONE_WORKER_URL + "/v1"
    : "http://localhost:8787/v1";

  // const openai = new OpenAI({
  //   apiKey: OPENAI_KEY,
  //   baseURL: heliconeWorkerUrl,
  //   defaultHeaders: {
  //     "Helicone-Auth": `Bearer ${heliconeApiKey}`,
  //   },
  // });

  const openai = new OpenAI({
    apiKey: OPENAI_KEY,
    baseURL: heliconeWorkerUrl,
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${heliconeApiKey}`,
    },
  });

  const heliconeLogger = new HeliconeManualLogger({
    apiKey: heliconeApiKey,
    loggingEndpoint: `${
      process.env.HELICONE_API_WORKER_URL ?? "https://api.worker.helicone.ai"
    }/custom/v1/log`,
  });

  for (const example of examples) {
    const sessionId = uuid();
    const { travelPlan, tips } = await processExample(
      openai,
      heliconeLogger,
      example,
      sessionId
    );
  }
}
