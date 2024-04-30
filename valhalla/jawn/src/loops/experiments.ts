import { uuid } from "uuidv4";
import { Database } from "../lib/db/database.types";
import { supabaseServer } from "../lib/db/supabase";
import { dbExecute, dbQueryClickhouse } from "../lib/shared/db/dbExecute";
import { Result } from "../lib/shared/result";
import generateApiKey from "generate-api-key";
import { experimentPop } from "../lib/experiment/dbCalls";
import { run } from "../lib/experiment/run";

export const experimentsLoop = async () => {
  // This is a loop that runs every 1 second
  const experiment = await experimentPop();
  if (experiment.error || !experiment.data) {
    return;
  }
  const experimentResult = await run(experiment.data);
  return;
};
