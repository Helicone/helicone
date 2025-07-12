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

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build packages
npm run build
```