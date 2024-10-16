import { supabaseServer } from "../db/supabase";
import { Result, ok, err } from "../shared/result";

export async function runHypothesis(props: {
  url: URL;
  headers: { [key: string]: string };
  body: any;
  requestId: string;
  datasetRowId: string;
  hypothesisId: string;
}): Promise<Result<string, string>> {
  const { url, headers, body, requestId, datasetRowId, hypothesisId } = props;
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  });

  if (response.status !== 200) {
    console.error(
      "error running hypothesis",
      hypothesisId,
      datasetRowId,
      requestId,
      response.status
    );
  }

  const maxWaitTime = 10 * 60 * 1000; // 10 minutes in milliseconds
  let waitTime = 1000; // Start with 1 second
  let totalWaitTime = 0;

  while (totalWaitTime < maxWaitTime) {
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    totalWaitTime += waitTime;

    const putResultInDataset = await supabaseServer.client
      .from("experiment_v2_hypothesis_run")
      .insert({
        dataset_row: datasetRowId,
        result_request_id: requestId,
        experiment_hypothesis: hypothesisId,
      });

    if (!putResultInDataset.error) {
      return ok("success");
    }

    console.error(putResultInDataset.error);

    // Exponential backoff: double the wait time for the next iteration
    waitTime = Math.min(waitTime * 2, maxWaitTime - totalWaitTime);
  }

  // If we've reached this point, all attempts have failed
  return err("Failed to insert hypothesis run after multiple attempts");
}
