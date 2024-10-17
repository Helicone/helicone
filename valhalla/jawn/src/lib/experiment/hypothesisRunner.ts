import { supabaseServer } from "../db/supabase";
import { Result, ok, err, mapPostgrestErr } from "../shared/result";

interface RunnerProps {
  url: URL;
  headers: { [key: string]: string };
  body: any;
  requestId: string;
  datasetRowId: string;
}

interface DatabaseOperation {
  execute: () => Promise<Result<unknown, string>>;
  errorMessage: string;
}

async function runWithRetry(
  props: RunnerProps,
  dbOp: DatabaseOperation
): Promise<Result<string, string>> {
  const { url, headers, body, requestId, datasetRowId } = props;
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  });

  if (response.status !== 200) {
    console.error(
      "error running operation",
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

    const result = await dbOp.execute();

    if (!result.error) {
      return ok("success");
    }

    console.error(result.error);

    // Exponential backoff: double the wait time for the next iteration
    waitTime = Math.min(waitTime * 2, maxWaitTime - totalWaitTime);
  }

  // If we've reached this point, all attempts have failed
  return err(dbOp.errorMessage);
}

export async function runHypothesis(
  props: RunnerProps & { hypothesisId: string }
): Promise<Result<string, string>> {
  const { datasetRowId, requestId, hypothesisId } = props;
  const dbOp: DatabaseOperation = {
    execute: async () =>
      mapPostgrestErr(
        await supabaseServer.client
          .from("experiment_v2_hypothesis_run")
          .insert({
            dataset_row: datasetRowId,
            result_request_id: requestId,
            experiment_hypothesis: hypothesisId,
          })
      ),
    errorMessage: "Failed to insert hypothesis run after multiple attempts",
  };
  return runWithRetry(props, dbOp);
}

export async function runOriginalRequest(
  props: RunnerProps & { inputRecordId: string }
): Promise<Result<string, string>> {
  const { requestId, inputRecordId } = props;
  const dbOp: DatabaseOperation = {
    execute: async () =>
      mapPostgrestErr(
        await supabaseServer.client
          .from("prompt_input_record")
          .update({
            source_request: requestId,
          })
          .eq("id", inputRecordId)
      ),
    errorMessage:
      "Failed to update prompt input record after multiple attempts",
  };
  return runWithRetry(props, dbOp);
}
