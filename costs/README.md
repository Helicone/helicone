# llm-cost

The `src/` directory contains the per-LLM provider costs calculation code. Please help keep this code up to date by submitting PRs when costs change

## Usage

1. Add new cost data to the `src/` directory
2. Import the new cost data into `src/index.ts`
3. Run `yarn copy` to copy the cost data into other directories
4. Run `yarn test -- -u` to update the snapshot tests
