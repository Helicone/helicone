import { run } from "../lib/experiment/run";
import { ServerExperimentStore } from "../lib/stores/experimentStore";

export const experimentsLoop = async () => {
  // This is a loop that runs every 1 second
  const experiment = await ServerExperimentStore.experimentPop({
    inputs: true,
    promptVersion: true,
  });
  console.log("experiment", experiment);
  if (experiment.error || !experiment.data) {
    return;
  }

  console.log("running experiment", experiment.data.id);
  const experimentResult = await run(experiment.data);
  return;
};
