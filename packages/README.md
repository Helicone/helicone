# Helicone Packages

This directory contains shared packages used across the Helicone ecosystem.

## Packages

### 🏷️ Cost Package
**Add pricing support for LLM models and providers**

The cost package handles pricing calculations for all supported AI/ML providers in Helicone.

**[📖 Click here to add cost support for new models →](./cost/README.md)**

Common tasks:
- Add pricing for new models (GPT-5, Claude 4, etc.)
- Add support for new providers 
- Update existing model pricing
- Add cost types (images, audio, per-call fees)

### 🗺️ LLM Mapper
Request/response mapping and transformation for different LLM providers.

### 🔍 Filters  
Filtering definitions and utilities for request/response data.

### 💬 Prompts
Prompt templates and management utilities.

## Contributing

Each package contains its own documentation. See individual README files for contribution guidelines.

### Quick Links
- **[Cost Package Documentation](./cost/README.md)** - Add model pricing support
- **Test Directory** - Package tests in `__tests__/`

## Development

### Running Tests

Tests are located in `__tests__/` directory and use Jest:

```bash
# Run all package tests
npx jest

# Run specific test file
npx jest __tests__/cost/registrySnapshots.test.ts

# Update snapshots after intentional changes
npx jest -u

# Run tests without cache (useful for debugging)
npx jest --no-cache
```

#### Key Test Files
- `__tests__/cost/ensureOnlyOne.test.ts` - Validates no duplicate models and cost calculations
- `__tests__/cost/registrySnapshots.test.ts` - Snapshot tests for model registry (pricing, coverage, configs)
- `__tests__/llm-mapper/` - Tests for request/response mapping

### Building

```bash
# Build packages
npm run build
```