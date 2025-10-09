# Helicone E2E Tests

End-to-end integration tests for the Helicone AI Gateway.

## Getting Started (running locally)

### 1. Install Dependencies

```bash
cd e2e
yarn install
```

### 2. Start the Gateway

From the root of the Helicone project:

```bash
cd worker
npx wrangler dev --var WORKER_TYPE:AI_GATEWAY_API --port 8793 --test-scheduled
npx wrangler dev --var WORKER_TYPE:HELICONE_API --port 8788 --inspector-port=9240
```

Or use the convenience script:

```bash
./worker/run_all_workers.sh
```

make sure to run jawn too.

### 3. Run Tests

```bash
# Run all tests
yarn test
```

That's it!!

## Debugging CI

If you want to debug a test that is failing on github actions, do not use `act`. `act` will use a network bridge that will fuck shit up, so just debug stuff on bare metal or push a branch that starts with `ci/*` to experiment with. it sucks and is slow, but ideally you will not have to fuck with it too much.
