# Helicone Data Export Tool

A robust command-line tool to export request/response data from Helicone's API. This tool allows you to fetch and export your Helicone request history in various formats, with advanced features for reliability and monitoring.

## ✨ Key Features

### Core Features
- 📦 Export data in multiple formats (JSON, JSONL, CSV)
- 📅 Date range filtering
- 🔄 Automatic pagination handling
- 📄 Full request/response body inclusion (optional)
- 🚫 Automatic filtering of large `streamed_data` fields

### Advanced Features (NEW!)
- 💾 **Auto-recovery from crashes** - Checkpoint system saves progress automatically
- 🔁 **Retry logic with exponential backoff** - Handles transient failures gracefully
- 🛑 **Graceful shutdown** - Ctrl+C saves progress for later resume
- 📊 **Progress tracking** - Real-time progress bar with ETA
- 🔍 **Multiple log levels** - quiet, normal, or verbose output
- ✅ **Pre-flight validation** - Checks API key, permissions, and disk space
- ⚡ **Configurable batch sizes and retry attempts**
- 🔒 **Overwrite protection** - Prompts before overwriting existing files
- 🏷️ **Property filtering** - Filter exports by custom properties

## Prerequisites

- Node.js v18.0.0 or later (for native fetch API)
- A Helicone API key

## Installation

### Option 1: NPX (Recommended - No Installation Required)

Use the package directly without installing:

```bash
npx @helicone/export [options]
```

### Option 2: Global Installation

Install once and use anywhere:

```bash
npm install -g @helicone/export
helicone-export [options]
```

### Option 3: Local Project Installation

Add to your project:

```bash
npm install @helicone/export
npx helicone-export [options]
```

### Option 4: Development (From Source)

Clone and build from source:

```bash
git clone https://github.com/Helicone/helicone.git
cd helicone/examples/export/typescript
npm install
npm run build
node dist/cli.js [options]
```

## Setup

Set your Helicone API key as an environment variable:

```bash
export HELICONE_API_KEY="your-helicone-api-key"
```

Or prefix each command:

```bash
HELICONE_API_KEY="your-key" npx @helicone/export [options]
```

## Usage

**With API key inline:**
```bash
<<<<<<< Updated upstream
npx @helicone/export [options]
```

Or if globally installed:

```bash
helicone-export [options]
=======
<<<<<<< Updated upstream
ts-node index.ts [options]
=======
HELICONE_API_KEY="your-key" npx @helicone/export [options]
>>>>>>> Stashed changes
```

**Or if globally installed:**
```bash
HELICONE_API_KEY="your-key" helicone-export [options]
>>>>>>> Stashed changes
```

**Note:** All examples below show the API key inline for clarity.

### Core Options

| Option | Description | Default |
|--------|-------------|---------|
| `--start-date <date>` | Start date (YYYY-MM-DD or ISO string) | 30 days ago |
| `--end-date <date>` | End date (YYYY-MM-DD or ISO string) | now |
| `--limit <number>` | Maximum number of records to fetch | unlimited |
| `--format <format>` | Output format: json, jsonl, or csv | jsonl |
| `--include-body` | Include full request/response bodies | false |
| `--output, -o <path>` | Custom output file path | output.{format} |
| `--property, -p <key=value>` | Filter by property (can use multiple times) | - |
| `--region <region>` | API region: `us` or `eu` | us |
| `--help, -h` | Show help message and exit | - |

### Advanced Options

| Option | Description | Default |
|--------|-------------|---------|
| `--log-level <level>` | Log level: quiet, normal, or verbose | normal |
| `--max-retries <number>` | Maximum retry attempts for failed requests | 5 |
| `--batch-size <number>` | Batch size for API requests | 1000 |
| `--clean-state` | Remove checkpoint and start fresh export | - |
| `--resume` | Explicitly resume from checkpoint | - |

### Examples

#### Basic Usage

1. **Export last 30 days of data with bodies**:
```bash
<<<<<<< Updated upstream
npx @helicone/export
=======
<<<<<<< Updated upstream
ts-node index.ts
=======
HELICONE_API_KEY="your-key" npx @helicone/export --include-body
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

2. **Export specific date range with bodies**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --start-date 2024-01-01 --end-date 2024-02-01 --format csv
=======
<<<<<<< Updated upstream
ts-node index.ts --start-date 2024-01-01 --end-date 2024-02-01 --format csv
=======
HELICONE_API_KEY="your-key" npx @helicone/export --start-date 2024-01-01 --end-date 2024-02-01 --include-body
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

3. **Export from EU region with bodies**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --limit 100 --include-body
=======
<<<<<<< Updated upstream
ts-node index.ts --limit 100 --include-body
=======
HELICONE_API_KEY="your-key" npx @helicone/export --region eu --include-body --limit 1000
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

4. **Export with property filter**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --output my-export.jsonl
=======
<<<<<<< Updated upstream
ts-node index.ts --output my-export.jsonl
=======
HELICONE_API_KEY="your-key" npx @helicone/export --property appname=LlamaCoder --include-body
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

5. **Export in CSV format with bodies**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --property appname=LlamaCoder
=======
<<<<<<< Updated upstream
ts-node index.ts --property appname=LlamaCoder
=======
HELICONE_API_KEY="your-key" npx @helicone/export --format csv --include-body --output my-export.csv
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

6. **Multiple property filters**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --property appname=LlamaCoder --property environment=production
=======
<<<<<<< Updated upstream
ts-node index.ts --property appname=LlamaCoder --property environment=production
=======
HELICONE_API_KEY="your-key" npx @helicone/export --property appname=LlamaCoder --property environment=production --include-body
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

#### Advanced Usage

7. **Quiet mode for automation**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --log-level quiet --limit 10000
=======
<<<<<<< Updated upstream
ts-node index.ts --log-level quiet --limit 10000
=======
HELICONE_API_KEY="your-key" npx @helicone/export --log-level quiet --limit 10000 --include-body
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

8. **Verbose logging for debugging**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --log-level verbose --max-retries 10
=======
<<<<<<< Updated upstream
ts-node index.ts --log-level verbose --max-retries 10
=======
HELICONE_API_KEY="your-key" npx @helicone/export --log-level verbose --max-retries 10 --include-body
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

9. **Large export with custom batch size**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --limit 50000 --batch-size 500
=======
<<<<<<< Updated upstream
ts-node index.ts --limit 50000 --batch-size 500
=======
HELICONE_API_KEY="your-key" npx @helicone/export --limit 50000 --batch-size 500 --include-body
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

10. **Clean state and start fresh**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --clean-state
=======
<<<<<<< Updated upstream
ts-node index.ts --clean-state
=======
HELICONE_API_KEY="your-key" npx @helicone/export --clean-state --include-body
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

11. **EU region with specific date range**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --property appname=LlamaCoder --format csv --limit 5000 --include-body
=======
<<<<<<< Updated upstream
ts-node index.ts --property appname=LlamaCoder --format csv --limit 5000 --include-body
=======
HELICONE_API_KEY="your-key" npx @helicone/export --region eu --start-date 2024-08-01 --end-date 2024-08-31 --include-body
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

#### Recovery Scenarios

12. **After a crash** (automatic resume prompt):
```bash
<<<<<<< Updated upstream
npx @helicone/export
=======
<<<<<<< Updated upstream
ts-node index.ts
=======
HELICONE_API_KEY="your-key" npx @helicone/export
>>>>>>> Stashed changes
>>>>>>> Stashed changes
# Will detect checkpoint and ask: "Resume from checkpoint? (y/n)"
```

13. **Force resume from checkpoint**:
```bash
<<<<<<< Updated upstream
npx @helicone/export --resume
=======
<<<<<<< Updated upstream
ts-node index.ts --resume
=======
HELICONE_API_KEY="your-key" npx @helicone/export --resume
>>>>>>> Stashed changes
>>>>>>> Stashed changes
```

14. **Cancel and save progress** (during export):
```
Press Ctrl+C during export
# Progress is saved automatically
# Run the same command again to resume
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
- cost

## How It Works

### Auto-Recovery System

The tool automatically saves checkpoints after each batch of records:

1. **Checkpoint file** (`.helicone-export-state.json`) tracks:
   - Current offset in the export
   - Total records processed
   - Output file path
   - Export configuration

2. **On restart**, the tool:
   - Detects existing checkpoint
   - Validates it matches current configuration
   - Prompts user to resume or start fresh

3. **On crash/interrupt**:
   - Checkpoint is saved before exit
   - Output file is properly closed
   - No data loss occurs

### Retry Logic

When API requests fail, the tool automatically retries with exponential backoff:

- **Attempt 1**: Wait 1 second
- **Attempt 2**: Wait 2 seconds
- **Attempt 3**: Wait 4 seconds
- **Attempt 4**: Wait 8 seconds
- **Attempt 5**: Wait 16 seconds

Special handling for rate limits (429):
- Respects `Retry-After` header if present
- Otherwise uses exponential backoff

### Progress Tracking

Three log levels available:

- **quiet**: Only start/complete/error messages
- **normal**: Progress bar with ETA and records/sec
- **verbose**: Detailed logs of each API call and retry attempt

Example progress bar:
```
[==================>           ] 62% (6,234/10,000) ETA: 3m 45s | 12.3 rec/s
```

## Rate Limiting

The tool implements intelligent rate limiting:

- Processes records in configurable batches (default 1000)
- Fetches signed bodies in chunks of 10
- Adds delays between chunks to avoid API limits
- Automatically handles 429 rate limit responses

## Error Handling

Comprehensive error handling:

- ✅ Pre-flight validation (API key, permissions, disk space)
- ✅ Validates command-line arguments
- ✅ Handles API errors with retry logic
- ✅ Distinguishes retryable vs fatal errors
- ✅ Provides clear, actionable error messages
- ✅ Ensures proper cleanup of file streams and signal handlers

## Architecture

The code is structured into specialized classes:

- **CheckpointManager**: Handles state persistence and recovery
- **ProgressTracker**: Manages logging and progress display
- **HeliconeClient**: API client with retry logic
- **ExportWriter**: Handles file writing for different formats

Benefits:
- Strong TypeScript typing
- Separation of concerns
- Easy to test and maintain
- Extensible for new features

## License

MIT
