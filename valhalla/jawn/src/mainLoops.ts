import { IS_ON_PREM } from "./lib/experiment/run";
import { deduplicateRequestResponseVersioned } from "./loops/deduplicate";
import { experimentsLoop } from "./loops/experiments";

export interface LoopedSubscriber {
  cronInterval: number;
  onLoop: ({}) => Promise<void>;
}

const mainLoops: LoopedSubscriber[] = [
  {
    cronInterval: 1000, // 1 second
    onLoop: experimentsLoop,
  },
];

if (IS_ON_PREM) {
  mainLoops.push({
    cronInterval: 1000 * 60 * 60, // 1 hour
    onLoop: deduplicateRequestResponseVersioned,
  });
}

const runSingleLoop = async (loop: LoopedSubscriber) => {
  while (true) {
    try {
      await loop.onLoop({});
      await new Promise((resolve) => setTimeout(resolve, loop.cronInterval));
    } catch (e) {
      console.error(e);
    }
  }
};

export const runMainLoops = async () => {
  for (const loop of mainLoops) {
    runSingleLoop(loop);
  }
};

export const runLoopsOnce = async (index: number) => {
  await mainLoops[index].onLoop({});
};
