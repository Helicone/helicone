import { ModelRow } from "../../interfaces/Cost";

export const costs: ModelRow[] = [
  {
    model: {
      operator: "equals",
      value: "black-forest-labs/flux-schnell",
    },
    cost: {
      prompt_token: 0,
      completion_token: 0,
      per_image: 0.0013,
    },
  },
  {
    model: {
      operator: "equals",
      value: "black-forest-labs/flux-dev",
    },
    cost: {
      prompt_token: 0,
      completion_token: 0,
      per_image: 0.007,
    },
  },
  {
    model: {
      operator: "equals",
      value: "stability-ai/sdxl",
    },
    cost: {
      prompt_token: 0,
      completion_token: 0,
      per_image: 0.003,
    },
  },
];
