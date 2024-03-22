# llm-cost

The `src/` directory contains the per-LLM provider costs calculation code. Please help keep this code up to date by submitting PRs when costs change

## How to add new cost data

1. Add new cost data to the `costs/src/` directory. If provider folder exists, add to its index.ts. If not, create a new folder with the provider name and an index.ts and export a cost object

   Example:

   File name: `costs/src/anthropic/index.ts`

   ```typescript
   export const costs: ModelRow[] = [
     {
       model: {
         operator: "equals",
         value: "claude-instant-1",
       },
       cost: {
         prompt_token: 0.00000163,
         completion_token: 0.0000551,
       },
     },
   ];
   ```

   We can match in 3 ways:

   - `equals`: The model name must be exactly the same as the value
   - `startsWith`: The model name must start with the value
   - `includes`: The model name must include the value

   Use what is most appropriate for the model

   cost object is the cost per token for prompt and completion

2. Import the new cost data into `src/index.ts` and add it to the `costs` array

   Example:

   File name: `costs/src/index.ts`

   ```typescript
   import { costs as anthropicCosts } from "./providers/anthropic";

   const costs = [
     ...openaiCosts,
     ...azureCosts,
     ...googleCosts,
     ...fineTunedOpenAICosts,
     ...togetherAIChatCosts,
     ...togetherAIChatLlamaCosts,
     ...togetherAICompletionCosts,
     ...togetherAICompletionLlamaCosts,
     ...cohereCosts,
     ...groqCosts,
     ...anthropicCosts, // Add the new cost data here
   ];
   ```

3. Run `yarn copy` in the `cost/` directory to copy the cost data into other directories
4. Run `yarn test -- -u` in the `cost/` directory to update the snapshot tests
