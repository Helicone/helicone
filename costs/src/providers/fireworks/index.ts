import { ModelRow } from "../../interfaces/Cost";

export const costs: ModelRow[] = [
  {
    model: {
      operator: "equals",
      value: "mixtral-8x7b-instruct",
    },
    cost: {
      prompt_token: 0.0000005,
      completion_token: 0.0000005,
    },
  },
  {
    model: {
      operator: "equals",
      value: "mixtral-8x22b-instruct",
    },
    cost: {
      prompt_token: 0.0000012,
      completion_token: 0.0000012,
    },
  },
  {
    model: {
      operator: "equals",
      value: "yi-large",
    },
    cost: {
      prompt_token: 0.000003,
      completion_token: 0.000003,
    },
  },
  {
    model: {
      operator: "equals",
      value: "sd3",
    },
    cost: {
      prompt_token: 0.00013,
      completion_token: 0.00013,
    },
  },
  {
    model: {
      operator: "equals",
      value: "sd3-medium",
    },
    cost: {
      prompt_token: 0.00013,
      completion_token: 0.00013,
    },
  },
  {
    model: {
      operator: "equals",
      value: "stable-diffusion-xl-1024-v1-0",
    },
    cost: {
      prompt_token: 0.00013,
      completion_token: 0.00013,
    },
  },
  {
    model: {
      operator: "equals",
      value: "playground-v2-1024px-aesthetic",
    },
    cost: {
      prompt_token: 0.00013,
      completion_token: 0.00013,
    },
  },
  {
    model: {
      operator: "equals",
      value: "playground-v2-5-1024px-aesthetic",
    },
    cost: {
      prompt_token: 0.00013,
      completion_token: 0.00013,
    },
  },
  {
    model: {
      operator: "equals",
      value: "SSD-1B",
    },
    cost: {
      prompt_token: 0.00013,
      completion_token: 0.00013,
    },
  },
  {
    model: {
      operator: "equals",
      value: "japanese-stable-diffusion-xl",
    },
    cost: {
      prompt_token: 0.00013,
      completion_token: 0.00013,
    },
  },
  {
    model: {
      operator: "equals",
      value: "sd3-turbo",
    },
    cost: {
      prompt_token: 0.00013,
      completion_token: 0.00013,
    },
  },
  {
    model: {
      operator: "equals",
      value: "sd3-ControlNet",
    },
    cost: {
      prompt_token: 0.0002,
      completion_token: 0.0002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "sd3-medium-ControlNet",
    },
    cost: {
      prompt_token: 0.0002,
      completion_token: 0.0002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "stable-diffusion-xl-1024-v1-0-ControlNet",
    },
    cost: {
      prompt_token: 0.0002,
      completion_token: 0.0002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "playground-v2-1024px-aesthetic-ControlNet",
    },
    cost: {
      prompt_token: 0.0002,
      completion_token: 0.0002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "playground-v2-5-1024px-aesthetic-ControlNet",
    },
    cost: {
      prompt_token: 0.0002,
      completion_token: 0.0002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "SSD-1B-ControlNet",
    },
    cost: {
      prompt_token: 0.0002,
      completion_token: 0.0002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "japanese-stable-diffusion-xl-ControlNet",
    },
    cost: {
      prompt_token: 0.0002,
      completion_token: 0.0002,
    },
  },
  {
    model: {
      operator: "equals",
      value: "sd3-turbo-ControlNet",
    },
    cost: {
      prompt_token: 0.0002,
      completion_token: 0.0002,
    },
  },
];
