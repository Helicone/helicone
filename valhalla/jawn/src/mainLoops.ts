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

const runSingleLoop = async (loop: LoopedSubscriber) => {
  while (true) {
    await loop.onLoop({});
    await new Promise((resolve) => setTimeout(resolve, loop.cronInterval));
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
