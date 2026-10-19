import { ModelRow } from "../../interfaces/Cost";

// https://abstract.inc/pricing
export const costs: ModelRow[] = [
  {
    model: {
      operator: "equals",
      value: "glm-5.3:superfast",
    },
    cost: {
      prompt_token: 0.00000119,
      prompt_cache_read_token: 0.00000026,
      completion_token: 0.0000044,
    },
  },
  {
    model: {
      operator: "equals",
      value: "deepseek-v4-flash:superfast",
    },
    cost: {
      prompt_token: 0.0000001,
      prompt_cache_read_token: 0.00000005,
      completion_token: 0.00000025,
    },
  },
  {
    model: {
      operator: "equals",
      value: "kimi-k3:superfast",
    },
    cost: {
      prompt_token: 0.000003,
      prompt_cache_read_token: 0.0000003,
      completion_token: 0.00001275,
    },
  },
];
