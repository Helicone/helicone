import { run } from "../lib/experiment/run";
import { ServerExperimentStore } from "../lib/stores/experimentStore";

export const experimentsLoop = async () => {
  // This is a loop that runs every 1 second
  const experiment = await ServerExperimentStore.experimentPop({
    inputs: true,
    promptVersion: true,
  });
  if (experiment.error || !experiment.data) {
    return;
  }

  const experimentResult = await run(experiment.data);
  return;
};
