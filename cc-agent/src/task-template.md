# Task: [Short Task Name]

## Objective

[Clear, concise description of what needs to be accomplished]

## Background

[Optional: Any context, related issues, or background information needed]

## Steps

1. [First major step]
2. [Second major step]
3. [Third major step]
   - [Sub-step if needed]
   - [Another sub-step]

## Acceptance Criteria

- [ ] [Specific, measurable criterion 1]
- [ ] [Specific, measurable criterion 2]
- [ ] [Specific, measurable criterion 3]
- [ ] All relevant tests pass
- [ ] Code builds successfully
- [ ] Changes have been manually tested

## Expected Outcome

[Description of what success looks like]

## Notes

[Any additional notes, warnings, or considerations]

---

## Example Task Templates

### Example 1: Bug Fix

```markdown
# Task: Fix Authentication Timeout Bug

## Objective
Fix the bug where users are logged out after 5 minutes instead of the configured 24-hour session timeout.

## Background
Issue reported in GitHub issue #123. Users are experiencing unexpected logouts.

## Steps
1. Investigate session management code in /valhalla/jawn/src/lib/auth
2. Check Better Auth configuration for session expiry settings
3. Identify the root cause of premature session expiration
4. Implement fix
5. Test with multiple browsers and scenarios

## Acceptance Criteria
- [ ] Users can stay logged in for 24 hours without activity
- [ ] Session refresh works correctly on activity
- [ ] No console errors related to authentication
- [ ] Manual testing confirms fix across Chrome, Firefox, Safari
- [ ] Existing auth tests still pass

## Expected Outcome
Users should be able to stay logged in for the configured 24-hour period.
```

### Example 2: Feature Implementation

```markdown
# Task: Add CSV Export to Dashboard

## Objective
Implement CSV export functionality for the requests table on the dashboard.

## Background
Users have requested the ability to export their request data as CSV files for offline analysis.

## Steps
1. Create export button in UI (web/components/templates/requests/RequestsTable.tsx)
2. Implement backend API endpoint for CSV generation (valhalla/jawn/src/controllers/requests)
3. Add CSV formatting logic
4. Handle large datasets with streaming/pagination
5. Add loading states and error handling
6. Write tests for CSV generation

## Acceptance Criteria
- [ ] Export button appears in requests table header
- [ ] Clicking export downloads a properly formatted CSV file
- [ ] CSV includes all visible columns
- [ ] Export works for datasets with 1000+ rows
- [ ] Loading indicator shown during export
- [ ] Error messages shown if export fails
- [ ] Unit tests for CSV generation pass
- [ ] Manual testing with various filters/date ranges works

## Expected Outcome
Users can click an export button and download their request data as a CSV file with all relevant fields.
```

### Example 3: Testing Task

```markdown
# Task: Run and Verify E2E Test Suite

## Objective
Execute the E2E test suite and ensure all tests pass.

## Steps
1. Start required services (workers, jawn, web)
2. Run E2E tests: `npm run test:e2e`
3. Investigate any failures
4. Fix or document any issues found

## Acceptance Criteria
- [ ] All services start successfully
- [ ] E2E test suite runs to completion
- [ ] All tests pass (or failures are documented)
- [ ] Screenshots captured for any failures
- [ ] Test execution time is under 10 minutes

## Expected Outcome
E2E test suite passes completely with all green checks.
```

### Example 4: Infrastructure Task

```markdown
# Task: Optimize Database Queries for Dashboard Load Time

## Objective
Reduce dashboard initial load time from 5s to under 2s by optimizing database queries.

## Background
Users are experiencing slow dashboard loads. Profiling shows the issue is database query performance.

## Steps
1. Profile current queries using explain analyze
2. Identify N+1 query problems
3. Add appropriate database indexes
4. Implement query batching/caching where applicable
5. Add database query monitoring
6. Measure improvements

## Acceptance Criteria
- [ ] Dashboard loads in under 2 seconds
- [ ] All new indexes are added to migrations
- [ ] Query count reduced by at least 50%
- [ ] No regressions in functionality
- [ ] Performance metrics captured before/after

## Expected Outcome
Dashboard loads significantly faster with optimized queries and proper indexes.
```
