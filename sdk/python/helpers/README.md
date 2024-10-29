# Helicone Helpers Python SDK

This is the Python SDK for Helicone Helpers. It provides convenient access to some of Helicone's features.

## Supported Features

- [Manual Logging](https://docs.helicone.ai/getting-started/integration-method/custom).

## Installation

```bash
pip install helicone-helpers
```

## Usage

### Manual Logging

```python
from helicone_helpers import HeliconeManualLogger

logger = HeliconeManualLogger(api_key="sk-helicone-...", headers={...})

# This is just an example request body, Helicone supports embedding models with the Proxy as well.
reqBody = {
  "model": "text-embedding-ada-002",
  "input": "The food was delicious and the waiter was very friendly.",
  "encoding_format": "float"
}

def operation(result_recorder: HeliconeResultRecorder):
  r = requests.post("https://api.openai.com/v1/embeddings", json=reqBody, headers={"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"})
  return result_recorder.append_results(r.json())

logger.log_request(
  request=reqBody,
  operation=operation,
  additional_headers={
    ...
  }
)
```

You can also use the `HeliconeManualLogger` for [VectorDB Logging](https://docs.helicone.ai/integrations/vectordb/python) and [Tools Logging](https://docs.helicone.ai/integrations/tools/python).
