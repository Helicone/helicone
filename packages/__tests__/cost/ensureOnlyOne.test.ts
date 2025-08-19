import { expect, test } from "@jest/globals";

import { openAIProvider } from "../../cost/providers/openai";

test("check that there are no two models that are the same", () => {
  openAIProvider.costs.forEach((cost) => {
    const model = cost.model.value;
    const modelCount = openAIProvider.costs.filter(
      (c) => c.model.value === model
    ).length;
    expect(modelCount).toBe(1);
  });
});