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

2. Import the new cost data into `src/providers/mappings.ts` and add it to the `providers` array

   Example:

   File name: `src/providers/mappings.ts`

   ```typescript
   import { costs as anthropicCosts } from "./providers/anthropic";

   // 1. Add the pattern for the API so it is a valid gateway.
   const anthropicPattern = /^https:\/\/api\.anthropic\.com/;

   // 2. Add Anthropic pattern, provider tag, and costs array from the generated list
   export const providers: {
     pattern: RegExp;
     provider: string;
     costs?: ModelRow[];
   }[] = [
     // ...
     {
       pattern: anthropicPattern,
       provider: "ANTHROPIC",
       costs: anthropicCosts,
     },
     // ...
   ];
   ```

3. Run `yarn test -- -u` in the `cost/` directory to update the snapshot tests
4. Run `yarn copy-cost` in the `cost/` directory to copy the cost data into other directories
