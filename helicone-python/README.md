# Helicone OpenAI Python Library

This package is a simple and convenient way to log all requests made through the OpenAI API with Helicone, with just a one-line code change. By using the Helicone OpenAI Python wrapper, you can easily track and manage your OpenAI API usage and monitor your GPT-3 models' performance on the Helicone platform.

## Installation

To install the Helicone OpenAI Python wrapper, simply run the following command:

```bash
pip install helicone-openai
```

## Usage
To start using the Helicone OpenAI Python wrapper, you need to have an API key from Helicone. Once you have the API key, set it as an environment variable `HELICONE_API_KEY`.

```bash
export HELICONE_API_KEY=your_helicone_api_key_here
```

Then, in your Python code, replace your existing OpenAI library imports with Helicone's wrapper:

```python
import openai  # Replace this line
import helicone_openai as openai  # with this line
```

That's it! Now all your API requests made through the OpenAI library will be logged and tracked by Helicone.

## Requirements
- Python 3.6 or higher is required.