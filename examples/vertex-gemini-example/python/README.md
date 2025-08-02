# Vertex AI Gemini with Helicone Example

This example demonstrates how to use Vertex AI's Gemini model with Helicone, specifically addressing the issue with async REST credentials when using `generate_content_async`.

## The Issue

When using Helicone with Vertex AI's Gemini model and calling `generate_content_async`, you might encounter this error:

```
REST async clients requires async credentials set using aiplatform.initializer._set_async_rest_credentials(). Falling back to grpc since no async rest credentials were detected.
```

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure your `.env` file:

```
HELICONE_API_KEY="your-helicone-api-key"
PROJECT_ID="your-gcp-project-id"
LOCATION="us-central1"  # or your preferred region
```

4. Authenticate with Google Cloud:

```bash
gcloud auth application-default login
```

## Running the Example

```bash
python gemini_example.py
```

## Solution Explained

The key to fixing the issue is to explicitly set the async REST credentials before initializing Vertex AI:

1. Get a token from Google Cloud Application Default Credentials
2. Create a `StaticCredentials` instance with that token
3. Initialize aiplatform with `api_transport="rest"` explicitly set
4. Set the async REST credentials with `aiplatform.initializer._set_async_rest_credentials()`
5. Initialize Vertex AI with Helicone

Here's the key code snippet:

```python
# Get a token from Google Cloud Application Default Credentials
credentials, _ = google.auth.default()
auth_req = google.auth.transport.requests.Request()
credentials.refresh(auth_req)
token = credentials.token

# Initialize aiplatform with REST transport explicitly
aiplatform.init(
    project=PROJECT_ID,
    location=LOCATION,
    api_transport="rest"  # Explicitly set REST transport
)

# Set async REST credentials explicitly
async_credentials = StaticCredentials(token=token)
aiplatform.initializer._set_async_rest_credentials(credentials=async_credentials)
```

The example demonstrates a working implementation that properly handles async REST credentials when using Vertex AI's Gemini model with Helicone.

## Known Issues

### Unclosed Client Sessions

You may see warnings about unclosed client sessions when running the example:

```
Unclosed client session
client_session: <aiohttp.client.ClientSession object at 0x...>
Unclosed connector
connections: ['deque([(<aiohttp.client_proto.ResponseHandler object at 0x...>, ...)])'
]
connector: <aiohttp.connector.TCPConnector object at 0x...>
```

These warnings are related to the async HTTP client used by the Google Cloud libraries and don't affect the functionality of the example. They occur because the client sessions are not properly closed before the program exits.

In a production environment, you might want to implement proper cleanup of these resources, but for this example, they can be safely ignored.
