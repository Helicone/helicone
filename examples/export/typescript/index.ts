import axios, { all } from "axios";

import { HeliconeAPIClient } from "@helicone/helicone";

const HELICONE_API_KEY = process.env.HELICONE_API_KEY;
if (!HELICONE_API_KEY) {
  throw new Error("HELICONE_API_KEY is not set");
}
const heliconeClient = new HeliconeAPIClient({
  apiKey: HELICONE_API_KEY,
});

function makeRequest(startTime: string, endTime: string, offset: number) {
  return heliconeClient.rawClient.POST("/v1/request/query", {
    body: {
      filter: {
        left: {
          request: {
            created_at: {
              gte: startTime,
            },
          },
        },
        right: {
          request: {
            created_at: {
              lt: endTime,
            },
          },
        },
        operator: "and",
      },
      isCached: false,
      limit: 100, // Increase limit to get more data per request
      offset,
      sort: { created_at: "asc" },
    },
  });
}

type Unpromise<T> = T extends Promise<infer U> ? U : T;
type NotUndefined<T> = T extends undefined ? never : T;
type NotNull<T> = T extends null ? never : T;

type ResponseData = NotNull<
  NotUndefined<Unpromise<ReturnType<typeof makeRequest>>["data"]>["data"]
>;

async function fetchSignedBodyAsync(url: string): Promise<Record<string, any>> {
  if (!url) {
    return {};
  }

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (e) {
    console.log(`Failed to fetch signed body for ${url}: ${e}`);
    return {};
  }

  // return response.data;
}

async function fetchAllSignedBodies(data: ResponseData): Promise<void> {
  const tasks = data.map((d) => fetchSignedBodyAsync(d.signed_body_url ?? ""));
  for (const [index, task] of tasks.entries()) {
    try {
      (data[index] as any).signed_body_content = await task;
    } catch (e) {
      console.log(
        `Failed to fetch or decode signed_body_url for response_id ${data[index].response_id}: ${e}`
      );
    }
  }
}

async function getAllData(
  startTime: string,
  endTime: string,
  stepHours: number
): Promise<ResponseData> {
  const allData: ResponseData = [];
  let currentTime = new Date(endTime);
  let startTimeDate = new Date(startTime);
  let nextTime = new Date(startTimeDate.getTime() + stepHours * 60 * 60 * 1000);
  if (nextTime > currentTime) {
    nextTime = currentTime;
  }

  while (startTimeDate < currentTime) {
    console.log(
      `Fetching data from ${startTimeDate} to ${nextTime}: ${allData.length} records fetched so far`
    );
    let offset = 0;
    while (true) {
      const apiResponse = await makeRequest(
        startTimeDate.toISOString(),
        nextTime.toISOString(),
        offset
      );
      if (!apiResponse.response.ok) {
        throw new Error(
          `Failed to fetch data: ${JSON.stringify(apiResponse.error)}`
        );
      }

      console.log(`fetching ${apiResponse.data?.data?.length} bodies`);
      if (
        !apiResponse ||
        !apiResponse.data?.data ||
        apiResponse.data?.data?.length === 0
      ) {
        console.log("No more data to fetch - going next");
        break;
      }

      let retries = 3;
      while (retries > 0) {
        try {
          if (retries < 3 || apiResponse.error) {
            await makeRequest(
              startTimeDate.toISOString(),
              nextTime.toISOString(),
              offset
            );
          }
          await fetchAllSignedBodies(apiResponse.data.data);
          allData.push(...apiResponse.data.data);
          break;
        } catch (e) {
          console.log(
            `Failed to fetch signed bodies: ${e}, retrying ${retries} more times`
          );
          retries -= 1;
        }
      }

      offset += 100; // Increment offset to paginate through results
    }

    startTimeDate = nextTime;
    nextTime = new Date(startTimeDate.getTime() + stepHours * 60 * 60 * 1000);
    if (nextTime > currentTime) {
      nextTime = currentTime;
    }
  }

  return allData;
}

// Example usage
const start_time_input = "2024-05-10 07:00:00";
const end_time_input = "2024-05-12 00:00:00";
const step_hours = 1; // Configurable step size in hours
getAllData(start_time_input, end_time_input, step_hours)
  .then((allData) => {
    console.log(allData);
    console.log("Data written to output.xlsx");
  })
  .catch((err) => console.error(err));
