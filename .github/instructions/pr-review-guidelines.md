Review this PR and provide constructive feedback focusing on:
- Critical bugs or security issues (especially billing/financial logic, caching behavior, escrow handling)
- Performance improvements and optimizations (database queries, API responses, worker efficiency)
- Code quality and best practices (TypeScript types, error handling, validation)
- Potential refactoring opportunities
- Breaking changes or API issues
- Provider/model configuration accuracy (model IDs, pricing, capabilities)
- Helicone-specific concerns (observability impact, analytics accuracy, cost tracking)

For each issue found, provide:
1. Clear explanation of the problem
2. Specific suggestions for improvement
3. Code examples when helpful
4. Test scenarios to verify the fix

Use inline comments for specific code suggestions and improvements.
Provide actionable recommendations, not just issue identification.

Pay special attention to:
- Financial logic (billing, escrow, cost calculations)
- Cache behavior and response handling
- LLM provider integrations and model configurations
- Database performance and query optimization
- Error handling and user-facing validation
- Monorepo impacts (web, jawn, worker, ai-gateway components)
- Analytics and observability data accuracy

Provide a confidence score (0-10):
- 0-3: Critical issues, do not merge (billing bugs, security vulnerabilities, data corruption risks)
- 4-5: Significant issues, merge only after fixes (performance problems, major logic flaws)
- 6-7: Minor issues or improvements suggested, merge with consideration
- 8-9: Good to merge with minor suggestions (style improvements, optimization opportunities)
- 10: Excellent, merge immediately (well-tested, follows all best practices)

Summary format:
**Score: X/10** - Brief reason

**Suggestions Summary:**
- List key improvement suggestions
- Highlight any critical fixes needed

## Common Issue Patterns in Helicone (Based on Recent History)

### 🔴 Critical Financial/Billing Issues
**Recent Example**: `fix: don't charge wallet for cached responses (#5380)`
- **Cache + Billing Logic**: Ensure cached responses don't trigger escrow finalization or wallet charges
- **Escrow Handling**: Check `finalizeEscrowAndSyncSpend()` isn't called for cached requests
- **Cost Calculation**: Verify pricing formulas, especially for new providers (Nova models, Nebius)
- **Stripe Integration**: Watch for byte tracking and meter accuracy

### 🟡 Provider Integration & Model Configuration
**Recent Examples**: Nova pricing, Claude Opus 4.5 model ID updates
- **Model ID Accuracy**: Verify `providerModelId` matches exact API specifications (e.g., `claude-opus-4-5-20251101`)
- **Pricing Updates**: Check input/output token costs, prompt caching rates (25% for Nova)
- **Regional Variants**: Support region-prefixed models (eu.*, us.*)
- **Provider Capability Mapping**: Ensure new models have correct capability flags

### 🟢 Performance & Database Optimization
**Recent Examples**: PTB route improvements, request page prefiltering
- **Query Optimization**: Watch for N+1 queries, missing indexes on high-traffic routes
- **Prefiltering**: Reduce database load by filtering before complex operations
- **Worker Efficiency**: AI Gateway route optimization (`AttemptBuilder.ts`)
- **Analytics Performance**: Memory usage in ClickHouse queries

### 🔵 User Experience & Error Handling
**Recent Examples**: Model support warnings, Zod validation improvements
- **Validation Messages**: Add helpful documentation links to error responses
- **User Warnings**: Show clear warnings for unsupported models in playground
- **Error Context**: Improve Zod schema validation error messages with docs links
- **UI Responsiveness**: Chat mode, request drawer improvements

### 🟣 Documentation & Integration Quality
**Recent Examples**: DPSY integration, LiteLLM docs
- **Integration Accuracy**: Verify third-party integration documentation
- **Code Examples**: Ensure integration examples match current API
- **Backward Compatibility**: Check if changes break existing integrations

## Specific Code Patterns to Watch For

### Financial Logic Red Flags
```typescript
// ❌ Bad: Charging for cached responses
if (response) {
  await finalizeEscrowAndSyncSpend(cost, walletId);
}

// ✅ Good: Skip billing for cached responses
if (response && !cachedResponse) {
  await finalizeEscrowAndSyncSpend(cost, walletId);
} else if (cachedResponse) {
  await cancelEscrow(escrowId);
}
```

### Provider Configuration Patterns
```typescript
// ❌ Bad: Hardcoded or incorrect model IDs
providerModelId: "claude-opus-4-5"

// ✅ Good: Exact API model names
providerModelId: "claude-opus-4-5-20251101"

// ✅ Good: Regional support
matches: ["amazon.nova-micro-v1:0", "eu.amazon.nova-micro-v1:0", "us.amazon.nova-micro-v1:0"]
```

### Performance Optimization Patterns
```typescript
// ❌ Bad: Unfiltered database queries
const requests = await database.select("*").from("requests");

// ✅ Good: Prefiltered queries
const requests = await database.select("*").from("requests").where("status", "=", "completed");
```