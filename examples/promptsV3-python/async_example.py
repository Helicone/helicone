import os
import asyncio
from openai import AsyncOpenAI
from helicone_helpers import HeliconePromptManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def generate_with_prompt(prompt_manager: HeliconePromptManager, client: AsyncOpenAI):
    # Get compiled prompt with variable substitution
    result = await prompt_manager.aget_prompt_body({
        "prompt_id": os.getenv("PROMPT_ID"),
        "model": "gpt-4o-mini",
        "inputs": {
            "name": "Alice Johnson"
        }
    })

    # Check for validation errors
    if result["errors"]:
        print("Validation errors:", result["errors"])

    # Use compiled prompt with OpenAI SDK
    response = await client.chat.completions.create(**result["body"])
    print(response.choices[0].message.content)

async def main():
    # Initialize Helicone Prompt Manager
    prompt_manager = HeliconePromptManager(
        api_key=os.getenv("HELICONE_API_KEY"),
    )
    
    # Initialize async OpenAI client with Helicone proxy
    openai_client = AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url="https://oai.helicone.ai/v1",
        default_headers={
            "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}",
        },
    )

    try:
        await generate_with_prompt(prompt_manager, openai_client)
    finally:
        await prompt_manager.aclose()

if __name__ == "__main__":
    asyncio.run(main())