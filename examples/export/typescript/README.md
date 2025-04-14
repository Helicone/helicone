# Helicone Data Export Tool

A command-line tool to export request/response data from Helicone's API. This tool allows you to fetch and export your Helicone request history in various formats, with options to include full request and response bodies.

## Features

- Export data in multiple formats (JSON, JSONL, CSV)
- Date range filtering
- Rate limiting and batch processing
- Full request/response body inclusion (optional)
- Automatic pagination handling

## Prerequisites

- Node.js (v16 or later)
- TypeScript
- A Helicone API key

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set your Helicone API key:

```bash
export HELICONE_API_KEY="your-helicone-api-key"
```

## Usage

```bash
ts-node index.ts [options]
```

### Options

- `--start-date <date>`: Start date (default: 30 days ago)
- `--end-date <date>`: End date (default: now)
- `--limit <number>`: Maximum number of records to fetch
- `--format <format>`: Output format: json, jsonl, or csv (default: jsonl)
- `--include-body`: Include full request/response bodies (default: false)

### Date Format

Dates should be provided in YYYY-MM-DD format or as an ISO string.

### Examples

1. Export last 30 days of data in JSONL format:

```bash
ts-node index.ts
```

2. Export data for a specific date range in CSV format:

```bash
ts-node index.ts --start-date 2024-01-01 --end-date 2024-02-01 --format csv
```

3. Export limited number of records with full request/response bodies:

```bash
ts-node index.ts --limit 100 --include-body
```

4. Export data in pretty-printed JSON format:

```bash
ts-node index.ts --format json --limit 50
```

## Output Formats

### JSONL (Default)

Each line is a complete JSON object representing one record. Best for large datasets and streaming processing.

### JSON

A single JSON array containing all records. Includes pretty-printing for better readability.

### CSV

Tabular format with the following columns:

- response_id
- response_created_at
- response_status
- request_created_at
- request_body
- request_properties
- request_user_id
- model
- prompt_tokens
- completion_tokens
- latency
- cost_usd

## Rate Limiting

The tool implements automatic rate limiting:

- Processes records in batches of 1000
- Fetches signed bodies in chunks of 10
- Adds delays between chunks to avoid API limits

## Error Handling

- Validates command-line arguments
- Handles API errors gracefully
- Provides clear error messages
- Ensures proper cleanup of file streams

## Development

The code is written in TypeScript and follows modern best practices:

- Strong typing
- Error handling
- Resource cleanup
- Rate limiting
- Progress tracking

## License

MIT
