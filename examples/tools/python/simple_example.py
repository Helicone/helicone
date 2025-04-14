from helicone_helpers import HeliconeManualLogger
import os

# Initialize the Helicone logger
helicone_api_key = os.environ.get("HELICONE_API_KEY", "your-helicone-api-key")
helicone_logger = HeliconeManualLogger(
    api_key=helicone_api_key,
    headers={"Helicone-Auth": f"Bearer {helicone_api_key}"}
)

# Simple example: Calculator tool


def calculator_operation(result_recorder):
    # Access the input from the request
    operation = result_recorder.request["input"]["operation"]
    x = result_recorder.request["input"]["x"]
    y = result_recorder.request["input"]["y"]

    # Perform the calculation
    if operation == "add":
        result = x + y
    elif operation == "subtract":
        result = x - y
    elif operation == "multiply":
        result = x * y
    elif operation == "divide":
        result = x / y if y != 0 else "Error: Division by zero"
    else:
        result = "Error: Unknown operation"

    # Log the result to Helicone
    result_recorder.append_results({"result": result})
    return {"result": result}


# Log the request with Helicone
res = helicone_logger.log_request(
    request={
        "_type": "tool",
        "toolName": "calculator",
        "input": {
            "operation": "add",
            "x": 5,
            "y": 3
        }
    },
    operation=calculator_operation
)

print(f"Calculator result: {res['result']}")  # Output: Calculator result: 8

# Try another operation
res = helicone_logger.log_request(
    request={
        "_type": "tool",
        "toolName": "calculator",
        "input": {
            "operation": "multiply",
            "x": 4,
            "y": 7
        }
    },
    operation=calculator_operation,
    additional_headers={
        "Helicone-Property-Session-Id": "calculator-demo-session",
        "Helicone-Property-User-Id": "user-123"
    }
)

print(f"Calculator result: {res['result']}")  # Output: Calculator result: 28
