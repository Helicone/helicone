# Controllers Structure

## Directory Structure
- **`/private`** - Controllers for authenticated private API endpoints
- **`/public`** - Controllers for both authenticated and unauthenticated public API endpoints

## Authentication & Routing

### Route Authentication Rules (in `middleware/auth.ts`):
1. **Routes starting with `/v1/public`** - Bypass authentication entirely (no API key required)
2. **All other routes** - Require API key authentication via `@Security("api_key")`

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
