import { supabaseServer } from "../db/supabase";
import { Result, ok } from "../shared/result";

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
  // wait 10 seconds for the request to be processed
  let retries = 3;
  while (retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    const putResultInDataset = await supabaseServer.client
      .from("experiment_v2_hypothesis_run")
      .insert({
        dataset_row: datasetRowId,
        result_request_id: requestId,
        experiment_hypothesis: hypothesisId,
      });
    if (putResultInDataset.error) {
      retries--;
      console.error(putResultInDataset.error);
    } else {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }

  return ok("success");
}
