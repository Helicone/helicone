# Adding New Trusted Domains to Helicone

This guide explains how to add a new trusted domain/provider to Helicone's cost tracking system.

## Overview

Trusted domains are API providers that Helicone recognizes and can track costs for. Each provider needs:
1. A URL pattern to match their API endpoints
2. A provider name constant
3. Provider configuration with optional cost data

## Step-by-Step Process

### 1. Add URL Pattern

In `worker/src/packages/cost/providers/mappings.ts`, add a regex pattern for the provider's API:

```typescript
// api.newprovider.com
const newProvider = /^https:\/\/api\.newprovider\.com/;
```

### 2. Add Provider Name

Add the provider name to the `providersNames` array:

```typescript
export const providersNames = [
  // ... existing providers
  "NEWPROVIDER",
] as const;
```

### 3. Add Provider Configuration

Add the provider to the `providers` array:

```typescript
{
  pattern: newProvider,
  provider: "NEWPROVIDER",
  costs: [], // Empty array if no cost data yet
},
```

### 4. Optional: Add Cost Data

If you have cost information, create a provider file and import it:

```typescript
// In mappings.ts
import { costs as newProviderCosts } from "./newprovider";

// In the providers array
{
  pattern: newProvider,
  provider: "NEWPROVIDER",
  costs: newProviderCosts,
},
```

## Example: OpenPipe Addition (PR #4062)

Here's how OpenPipe was added:

```typescript
// 1. URL pattern
const openpipe = /^https:\/\/api\.openpipe\.ai/;

// 2. Provider name in array
"OPENPIPE",

// 3. Provider configuration
{
  pattern: openpipe,
  provider: "OPENPIPE",
  costs: [],
},
```

## File Locations

- **Main mappings**: `worker/src/packages/cost/providers/mappings.ts`
- **Provider costs**: `worker/src/packages/cost/providers/[provider-name]/index.ts`

## URL Pattern Guidelines

- Use `^https:\/\/` prefix for security
- Escape dots with `\.`
- End with `\/` or appropriate path pattern
- Examples:
  - `^https:\/\/api\.provider\.com/` - Exact API subdomain
  - `^https:\/\/(.*\.)?provider\.com/` - Any subdomain of provider.com
  - `^https:\/\/provider\.com\/api/` - Specific API path

## Security Considerations

- Only add trusted, legitimate AI/ML service providers
- Verify the domain belongs to the intended company
- Use HTTPS patterns only (`^https:\/\/`)
- Be specific with URL patterns to avoid overly broad matching

## Testing

After adding a trusted domain:

1. Verify the regex pattern matches expected URLs
2. Check that the provider appears in allowed domains
3. Test API requests to ensure they're properly categorized
4. If costs are added, verify cost calculations work correctly

## Notes

- The `approvedDomains` array is automatically generated from provider patterns
- Provider names should be uppercase constants
- Empty `costs: []` is acceptable for providers without cost tracking
- Order in the arrays doesn't matter functionally but keep it organized