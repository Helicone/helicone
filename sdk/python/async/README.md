# Helicone Python Async SDK

A Python wrapper for logging llm traces directly to Helicone, by passing the proxy, with OpenLLMetry.

## Installation

```bash
pip install helicone-async
```

## Usage

```python
from helicone_async import HeliconeAsyncLogger
from openai import OpenAI

logger = HeliconeAsyncLogger(
  api_key=HELICONE_API_KEY,
)

logger.init()

client = OpenAI(api_key=OPENAI_API_KEY)

# Make the OpenAI call
response = client.chat.completions.create(
  model="gpt-3.5-turbo",
  messages=[{"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Who won the world series in 2020?"},
            {"role": "assistant",
             "content": "The Los Angeles Dodgers won the World Series in 2020."},
            {"role": "user", "content": "Where was it played?"}]
)

print(response.choices[0])
```

For more information on Asynchronous Logging, see the [docs](https://docs.helicone.ai/getting-started/integration-method/openllmetry).

## Deploy

```bash
poetry build
rm -rf dist
twine upload dist/*
```
