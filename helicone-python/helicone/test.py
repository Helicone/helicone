import os
from dotenv import load_dotenv
from helicone import openai

load_dotenv()

# Test createCompletion
response = openai.Completion.create(
    model="text-ada-001",
    prompt="Say this is a Helicone test",
    max_tokens=12,
    temperature=0,
)
print(response)

# Test createChatCompletion
completion = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello are you Helicone?"}],
)
print(completion)

# Test createEdit
response = openai.Edit.create(
    model="text-davinci-edit-001",
    input="What Helicone day of the wek is it?",
    instruction="Fix the spelling mistakes",
)
print(response)

# Test createEmbedding
response = openai.Embedding.create(
    model="text-embedding-ada-002",
    input="The helicone package is delicious...",
)
print(response)
