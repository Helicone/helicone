import os
import time
import asyncio
from dotenv import load_dotenv
from anthropic.lib.vertex import AsyncAnthropicVertex
from google.auth import default

# Load environment variables from .env file
load_dotenv()

# Get environment variables
ANTHROPIC_VERTEX_PROJECT_ID = os.getenv("VERTEX_PROJECT_ID")
CLOUD_ML_REGION = os.getenv("CLOUD_ML_REGION")
HELICONE_API_KEY = os.getenv("HELICONE_API_KEY")

# Create Anthropic Vertex client with Helicone integration


async def create_client():
    # Create the client with Helicone configuration
    client = AsyncAnthropicVertex(
        region=CLOUD_ML_REGION,
        project_id=ANTHROPIC_VERTEX_PROJECT_ID,
        base_url="https://gateway.helicone.ai/v1",
        # base_url="http://localhost:8788/v1",
        # base_url="https://gateway.staging.hconeai.com/v1",
        default_headers={
            "Helicone-Auth": f"Bearer {HELICONE_API_KEY}",
            "Helicone-Cache-Enabled": "true",
            # "Cache-Control": "max-age=15780000",
            "Helicone-Target-URL": f"https://{CLOUD_ML_REGION}-aiplatform.googleapis.com/v1",
            "User-Agent": "python-anthropic",
            # Optional session tracking for better analytics
            "Helicone-Session-Name": "Vertex-Anthropic-Test",
            "Helicone-Session-Id": "test-session-123",

        }
    )

    return client


async def main():
    client = await create_client()

    # Create a message with streaming
    print("Sending message to Claude...")

    message_content = "Hey! Can you respond with a really long story, recounting the main themes of harry potter, but make it about pirates?"

    # Create a streaming message
    stream = await client.messages.create(
        model="claude-3-5-sonnet-v2@20241022",
        max_tokens=1000,
        messages=[
            {
                "role": "user",
                "content": message_content,
            }
        ],
        # stream=True,
    )

    print(stream)
    # # Process the streaming response
    # async for chunk in stream:
    #     if hasattr(chunk, 'delta') and hasattr(chunk.delta, 'text'):
    #         content = chunk.delta.text
    #         # Sleep for 1 second to simulate slower processing

    #         print(content, end="", flush=True)

    exit()
    print("\nStream completed")

    print("Sleeping for 2 seconds")
    await asyncio.sleep(2)
    # Make the same request again to test caching
    print("\n\nSending the same message again to test caching...")

    stream2 = await client.messages.create(
        model="claude-3-5-sonnet-v2@20241022",
        max_tokens=100,
        messages=[
            {
                "role": "user",
                "content": message_content,
            }
        ],
        stream=True,
    )

    # Process the streaming response
    async for chunk in stream2:
        if hasattr(chunk, 'delta') and hasattr(chunk.delta, 'text'):
            content = chunk.delta.text
            # Sleep for 1 second to simulate slower processing

            print(content, end="", flush=True)

    print("\nSecond stream completed")

if __name__ == "__main__":
    asyncio.run(main())
