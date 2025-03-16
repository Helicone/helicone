# Helicone with Vertex AI Anthropic Example

This example demonstrates how to use Helicone with Google Cloud Vertex AI's Anthropic models in Python.

## Setup

1. Copy the `.env.example` file to `.env` and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your:

   - Google Cloud Project ID
   - Cloud ML Region (e.g., us-east5)
   - Helicone API Key

3. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Make sure you have authenticated with Google Cloud:
   ```bash
   gcloud auth application-default login
   ```

## Running the Example

Run the basic example with:

```bash
python main.py
```

Run the customer issue reproduction with:

```bash
python customer_reproduction.py
```

## Issue Reproduction Results

We've successfully reproduced the customer's issue with Helicone caching not working with Vertex AI's Anthropic models. Here's what we found:

1. When using the `AsyncAnthropicVertex` client with Helicone:

   - The first request works fine and returns a response
   - The second request with the exact same message content (verified by hash) does not use the cache
   - Each request returns a different response, confirming that caching is not working

2. Key differences between Vertex AI and regular Anthropic clients:
   - The Vertex AI client requires additional authentication with Google Cloud
   - The Vertex AI client uses a different endpoint structure
   - The `helicone-target-url` header is set to the Vertex AI endpoint

## Potential Issues

Based on our testing, here are some potential issues that might be causing the caching problem:

1. The `helicone-target-url` header might not be correctly formatted or recognized
2. The Vertex AI client might be adding additional parameters or headers that make each request unique
3. The request structure for Vertex AI might be different from the regular Anthropic API
4. There might be an issue with how Helicone handles the Vertex AI authentication flow

## Troubleshooting Steps

If you're experiencing caching issues with Vertex AI and Helicone:

1. Verify that all headers are correctly set:

   ```python
   default_headers = {
       "Helicone-Auth": f"Bearer {HELICONE_API_KEY}",
       "Helicone-Cache-Enabled": "true",
       "Cache-Control": "max-age=15780000",
       "Helicone-Target-URL": f"https://{CLOUD_ML_REGION}-aiplatform.googleapis.com/v1"
   }
   ```

2. Check the Helicone dashboard to see if requests are being logged correctly

3. Try using the regular Anthropic client if possible, as it seems to work better with Helicone caching

4. Contact Helicone support for assistance with Vertex AI integration

## Customer Issue Reproduction

This example is designed to help reproduce and debug issues with Helicone caching when using Vertex AI's Anthropic models. The key headers to ensure caching works are:

```python
headers = {
    "Helicone-Auth": f"Bearer {HELICONE_API_KEY}",
    "Helicone-Cache-Enabled": "true",
    "Cache-Control": "max-age=15780000",
    "Helicone-Target-URL": f"https://{CLOUD_ML_REGION}-aiplatform.googleapis.com/v1"
}
```
