# Controllers Structure

## Directory Structure
The private/public folders only represent was is generated for docs

- **`/private`** - Will not be in the public docs
- **`/public`** - Will be in the docs

## Authentication & Routing

### Route Authentication Rules (in `middleware/auth.ts`):
1. **Routes starting with `/v1/public`** - Bypass authentication entirely (no API key required)
2. **All other routes** - Require API key authentication by default (see middleware.ts). The `@Security("api_key")` was never implemented properly. We willimplement this properly in the future

### Documentation Generation:
- **`/private`** controllers - No auto-generated docs (internal/admin use)
- **`/public`** controllers - Full auto-generated documentation

### Examples:

**Public Controllers:**
- Can use routes like `@Route("v1/experiment")` - Requires authentication
- Can use routes like `@Route("/v1/public/model-registry")` - No authentication required

**Private Controllers:**  
- Use routes like `@Route("v1/admin")` - Requires authentication + admin privileges
- Generally for internal/admin functionality

The key distinction is the **route path**, not the directory. Routes containing `/v1/public` skip authentication, while all others require it.
