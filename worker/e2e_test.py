# import asyncio
import uuid
from supabase import create_client, Client
import os
import time
import openai
import json
# import httpx
openai.api_base = "http://127.0.0.1:8787/v1"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
SUPABASE_URL = "http://localhost:54321"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def assert_stream_and_not_stream_same_tokens(**kwargs):
    notStreamRequestId = uuid.uuid4()
    kwargs["temperature"] = 0
    kwargs["headers"] = {
        "Helicone-Request-Id": str(notStreamRequestId),
        "OpenAI-Organization": ""
    }
    if kwargs.get("messages"):
        openai.ChatCompletion.create(**kwargs)
    else:
        openai.Completion.create(**kwargs)
    streamRequestId = uuid.uuid4()

    kwargs["headers"] = {
        "Helicone-Request-Id": str(streamRequestId),
    }
    kwargs["stream"] = True
    if kwargs.get("messages"):
        [resp for resp in openai.ChatCompletion.create(**kwargs)]
    else:
        [resp for resp in openai.Completion.create(**kwargs)]
    time.sleep(.5)
    notStreamedUsage = supabase.table('response').select(
        "*").eq("request", notStreamRequestId).single().execute().data.get("body").get("usage")
    streamedUsage = supabase.table('response').select(
        "*").eq("request", streamRequestId).single().execute().data.get("body").get("usage")
    print("notStreamedUsage", notStreamedUsage)
    print("streamedUsage", streamedUsage)
    assert notStreamedUsage == streamedUsage


def test_streamed_response_delays():
    print("testing streamed response delays")

    start_time = time.time()
    count = 0
    for resp in openai.Completion.create(model='text-davinci-003',
                                         prompt="write me a poem'\n",
                                         max_tokens=10,
                                         temperature=0,
                                         stream=True):
        current_time = time.time()
        count += 1
        assert current_time > start_time
    assert count > 1
    print("passed streamed response delays test")


def test_streamed_response():
    print("testing streamed response")
    responses = [resp for resp in openai.Completion.create(model='text-davinci-003',
                                                           prompt="ONLY RESPOND 'hi'\n",
                                                           max_tokens=2,
                                                           temperature=0,
                                                           stream=True)]

    streamed_response = "".join(
        [resp["choices"][0]["text"] for resp in responses])
    assert "hi" in streamed_response.lower()
    print("passed streamed response test")


def test_streamed_chat_response():
    print("testing streamed response")
    responses = [resp for resp in openai.ChatCompletion.create(model='gpt-3.5-turbo',
                                                               messages=[
                                                                   {
                                                                       "role": "system",
                                                                       "content": "ONLY RESPOND 'hi'\n"
                                                                   }
                                                               ],
                                                               max_tokens=2,
                                                               temperature=0,
                                                               stream=True)]

    streamed_response = "".join(
        [resp["choices"][0]["delta"]["content"] for resp in responses if resp["choices"][0]["delta"].get("content")])
    print(streamed_response)
    assert "hi" in streamed_response.lower()
    print("passed streamed response test")


def test_prompt_format():
    prompt: dict = {
        "prompt":  "ONLY RESPOND '{{word}}'\n",
        "values": {
            "word": "hi",
        }
    }
    print("testing prompt format")
    x = openai.Completion.create(
        engine='text-davinci-003',
        max_tokens=2,
        temperature=0,
        prompt=json.dumps(prompt),
        headers={
            "Helicone-Prompt-Format": "enabled"
        }
    )
    # print("x", x)
    assert "hi" in x.choices[0].text.lower()
    print("passed prompt format test")


def test_cached_response():
    random_id = str(time.time())

    def call_api(cached_enabled: bool):
        openai.Completion.create(
            model='text-davinci-003',
            prompt=f"{random_id} ONLY RESPOND 'hi'\n",
            max_tokens=2,
            temperature=0,
            headers={
                "Helicone-Cache-Enabled": "true" if cached_enabled else "false",
            }
        )
    print("testing cache")

    start_time_nocache = time.time()
    call_api(False)
    end_time_nocache = time.time()
    print("nocache", end_time_nocache - start_time_nocache)
    call_api(True)
    time.sleep(.1)
    start_time_cache = time.time()
    call_api(True)
    end_time_cache = time.time()
    print("cache", end_time_cache - start_time_cache)
    assert end_time_cache - start_time_cache < end_time_nocache - start_time_nocache


async def create_completion_async(model, prompt, max_tokens, temperature):
    url = f"https://api.openai.com/v1/completions"
    headers = {
        "Authorization": f"Bearer {openai.api_key}",
        "Content-Type": "application/json",
        "OpenAI-Organization": "",
    }
    data = {
        "prompt": prompt,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "model": model,
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        print(response.status_code)
        return response.json()


# async def test_retries():
#     print("testing retries")

#     number_of_loops = 300
#     # Exute a bunch of requests to make sure we don't get a 429
#     # Do them in parallel to make sure we don't get a 429
#     # from the rate limiter
#     tasks = [
#         create_completion_async(
#             model='text-davinci-003',
#             prompt="hi",
#             max_tokens=2,
#             temperature=0,
#         )
#         for _ in range(number_of_loops)
#     ]
#     responses = await asyncio.gather(*tasks)
#     for idx, response in enumerate(responses):
#         print(f"Response {idx + 1}: {response['choices'][0]['text']}")


# asyncio.run(test_retries())
test_prompt_format()
test_cached_response()
test_streamed_response()
test_streamed_chat_response()
test_streamed_response_delays()

assert_stream_and_not_stream_same_tokens(prompt="ONLY RESPOND 'hi' exactly 10 times\n",
                                         max_tokens=10,
                                         temperature=0,
                                         model='text-davinci-003')


assert_stream_and_not_stream_same_tokens(model='gpt-3.5-turbo',
                                         messages=[
                                             {
                                                 "role": "system",
                                                 "content": "ONLY RESPOND 'hi' 10 times\n"
                                             }, {
                                                 "role": "assistant",
                                                 "content": "ONLY RESPOND 'hi' 10 times\n"
                                             },
                                             {
                                                 "role": "assistant",
                                                 "content": "ONLY RESPOND 'hi' 10 times\n"
                                             }, {
                                                 "role": "assistant",
                                                 "content": "ONLY RESPOND 'hi' 10 times\n"
                                             }
                                         ],
                                         max_tokens=100,
                                         temperature=0)
