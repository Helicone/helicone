# LangGraph ChatAnthropic Agent with Helicone

This example demonstrates how to use LangGraph with ChatAnthropic and Helicone for monitoring and observability.

> This example uses [uv](https://docs.astral.sh/uv/) for fast and reliable Python package management. uv is a modern Python package manager that provides faster dependency resolution and installation compared to pip.

## Features

- **LangGraph React Agent**: Uses `create_react_agent` to create a simple agent
- **Helicone Integration**: All requests are routed through Helicone for monitoring
- **Streaming Support**: Real-time streaming responses
- **Session Tracking**: Conversation tracking with session IDs
- **Hello World Style**: Simple, minimal example demonstrating core concepts

## Setup

1. Install dependencies using uv:
```bash
# Install uv if you don't have it
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync
```

2. Set up environment variables:
Copy the template file and fill in your API keys:
```bash
# Copy the template file to .env
cp env.template .env

# Then edit .env and fill in your actual API keys
# Helicone API Key - Get from https://helicone.ai/
# Anthropic API Key - Get from https://console.anthropic.com/
```

## Usage

Run the example:
```bash
uv run main.py
```

This is the recommended way to run the script as it automatically uses the correct Python environment and dependencies managed by uv.

The example will send a simple "hello world" message to the agent and display the streaming response. All interactions are automatically logged to your Helicone dashboard.

## Example Output

```
LangGraph ChatAnthropic Agent with Helicone - Hello World
============================================================
Conversation ID: 12345678-1234-5678-9012-123456789012
Model: claude-3-sonnet-20240229

User: Hello! Please introduce yourself and tell me what you can help with.
Agent: Hello! I'm Claude, an AI assistant created by Anthropic. I'm here to help you with a wide variety of tasks including answering questions, helping with analysis, writing, math, coding, creative projects, and much more. I can engage in conversations on topics you're interested in, help you work through problems, or assist with whatever you need. What would you like to explore or work on today?

✅ Success! Check your Helicone dashboard to see this conversation.
```

## Key Features Demonstrated

### Helicone Integration
- Uses Helicone proxy URL: `https://anthropic.helicone.ai/`
- Includes authentication headers
- Adds custom properties for tracking
- Session management with conversation IDs

### Agent Configuration
- React agent without tools (simplified)
- Streaming responses
- Thread-based conversation tracking
- Custom headers for session management

### Code Structure
```python
# Initialize with Helicone proxy
llm = ChatAnthropic(
    model=model_id,
    temperature=0,
    max_tokens=8192,
    streaming=True,
    **{
        "base_url": "https://anthropic.helicone.ai/",
        "default_headers": {
            "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}",
            "Helicone-Property-Model-Class-Name": "HelloWorldAgent",
            "Helicone-Property-Conversation-Id": conversation_id,
        }
    }
)

# Create agent without tools (empty list)
agent = create_react_agent(llm, [])

# Configure with session tracking
config = {
    "configurable": {
        "thread_id": conversation_id
    }
}
config['options'] = {
    "headers": {
        "Helicone-Session-Id": conversation_id,
        "Helicone-Session-Name": conversation_id,
        "Helicone-Session-Path": "/",
        "Helicone-User-Id": user_id,
    }
}
```

## Monitoring

All interactions will be logged to your Helicone dashboard where you can:
- View conversation flows
- Track costs and usage
- Analyze performance metrics
- Debug issues
- Monitor session data

## Notes

- This is a minimal "Hello World" example demonstrating core Helicone integration
- No tools are used to keep the example simple and focused
- The example runs once and exits - perfect for testing your setup
- Customize the model and parameters as needed for your use case
- Dependencies are managed through `pyproject.toml` for better uv compatibility
- uv automatically creates and manages a virtual environment in `.venv/`
- You can extend this example by adding tools, interactive loops, or more complex conversations 