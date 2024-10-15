import datetime
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict
import requests
import json
import asyncio
import aiohttp
import pandas as pd
import os


HELICONE_API_KEY = os.getenv("HELICONE_API_KEY")


@dataclass
class RequestProperties:
    convoid: str | None
    flagmsg: str | None
    function: str | None
    ratingnum: str | None
    agent: str | None
    rawquery: str | None


@dataclass
class ResponseData:
    response_id: str
    response_created_at: str
    response_body: Dict[str, Any]
    response_status: int
    request_id: str
    request_created_at: str
    request_body: Dict[str, Any]
    country_code: str
    request_path: str
    request_user_id: str
    request_properties: RequestProperties
    provider: str
    request_model: str
    model_override: Optional[Any]
    response_model: str
    request_feedback: Optional[Any]
    helicone_user: str
    delay_ms: int
    time_to_first_token: Optional[Any]
    total_tokens: int
    completion_tokens: int
    prompt_tokens: int
    prompt_id: str
    feedback_created_at: Optional[Any]
    feedback_id: Optional[Any]
    feedback_rating: Optional[Any]
    asset_ids: Optional[Any]
    scores: Optional[Any]
    signed_body_url: str
    costUSD: float
    asset_urls: Optional[Any] = None
    signed_body_content: Optional[Dict[str, Any]] = None


@dataclass
class APIResponse:
    data: List[ResponseData]
    error: Optional[Any]


def make_request(start_time, end_time, offset) -> APIResponse:

    timeFilter = {
        "left": {
            "request": {
                "created_at": {
                    "gte": start_time
                }
            }
        },
        "right": {
            "request": {
                "created_at": {
                    "lt": end_time
                }
            }
        },
        "operator": "and"
    }

    payload = {
        "filter": timeFilter,
        # "filter": {
        #     "left": timeFilter,
        #     "right":
        #     {
        #         "response": {
        #             "model": {
        #                 "contains": "meta-llama/Meta-Llama-3.1-40"
        #             }
        #         }
        #     },
        #     "operator": "and"
        # },
        "isCached": False,
        "limit": 100,  # Increase limit to get more data per request
        "offset": offset,
        "sort": {"created_at": "asc"}
    }
    headers = {
        "authorization": f"Bearer {HELICONE_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.request(
        "POST", url="https://api.helicone.ai/v1/request/query", json=payload, headers=headers)
    response_data = json.loads(response.text)

    # print(response_data)

    if (response_data['error']):
        return APIResponse(data=[], error=response_data['error'])

    # Convert dictionaries to ResponseData objects
    response_data['data'] = [
        ResponseData(**{  # type: ignore
            **data,
            'request_properties': RequestProperties(
                convoid=data.get('request_properties').get('convoid') or None,
                flagmsg=data.get('request_properties').get('flagmsg') or None,
                function=data.get('request_properties').get(
                    'function') or None,
                ratingnum=data.get('request_properties').get(
                    'ratingnum') or None,
                agent=data.get('request_properties').get('agent') or None,
                rawquery=data.get('request_properties').get('rawquery') or None
            )
        }) for data in response_data['data']
    ]

    api_response = APIResponse(**response_data)

    return api_response


async def fetch_signed_body_async(session: aiohttp.ClientSession, url: str) -> Dict[str, Any]:
    async with session.get(url) as response:
        content = await response.read()
        content = json.loads(content)
    return content


async def fetch_all_signed_bodies(data: List[ResponseData]):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_signed_body_async(
            session, d.signed_body_url) for d in data]
        for d, task in zip(data, asyncio.as_completed(tasks)):
            try:
                d.signed_body_content = await task
            except Exception as e:
                print(
                    f"Failed to fetch or decode signed_body_url for response_id {d.response_id}: {e}")
                raise e


def write_data_to_csv(data: List[ResponseData], file_name: str):
    # Convert the list of ResponseData to a list of dictionaries
    data_dicts = [asdict(d) for d in data]
    for d in data_dicts:
        if isinstance(d['request_properties'], RequestProperties):
            d['request_properties'] = asdict(d['request_properties'])

    # Convert the list of dictionaries to a pandas DataFrame
    df = pd.DataFrame(data_dicts)

    # Write the DataFrame to a CSV file
    df.to_csv(file_name, index=False)


def get_all_data(start_time, end_time: str, step_hours: int, file_name: str) -> List[ResponseData]:
    all_data: List[ResponseData] = []
    current_time = datetime.datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')
    start_time = datetime.datetime.strptime(start_time, '%Y-%m-%d %H:%M:%S')
    next_time = start_time + datetime.timedelta(hours=step_hours)
    if next_time > current_time:
        next_time = current_time

    while start_time < current_time:
        print(
            f"Fetching data from {start_time} to {next_time}: {len(all_data)} records fetched so far")
        offset = 0
        while True:

            api_response = make_request(start_time.strftime('%Y-%m-%d %H:%M:%S'),
                                        next_time.strftime('%Y-%m-%d %H:%M:%S'), offset)

            print("fetching ", len(api_response.data), "bodies")
            if not api_response or len(api_response.data) == 0:
                print("No more data to fetch - going next")
                break

            retries = 3
            while retries > 0:
                try:
                    if (retries < 3 or api_response.error):
                        api_response = make_request(start_time.strftime('%Y-%m-%d %H:%M:%S'),
                                                    next_time.strftime('%Y-%m-%d %H:%M:%S'), offset)
                    asyncio.run(fetch_all_signed_bodies(api_response.data))
                    all_data.extend(api_response.data)
                    # Write data incrementally
                    write_data_to_csv(all_data, file_name)
                    break
                except Exception as e:
                    print(f"Failed to fetch signed bodies: {
                          e}, retrying {retries} more times")
                    retries -= 1

            offset += 100  # Increment offset to paginate through results

        start_time = next_time
        next_time = start_time + datetime.timedelta(hours=step_hours)
        if next_time > current_time:
            next_time = current_time

    return all_data


dates = [
    ["2024-08-02 00:00:00", "2024-08-03 00:00:00"],
    ["2024-08-03 00:00:00", "2024-08-04 00:00:00"],
    ["2024-08-04 00:00:00", "2024-08-05 00:00:00"],
    ["2024-08-05 00:00:00", "2024-08-06 00:00:00"],
    ["2024-08-06 00:00:00", "2024-08-07 00:00:00"],
]

for date_range in dates:
    start_time_input = date_range[0]
    end_time_input = date_range[1]
    step_hours = 1  # Configurable step size in hours
    file_name = f'output_{start_time_input}_{end_time_input}.csv'
    all_data = get_all_data(
        start_time_input, end_time_input, step_hours, file_name)
    print(f"Data written to {file_name}")
