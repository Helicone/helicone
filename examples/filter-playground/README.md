# Helicone Filters Demo

A simple demonstration app for the Helicone Filters package, showcasing how to build SQL WHERE clauses from JSON filter expressions.

## Features

- **Filter Validation**: Validate filter JSON structures
- **SQL Generation**: Convert filter expressions to SQL WHERE clauses
- **Multi-Database Support**: Generate SQL for both PostgreSQL and ClickHouse
- **Interactive Playground**: Test filters with instant feedback
- **Sample Filters**: Pre-built examples to learn from

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn or npm

### Installation

```bash
# Install dependencies
yarn install

# Run the development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the filter playground.

## Filter Format

Filters can be expressed in multiple formats:

### Simple Format
```json
{
  "request_response_rmt": {
    "status": {
      "equals": 200
    }
  }
}
```

### Branch Format (AND/OR)
```json
{
  "left": {
    "request_response_rmt": {
      "status": {
        "equals": 200
      }
    }
  },
  "operator": "and",
  "right": {
    "request_response_rmt": {
      "model": {
        "equals": "gpt-4"
      }
    }
  }
}
```

### Range Filters
```json
{
  "request_response_rmt": {
    "latency": {
      "gte": 100,
      "lte": 1000
    }
  }
}
```

### All Records
```json
"all"
```

## API Endpoints

### POST /api/filter/validate
Validates a filter structure.

Request:
```json
{
  "filter": { /* your filter */ }
}
```

Response:
```json
{
  "valid": true,
  "errors": [],
  "filter": { /* validated filter */ }
}
```

### POST /api/filter/build
Builds SQL WHERE clause from a filter.

Request:
```json
{
  "filter": { /* your filter */ },
  "dbType": "postgres" // or "clickhouse"
}
```

Response:
```json
{
  "dbType": "postgres",
  "filter": "status = $1",
  "args": [200],
  "sql": "SELECT * FROM your_table WHERE status = $1"
}
```

## Project Structure

```
filters-demo/
├── app/
│   ├── api/
│   │   └── filter/
│   │       ├── build/       # SQL generation endpoint
│   │       └── validate/    # Filter validation endpoint
│   └── page.tsx            # Main page
├── components/
│   ├── FilterPlayground.tsx # Interactive filter tester
│   └── FilterBuilder.tsx    # Visual filter builder
└── package.json
```

## Development

The app uses Next.js 15 with TypeScript and Tailwind CSS.

### Key Technologies

- **Next.js 15**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **@helicone-package/filters**: Core filter logic

## License

MIT