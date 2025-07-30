# Helicone Helpers Python SDK

This is the Python SDK for Helicone Helpers. It provides convenient access to some of Helicone's features.

## Supported Features

- [Manual Logging](https://docs.helicone.ai/getting-started/integration-method/custom)
- [Prompt Management](https://docs.helicone.ai/features/advanced-usage/prompts) - Fetch and compile prompts with variable substitution

## Installation

```bash
pip install helicone-helpers openai
```

**Note:** The OpenAI Python SDK is required for prompt management features. The SDK will work without it but with limited type safety.

## Usage

### Manual Logging

```python
from helicone_helpers import HeliconeManualLogger, HeliconeResultRecorder

logger = HeliconeManualLogger(api_key="sk-helicone-...", headers={...})

# This is just an example request body, Helicone supports embedding models with the Proxy as well.
reqBody = {
  "model": "text-embedding-ada-002",
  "input": "The food was delicious and the waiter was very friendly.",
  "encoding_format": "float"
}

def operation(result_recorder: HeliconeResultRecorder):
  r = requests.post("https://api.openai.com/v1/embeddings", json=reqBody, headers={"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"})
  result_recorder.append_results(r.json())
  return r.json()

logger.log_request(
  request=reqBody,
  operation=operation,
  additional_headers={
    # Additional headers to include with the log request
  },
  provider="openai"  # Optional: specify the provider ("openai", "anthropic", or custom)
)
```

You can also use the `HeliconeManualLogger` for [VectorDB Logging](https://docs.helicone.ai/integrations/vectordb/python) and [Tools Logging](https://docs.helicone.ai/integrations/tools/python).

### Direct Logging

For more control over the logging process, you can use the `send_log` method directly:

```python
from helicone_helpers import HeliconeManualLogger, LoggingOptions

logger = HeliconeManualLogger(api_key="sk-helicone-...")

# Log a request and response
start_time = time.time()
# ... perform your operation ...
end_time = time.time()

# You can log either dictionary or string responses
logger.send_log(
    provider="openai",  # Optional provider
    request={"model": "gpt-4", "messages": [...]},
    response={"choices": [...]},  # Can also be a string for text responses
    options=LoggingOptions(
        start_time=start_time,
        end_time=end_time,
        additional_headers={"Helicone-User-Id": "user-123"},
        time_to_first_token_ms=150  # Optional time to first token in milliseconds
    )
)
```

Note: The default logging endpoint is now `https://api.worker.helicone.ai`.

### Direct Stream Logging

For streaming responses, you can use the `send_log` method to manually track time to first token:

```python
import time
from helicone_helpers import HeliconeManualLogger, LoggingOptions
import openai

# Initialize the logger and client
helicone_logger = HeliconeManualLogger(api_key="sk-helicone-...")
client = openai.OpenAI(api_key="sk-openai-...")

# Define your request
request_body = {
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Write a story about a robot"}],
    "stream": True,
    "stream_options": {
        "include_usage": True
    }
}

# Create the streaming response
stream = client.chat.completions.create(**request_body)

# Track time to first token
chunks = []
time_to_first_token_ms = None
start_time = time.time()

# Process the stream
for i, chunk in enumerate(stream):
    # Record time to first token on first chunk
    if i == 0 and not time_to_first_token_ms:
        time_to_first_token_ms = (time.time() - start_time) * 1000

    # Store chunks (you might want to process them differently)
    chunks.append(chunk.model_dump_json())

# Log the complete interaction with timing information
helicone_logger.send_log(
    provider="openai",
    request=request_body,
    response="\n".join(chunks),  # Join chunks or process as needed
    options=LoggingOptions(
        start_time=start_time,
        end_time=time.time(),
        additional_headers={"Helicone-User-Id": "user-123"},
        time_to_first_token_ms=time_to_first_token_ms
    )
)
```

Note: The default logging endpoint is now `https://api.worker.helicone.ai`.

### Prompt Management

The SDK provides powerful prompt management capabilities that allow you to store, version, and dynamically compile prompts with variable substitution.

```python
from helicone_helpers import HeliconePromptManager
import openai

# Initialize the prompt manager
prompt_manager = HeliconePromptManager(
    api_key="sk-helicone-..."  # Your Helicone API key
)

# Initialize OpenAI client
client = openai.OpenAI(api_key="sk-openai-...")

# Use a prompt with variable substitution
params = {
    "prompt_id": "your-prompt-id",
    "model": "gpt-4o-mini",
    "inputs": {
        "customer_name": "Alice Johnson",
        "product": "AI Gateway"
    },
    "messages": [
        {"role": "user", "content": "Follow up question..."}
    ]
}

# Get compiled prompt with validation
result = prompt_manager.get_prompt_body(params)

# Check for validation errors
if result["errors"]:
    for error in result["errors"]:
        print(f"Validation error - {error.variable}: expected {error.expected}, got {error.value}")

# Use compiled prompt with OpenAI
response = client.chat.completions.create(**result["body"])
```

#### Key Features

- **Variable Substitution**: Use `{{hc:name:type}}` syntax in your prompts
- **Type Validation**: Automatic validation for `string`, `number`, and `boolean` types
- **Version Control**: Specify exact prompt versions or use production versions
- **Message Merging**: Runtime messages are appended to saved prompt messages
- **Parameter Override**: Runtime parameters take precedence over saved ones
- **Schema Variables**: Dynamic JSON schema generation for tools and response formats

#### Advanced Usage

```python
# Use specific prompt version
params = {
    "prompt_id": "your-prompt-id",
    "version_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "model": "gpt-4o-mini",
    "inputs": {
        "user_tier": "premium",
        "max_tokens_allowed": 1000
    }
}

result = prompt_manager.get_prompt_body(params)

# Handle validation errors gracefully
if result["errors"]:
    print(f"Found {len(result['errors'])} validation errors")
    # Prompt still works with original values where substitution failed
    
compiled_prompt = result["body"]
response = client.chat.completions.create(**compiled_prompt)
```

For more examples, see the [example.py](example.py) file in this repository.
