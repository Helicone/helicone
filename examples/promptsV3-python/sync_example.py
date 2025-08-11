import os
from openai import OpenAI
from helicone_helpers import HeliconePromptManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def generate_with_prompt(prompt_manager: HeliconePromptManager, client: OpenAI):
    # Get compiled prompt with variable substitution
    result = prompt_manager.get_prompt_body({
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
    response = client.chat.completions.create(**result["body"])
    print(response.choices[0].message.content)

def main():
    # Initialize Helicone Prompt Manager
    prompt_manager = HeliconePromptManager(
        api_key=os.getenv("HELICONE_API_KEY"),
    )
    
    # Initialize OpenAI client with Helicone proxy
    openai_client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url="https://oai.helicone.ai/v1",
        default_headers={
            "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}",
        },
    )

    generate_with_prompt(prompt_manager, openai_client)

if __name__ == "__main__":
    main()