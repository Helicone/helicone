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

## Common Issue Patterns in Helicone

Based on recent commit history, watch for these patterns:

### Financial/Billing Issues
- Wallet charging for cached responses
- Escrow handling edge cases
- Cost calculation accuracy
- Pricing model updates

### Performance Issues
- Database query optimization (especially on high-traffic routes)
- Worker efficiency improvements
- Response time optimization
- Memory usage in analytics queries

### Provider Integration Issues
- Model ID accuracy and updates
- Provider capability mapping
- Error handling for provider responses
- Rate limiting and retry logic

### Common Bug Categories
1. **Cache Logic**: Ensure cached responses don't trigger billing
2. **Model Configuration**: Verify model IDs match provider specifications
3. **Error Handling**: Validate user-facing error messages and fallbacks
4. **Analytics Accuracy**: Check data collection doesn't introduce bias
5. **Type Safety**: Ensure TypeScript types prevent runtime errors