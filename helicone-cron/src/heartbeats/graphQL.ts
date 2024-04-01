import { Env } from "..";
import { IHeartBeat } from "./IHeartBeat";

export class GraphQLHeartBeat implements IHeartBeat {
  async beat(env: Env): Promise<number> {
    // Define the GraphQL endpoint (replace with your actual endpoint)
    const url = "https://www.helicone.ai/api/graphql";

    // Define the GraphQL query and variables
    const query = `
query ExampleQuery($limit: Int, $offset: Int) {
  heliconeRequest(
      limit: $limit
      offset: $offset
  ) {
      properties{
        name
      }
      responseBody
      response
  }
}
`;

    const PAGE_SIZE = 100;
    const variables = {
      limit: PAGE_SIZE,
      offset: 0,
    };

    // Define headers with Authorization
    const headers = {
      Authorization: `Bearer ${env.HELICONE_API_KEY}`,
      "Content-Type": "application/json",
    };

    // Send the request with headers
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ query, variables }),
    });

    // Check if the request was successful
    if (response.ok) {
      const data = await response.json<any>();
      const requests = data?.data?.heliconeRequest;
      if (requests && requests.length > 0) {
        return 200;
      }
    }

    return 500;
  }
}
