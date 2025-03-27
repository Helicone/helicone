import os
import asyncio
from dotenv import load_dotenv
import vertexai
from vertexai.generative_models import GenerativeModel
from google.auth.aio.credentials import StaticCredentials
from google.cloud import aiplatform
import google.auth
import google.auth.transport.requests
import warnings
from helicone_helpers import HeliconeManualLogger
import sys
import json

# Load environment variables
load_dotenv()

HELICONE_API_KEY = os.getenv("HELICONE_API_KEY")
PROJECT_ID = os.getenv("PROJECT_ID")
LOCATION = os.getenv("LOCATION")


helicone_logger = HeliconeManualLogger(api_key=HELICONE_API_KEY)


async def generate_content_async(model, prompt="Tell me a joke"):
    generate_kwargs = {
        "contents": [prompt],
    }

    log_builder = helicone_logger.new_builder(
        request=generate_kwargs
    )
    log_builder.add_model("gemini-1.5-pro")
    try:
        response = await model.generate_content_async(**generate_kwargs)
        log_builder.add_response(response.to_dict())
        print(f"Response: {response.text}")
        return response.text
    except Exception as e:
        print(f"Error: {e}")
        return str(e)
    finally:
        await log_builder.send_log()


async def generate_content_streaming(model: GenerativeModel, prompt="Tell me a joke"):
    generate_kwargs = {
        "contents": [prompt],
        "stream": True,
    }

    log_builder = helicone_logger.new_builder(
        request=generate_kwargs
    )
    log_builder.add_model("gemini-1.5-pro")
    try:
        responses = await model.generate_content_async(**generate_kwargs)

        full_response = []
        print("Streaming response:")
        async for response in responses:
            log_builder.add_chunk(response.to_dict())
            chunk = response.text
            print(chunk, end="", flush=True)
            full_response.append(chunk)
        print("\n")
        return "".join(full_response)
    except Exception as e:
        print(f"Error in streaming: {e}")
        return str(e)
    finally:
        await log_builder.send_log()


async def main():
    print("Vertex AI Gemini with Helicone Example")

    vertexai.init(
        project=PROJECT_ID,
        location=LOCATION,

    )

    model = GenerativeModel(
        "gemini-1.5-pro",
        generation_config={"response_mime_type": "application/json"}
    )

    # print("\n=== Regular Async Response ===")
    # await generate_content_async(model, "Tell me a joke about programming")

    print("\n=== Streaming Response ===")
    await generate_content_streaming(model, "Tell me a short 2 sentence story about a programmer")


if __name__ == "__main__":
    if not sys.warnoptions:
        warnings.filterwarnings("ignore", category=ResourceWarning)

    asyncio.run(main())

    sys.exit(0)
