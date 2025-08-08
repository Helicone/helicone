import os
from dotenv import load_dotenv
from helicone_async import HeliconeAsyncLogger
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

# Get API keys from environment variables
HELICONE_API_KEY = os.getenv("HELICONE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not HELICONE_API_KEY:
    raise ValueError("HELICONE_API_KEY environment variable is required")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

logger = HeliconeAsyncLogger(
    api_key=HELICONE_API_KEY,
)

logger.init()

client = OpenAI(api_key=OPENAI_API_KEY)

# Make the OpenAI call
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Who won the world series in 2020?"},
    {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
    {"role": "user", "content": "Where was it played?"}
    ]
)

print(response.choices[0])