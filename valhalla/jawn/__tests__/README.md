# Testing Setup for HeliconeSql

This directory contains comprehensive tests for the HeliconeSql functionality with a real ClickHouse database.

## Test Database Setup

When `NODE_ENV=test`, the system automatically uses a separate test database (`helicone_test`) to ensure isolation from production data.

### Database Lifecycle

1. **Before all tests**:
   - Creates `helicone_test` database
   - Creates all required tables with the same schema as production
   - Inserts initial test data

2. **After all tests**:
   - Drops all test tables
   - Drops the test database

### Prerequisites

1. Start ClickHouse migration :
   ./clickhouse/manage_databases.sh test start

````

### Run Tests

```bash
cd valhalla/jawn

# Run all tests
npm test

# Run specific test file
npm test heliconeSql.integration.test.ts

# Run with verbose output
npm test -- --verbose
````

## Test Files

- `setup/jest.setup.ts` - Global setup and teardown

## Key Features

1. **Real Database Testing**: Uses actual ClickHouse database
2. **Data Isolation**: Separate test database prevents interference
3. **Organization Filtering**: Tests verify proper organization isolation
4. **SQL Injection Prevention**: Tests security measures
5. **CRUD Pattern**: Follows create-read-delete pattern for each test
6. **Automatic Cleanup**: Test data is automatically cleaned up

### Database Connection Issues

1. Ensure ClickHouse container is running
2. Check port 18123 is accessible
3. Verify environment variables

### Test Timeouts

- Tests have 30-second timeout for database operations
- Increase timeout in `jest.config.js` if needed
