# Helicone API Testing

A simple, organized way to test Helicone APIs with different environments.

## Structure

```
http-requests/
├── environments/           # Environment configuration files
│   ├── .env.local         # Local development environment
│   └── .env.prod          # Production environment
├── requests/              # Individual API request scripts
│   └── simple-request.sh  # Basic health check and request listing
├── run-query.sh          # Main runner script
└── README.md             # This file
```

## Usage

```bash
# Run against local environment
./run-query.sh --env local --curl simple-request

# Run against production environment  
./run-query.sh --env prod --curl simple-request
```

## Adding New Environments

Create a new `.env.<name>` file in the `environments/` folder:

```bash
# environments/.env.staging
HELICONE_API_KEY=your-staging-key
HELICONE_BASE_URL=https://staging.helicone.ai
```

## Adding New Request Scripts

Create a new `.sh` file in the `requests/` folder. The script can use these environment variables:
- `$HELICONE_API_KEY` - Your API key
- `$HELICONE_BASE_URL` - The base URL for the API

Example:
```bash
# requests/user-info.sh
#!/bin/bash

echo "=== Get User Info ==="
curl -X GET "$HELICONE_BASE_URL/v1/user" \
  -H "Authorization: Bearer $HELICONE_API_KEY" \
  -H "Content-Type: application/json"
```

## Available Environments

- `local` - Points to localhost:8585
- `prod` - Points to api.helicone.ai