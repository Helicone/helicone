import dataclasses
import datetime
import os
import time
from dataclasses import dataclass
from enum import Enum
from typing import Optional

import requests

from helicone.globals.helicone import helicone_global


@dataclass
class ProviderRequest:
    url: str
    json: dict
    meta: dict


@dataclass
class ProviderResponse:
    json: dict
    status: int
    headers: dict


@dataclass
class UnixTimeStamp:
    seconds: int
    milliseconds: int

    @staticmethod
    def from_datetime(dt: datetime) -> 'UnixTimeStamp':
        timestamp = dt.timestamp()
        seconds = int(timestamp)
        milliseconds = int((timestamp - seconds) * 1000)
        return UnixTimeStamp(seconds, milliseconds)


@dataclass
class Timing:
    startTime: UnixTimeStamp
    endTime: UnixTimeStamp

    @staticmethod
    def from_datetimes(start: datetime, end: datetime) -> 'Timing':
        start_timestamp = UnixTimeStamp.from_datetime(start)
        end_timestamp = UnixTimeStamp.from_datetime(end)
        return Timing(start_timestamp, end_timestamp)


@dataclass
class HeliconeAyncLogRequest:
    providerRequest: ProviderRequest
    providerResponse: ProviderResponse
    timing: Timing


@dataclass
class HeliconeMeta:
    custom_properties: Optional[dict]
    user_id: Optional[str]


class Provider(Enum):
    OPENAI = "openai"
    AZURE_OPENAI = "azure-openai"
    ANTHROPIC = "anthropic"


class HeliconeAsyncLogger:
    base_url: str

    def __init__(self,
                 base_url: Optional[str] = None,
                 api_key:  Optional[str] = None,
                 ) -> None:
        self.base_url = base_url or "https://api.hconeai.com"
        self.api_key = api_key or os.environ.get("HELICONE_API_KEY")

    @staticmethod
    def from_helicone_global() -> 'HeliconeAsyncLogger':
        return HeliconeAsyncLogger(
            base_url=helicone_global.base_url,
            api_key=helicone_global.api_key
        )

    def _request(self, body: dict, url: str) -> requests.Response:
        res = requests.post(
            url=url,
            json=body,
            headers={
                "Authorization": f"Bearer {self.api_key}"
            }
        )
        if (res.status_code != 200):
            raise ValueError(
                f"Failed to log to {url}. Status code {res.status_code}")
        return res

    def log(self, request: HeliconeAyncLogRequest,
            provider: Provider,
            meta: Optional[HeliconeMeta] = None
            ):
        print("logging", request, provider)
        if provider == Provider.OPENAI:
            self._request(
                body=dataclasses.asdict(request),
                url=f"{self.base_url}/oai/v1/log"
            )
        elif provider == Provider.AZURE_OPENAI:
            self._request(
                url=f"{self.base_url}/oai/v1/log",
                body=dataclasses.asdict(request),
            )
        elif provider == Provider.ANTHROPIC:
            self._request(
                url=f"{self.base_url}/anthropic/v1/log",
                body=dataclasses.asdict(request),
            )
        else:
            raise ValueError(f"Unknown provider {provider}")
