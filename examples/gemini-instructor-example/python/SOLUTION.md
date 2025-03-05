# Solution: Setting User ID with Gemini and Instructor

## The Issue

The customer was trying to set the `Helicone-User-Id` header with the Gemini client using the `extra_headers` parameter, which works for OpenAI and Anthropic clients but not for Gemini:

```python
# This works for OpenAI and Anthropic, but NOT for Gemini
config: Dict[str, Any] = {
    "messages": [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": human_msg},
    ],
    "response_model": output_structure,
}

user_id: Optional[str] = user_id_var.get()
if user_id:
    config["extra_headers"] = {}
    config["extra_headers"]["Helicone-User-Id"] = user_id

response = GEMINI_HELICONE_CLIENT.chat.completions.create(**config)
```

This approach results in the error:

```
TypeError: GenerativeModel.generate_content() got an unexpected keyword argument 'extra_headers'
```

## The Solution

With Gemini, you need to set the user ID in the `default_metadata` when configuring the client, not in the request headers:

```python
# Create metadata list with user_id
user_id: Optional[str] = user_id_var.get()
metadata: List[Tuple[str, str]] = [
    ("helicone-auth", f"Bearer {HELICONE_API_KEY}"),
    ("helicone-target-url", "https://generativelanguage.googleapis.com"),
]

# Add user_id if provided
if user_id:
    metadata.append(("helicone-user-id", user_id))

# Configure the client with the metadata
genai.configure(
    api_key=GEMINI_API_KEY,
    client_options={
        "api_endpoint": "gateway.helicone.ai",
    },
    default_metadata=metadata,
    transport="rest",
)

# Create the client
gemini_client = instructor.from_gemini(
    genai.GenerativeModel(
        model_name="gemini-2.0-flash",
    ),
    mode=instructor.Mode.GEMINI_JSON,
)

# Now make the request (without extra_headers)
config: Dict[str, Any] = {
    "messages": [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": human_msg},
    ],
    "response_model": output_structure,
}

response = gemini_client.chat.completions.create(**config)
```

## Key Differences Between Providers

1. **OpenAI and Anthropic**: Support setting headers on a per-request basis using `extra_headers`
2. **Gemini**: Requires setting headers in the `default_metadata` when configuring the client

## Implications

If you need to change the user ID for different requests with Gemini, you'll need to either:

1. Reconfigure the client with the new user ID before each request, or
2. Create separate client instances for each user ID

## Example Implementation

See the full implementation in `gemini_instructor_example.py` which demonstrates:

1. How to configure the Gemini client with a user ID
2. How to make requests with the configured client
3. How to verify that the user ID is being properly associated with requests in Helicone
