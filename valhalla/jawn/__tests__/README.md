# Annotation System Tests

This directory contains unit and integration tests for the annotation system.

## Test Structure

### Unit Tests

- `__tests__/managers/AnnotationManager.test.ts` - Unit tests for the AnnotationManager business logic
  - Tests dataset validation
  - Tests A/B annotation creation and updates
  - Tests access control
  - Mocks all external dependencies

### Integration Tests

- `__tests__/controllers/annotationController.test.ts` - Integration tests for the annotation API endpoints
  - Tests all REST endpoints
  - Requires a running server on port 8585
  - Uses real HTTP requests

## Running Tests

### Prerequisites

1. Ensure ClickHouse is running and the annotations table is created:
   ```sql
   -- Run the migration in clickhouse_migrations/create_annotations_table.sql
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
# Unit tests only
npm test -- __tests__/managers/AnnotationManager.test.ts

# Integration tests only
npm test -- __tests__/controllers/annotationController.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

## Test Coverage

The tests cover:

1. **AnnotationManager**:
   - Creating A/B annotations with validation
   - Updating annotations
   - Fetching annotations with various filters
   - Access control for datasets
   - Statistics calculation

2. **AnnotationController**:
   - All REST endpoints
   - Authentication
   - Error handling
   - Query parameter validation

## Notes

- Integration tests may fail if datasets don't exist. In production, you would:
  1. Create a test dataset
  2. Add requests to the dataset
  3. Create annotations for those requests
  
- The unit tests use mocks to isolate business logic from external dependencies
- The integration tests verify the full request/response cycle

## Future Tests

When implementing other annotation types (Labeling, RL, SFT), add:

1. Unit tests in `AnnotationManager.test.ts` for each type
2. Integration tests in `annotationController.test.ts` for new endpoints
3. Store-level tests if needed for complex ClickHouse queries 