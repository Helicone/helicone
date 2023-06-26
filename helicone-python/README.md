# Helicone OpenAI Python Library

This package is a simple and convenient way to log all requests made through the OpenAI API with Helicone, with just a one-line code change. By using the OpenAI Python wrapper, you can easily track and manage your OpenAI API usage and monitor your GPT models' cost, latency, and performance on the Helicone platform.

## Installation

To install the Helicone OpenAI Python library, simply run the following command:

```bash
pip install helicone
```

## Usage

You need to have an API key from [Helicone](https://www.helicone.ai/). Once you have the API key, set it as an environment variable `HELICONE_API_KEY`.

```bash
export HELICONE_API_KEY=your_helicone_api_key_here
```

Then, in your Python code, replace your existing OpenAI library imports with Helicone's wrapper:

```python
import helicone.openai import openai  # replace `import openai` with this line
```

That's it! Now all your API requests made through the OpenAI library will be logged by Helicone and you can view your results in the [web application](https://www.helicone.ai/).

## Advanced Usage

Helicone allows you to customize your requests using additional options like [caching](https://docs.helicone.ai/advanced-usage/caching), [retries](https://docs.helicone.ai/advanced-usage/retries), [rate limits](https://docs.helicone.ai/advanced-usage/custom-rate-limits), and [custom properties](https://docs.helicone.ai/advanced-usage/custom-properties). Here's how to use these advanced features in a single API request:

```python
response = openai.create_completion(
    model="text-ada-001",
    prompt="What is the meaning of life?",
    max_tokens=10,
    properties={
        "session_id": "123",
        "project": "example_project",
    },
    cache=True,
    rate_limit_policy={
        "quota": 100,
        "time_window": 60, # in seconds
        "segment": "user",
    },
    retry=True,
)
```

## Requirements

- Python 3.6 or higher is required.
