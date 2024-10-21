import dataclasses
import datetime
import os
import time
from dataclasses import dataclass
from enum import Enum
from typing import Optional
from helicone.requester import Requests

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
    requests: Requests

    def __init__(self,
                 base_url: Optional[str] = None,
                 api_key:  Optional[str] = None,
                 ) -> None:
        self.requests = Requests(base_url, api_key)

    @staticmethod
    def from_helicone_global() -> 'HeliconeAsyncLogger':
        return HeliconeAsyncLogger()

    def log(self, request: HeliconeAyncLogRequest,
            provider: Provider,
            meta: Optional[HeliconeMeta] = None
            ):
        if provider == Provider.OPENAI:
            self.requests.post(
                json=dataclasses.asdict(request),
                path="/oai/v1/log"
            )
        elif provider == Provider.AZURE_OPENAI:
            self.requests.post(
                path="/oai/v1/log",
                json=dataclasses.asdict(request),
            )
        elif provider == Provider.ANTHROPIC:
            self.requests.post(
                path="/anthropic/v1/log",
                json=dataclasses.asdict(request),
            )
        else:
            raise ValueError(f"Unknown provider {provider}")
