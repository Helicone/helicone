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
import sys

# Load environment variables
load_dotenv()

HELICONE_API_KEY = os.getenv("HELICONE_API_KEY")
PROJECT_ID = os.getenv("PROJECT_ID")
LOCATION = os.getenv("LOCATION")

async def generate_content_async(model, prompt="Tell me a joke"):
    """Generate content asynchronously from the model."""
    try:
        response = await model.generate_content_async(contents=[prompt])
        print(f"Response: {response.text}")
        return response.text
    except Exception as e:
        print(f"Error: {e}")
        return str(e)

async def main():
    print("Vertex AI Gemini with Helicone Example")
    
    credentials, _ = google.auth.default()
    auth_req = google.auth.transport.requests.Request()
    credentials.refresh(auth_req)
    token = credentials.token
    
    aiplatform.init(
        project=PROJECT_ID, 
        location=LOCATION,
        api_transport="rest"
    )
    
    async_credentials = StaticCredentials(token=token)
    aiplatform.initializer._set_async_rest_credentials(credentials=async_credentials)
    
    vertexai.init(
        project=PROJECT_ID,
        location=LOCATION,
        api_endpoint="gateway.helicone.ai",
        api_transport="rest",
        request_metadata=[
            ('helicone-target-url', f'https://{LOCATION}-aiplatform.googleapis.com'),
            ('helicone-auth', f'Bearer {HELICONE_API_KEY}')
        ]
    )
    
    model = GenerativeModel(
        "gemini-1.5-pro",
        generation_config={"response_mime_type": "application/json"}
    )
    
    await generate_content_async(model, "Tell me a joke about programming")

if __name__ == "__main__":
    if not sys.warnoptions:
        warnings.filterwarnings("ignore", category=ResourceWarning)
    
    asyncio.run(main())
    
    sys.exit(0) 