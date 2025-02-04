from openai import OpenAI
import os


import google.generativeai as genai
import anthropic
from PIL import Image
import base64
import pytest
from dotenv import load_dotenv
import pathlib

# Load environment variables from .env file
load_dotenv()

SESSION_ID = "test-session-id-4"

openai_client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("HELICONE_OAI_BASE_URL"),
    default_headers={
        "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}",
        "Helicone-Session-Id": SESSION_ID,
    },
)

genai.configure(
    api_key=os.environ.get("GOOGLE_GENERATIVE_API_KEY"),
    client_options={
        "api_endpoint": os.getenv("HELICONE_GATEWAY_BASE_URL"),
    },
    default_metadata=[
        ("helicone-auth", f"Bearer {os.getenv('HELICONE_API_KEY')}"),
        ("helicone-target-url", "https://generativelanguage.googleapis.com"),
        ("helicone-session-id", SESSION_ID),
    ],
    transport="rest",
)
google_model = genai.GenerativeModel("models/gemini-1.5-flash")
anthropic_client = anthropic.Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY"),
    base_url=os.getenv("HELICONE_ANTHROPIC_BASE_URL"),
    default_headers={
        "Helicone-Auth": f"Bearer {os.getenv('HELICONE_API_KEY')}",
        "Helicone-Session-Id": SESSION_ID,
    },
)


class TestHeliconeIntegrations:
    def test_openai_instruct(self):
        response = openai_client.completions.create(
            model="gpt-3.5-turbo-instruct",
            prompt="Count to 5",
            stream=False,
            extra_headers={
                "Helicone-Property-Test": "Instruct",
            },
        )
        assert response.choices[0].text is not None

    def test_openai_instruct_streaming(self):
        response = openai_client.completions.create(
            model="gpt-3.5-turbo-instruct",
            prompt="Count to 5",
            stream=True,
            extra_headers={
                "Helicone-Property-Test": "Instruct Streaming",
            },
            stream_options={"include_usage": True},
        )
        for chunk in response:
            print(chunk.choices)

    def test_openai_chat_completion(self):
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Count to 5"}],
            stream=False,
            extra_headers={
                "Helicone-Property-Test": "Chat Completion",
            },
        )
        assert response.choices[0].message.content is not None

    def test_openai_chat_completion_streaming(self):
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Count to 5"}],
            stream=True,
            extra_headers={
                "Helicone-Property-Test": "Chat Completion Streaming",
                "helicone-stream-usage": "true",
            },
        )
        for chunk in response:
            print(chunk)

    def test_openai_chat_with_image(self):
        # Skip test if image file doesn't exist
        if not os.path.exists("test_image.png"):
            pytest.skip("test_image.png not found")

        with open("test_image.png", "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode("utf-8")

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What's in this image?"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            extra_headers={
                "Helicone-Property-Test": "Chat with Image",
            },
        )

        assert response.choices[0].message.content is not None

    def test_openai_function_calling(self):
        """Test OpenAI function calling"""
        functions = [
            {
                "name": "get_weather",
                "description": "Get the weather in a location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string"},
                        "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                    },
                    "required": ["location"],
                },
            }
        ]
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "What's the weather in San Francisco?"}
            ],
            functions=functions,
            function_call="auto",
            extra_headers={
                "Helicone-Property-Test": "Function Calling",
            },
        )
        assert response.choices[0].message.function_call is not None

    def test_openai_image_generation(self):
        response = openai_client.images.generate(
            model="dall-e-3",
            prompt="A beautiful image of a cat",
            size="1024x1024",
            quality="standard",
            response_format="b64_json",
            extra_headers={
                "Helicone-Property-Test": "Image Generation",
            },
        )
        assert response.data[0].b64_json is not None

    def test_gemini_completion(self):
        response = google_model.generate_content("Count to 5")
        assert response.text is not None

    def test_gemini_streaming(self):
        response = google_model.generate_content("Count to 5", stream=True)
        for chunk in response:
            if chunk.text:
                print(chunk.text)

    def test_gemini_with_image(self):
        if not os.path.exists("test_image.png"):
            pytest.skip("test_image.png not found")

        image = Image.open("test_image.png")
        response = google_model.generate_content(["What's in this image?", image])
        assert response.text is not None

    def test_anthropic_completion(self):
        message = anthropic_client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1000,
            messages=[{"role": "user", "content": "Count to 5"}],
        )
        assert message.content[0].text is not None

    def test_anthropic_streaming(self):
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        with client.messages.stream(
            model="claude-3-opus-20240229",
            max_tokens=1000,
            messages=[{"role": "user", "content": "Count to 5"}],
        ) as stream:
            for text in stream.text_stream:
                print(text)

    def test_anthropic_with_image(self):
        if not os.path.exists("test_image.png"):
            pytest.skip("test_image.png not found")

        with open("test_image.png", "rb") as img_file:
            image_data = base64.b64encode(img_file.read()).decode("utf-8")

        message = anthropic_client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": image_data,
                            },
                        },
                        {"type": "text", "text": "What's in this image?"},
                    ],
                }
            ],
            extra_headers={
                "Helicone-Property-Test": "Chat with Image",
            },
        )
        assert message.content[0].text is not None

    def test_anthropic_tool_call(self):
        message = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            tools=[
                {
                    "name": "get_weather",
                    "description": "Get the current weather in a given location",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The city and state, e.g. San Francisco, CA",
                            }
                        },
                        "required": ["location"],
                    },
                }
            ],
            messages=[
                {"role": "user", "content": "What's the weather like in San Francisco?"}
            ],
            extra_headers={
                "Helicone-Property-Test": "Tool Call",
            },
        )
        assert message.content[0].text is not None

    def test_anthropic_tool_use(self):
        message = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            tools=[
                {
                    "name": "get_weather",
                    "description": "Get the current weather in a given location",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "The city and state, e.g. San Francisco, CA",
                            },
                            "unit": {
                                "type": "string",
                                "enum": ["celsius", "fahrenheit"],
                                "description": "The unit of temperature, either 'celsius' or 'fahrenheit'",
                            },
                        },
                        "required": ["location"],
                    },
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": "What's the weather like in San Francisco?",
                },
                {
                    "role": "assistant",
                    "content": [
                        {
                            "type": "text",
                            "text": "<thinking>I need to use get_weather, and the user wants SF, which is likely San Francisco, CA.</thinking>",
                        },
                        {
                            "type": "tool_use",
                            "id": "toolu_01A09q90qw90lq917835lq9",
                            "name": "get_weather",
                            "input": {
                                "location": "San Francisco, CA",
                                "unit": "celsius",
                            },
                        },
                    ],
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
                            "content": "65 degrees",
                        }
                    ],
                },
            ],
            extra_headers={
                "Helicone-Property-Test": "Tool Use",
            },
        )
        assert message.content[0].text is not None

    def test_anthropic_cache(self):
        """Test Anthropic's cache functionality with system prompts"""
        message = anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            system=[
                {
                    "type": "text",
                    "text": "You are an AI assistant tasked with analyzing literary works. Your goal is to provide insightful commentary on themes, characters, and writing style.\n",
                },
                {
                    "type": "text",
                    "text": pathlib.Path("tests/test_data/pride.txt").read_text(),
                    "cache_control": {"type": "ephemeral"},
                },
            ],
            messages=[
                {
                    "role": "user",
                    "content": "Analyze the major themes in 'Pride and Prejudice'.",
                }
            ],
            extra_headers={
                "Helicone-Property-Test": "Cache Control",
            },
        )
        assert message.content[0].text is not None


if __name__ == "__main__":
    pytest.main([__file__])
