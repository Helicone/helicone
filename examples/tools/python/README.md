# Helicone Tools Python SDK Examples

This directory contains examples of how to use the Helicone Python SDK to log tool usage in your LLM applications.

## Getting Started

1. Install the required package:

   ```bash
   pip install helicone-helpers
   ```

2. Set your Helicone API key as an environment variable (optional):
   ```bash
   export HELICONE_API_KEY="your-helicone-api-key"
   ```

## Examples

### Simple Example

The `simple_example.py` file contains a basic calculator tool example that demonstrates the core functionality of logging tool usage with Helicone.

```bash
python simple_example.py
```

### Comprehensive Example

The `example.py` file contains more complex examples including:

- Weather API tool (with mock data)
- Database query tool (simulated)
- Document search tool (simulated)

```bash
python example.py
```

## Key Concepts

1. **HeliconeManualLogger**: The main class for logging tool usage
2. **Request Object**: Must include `_type: "tool"`, `toolName`, and `input`
3. **Operation Function**: The function that performs the tool operation and logs results
4. **Result Recorder**: Used to append results to be logged to Helicone

## Example Structure

```python
# Initialize the logger
helicone_logger = HeliconeManualLogger(api_key="your-api-key")

# Define the operation function
def tool_operation(result_recorder):
    # Access input from result_recorder.request
    # Perform the operation
    # Log results with result_recorder.append_results()
    return result

# Log the request
result = helicone_logger.log_request(
    request={
        "_type": "tool",
        "toolName": "your-tool-name",
        "input": { ... }
    },
    operation=tool_operation
)
```

## Additional Features

- **Session Management**: Use `Helicone-Property-Session-Id` in additional headers
- **User Tracking**: Use `Helicone-Property-User-Id` in additional headers
- **Custom Properties**: Add any custom properties with `Helicone-Property-*` headers

## Documentation

For more information, see the [Helicone Tools Python SDK documentation](https://docs.helicone.ai/integrations/tools/python).
