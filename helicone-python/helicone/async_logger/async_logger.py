from dataclasses import dataclass
import dataclasses
from enum import Enum
from typing import Optional
import requests
import os


@dataclass
class ProviderRequest:
    url: str
    body: dict
    meta: dict


@dataclass
class ProviderResponse:
    body: dict
    status: int
    headers: dict


@dataclass
class UnixTimeStamp:
    seconds: int
    milliseconds: int


@dataclass
class Timing:
    startTime: UnixTimeStamp
    endTime: UnixTimeStamp


@dataclass
class HeliconeAyncLogRequest:
    providerRequest: ProviderRequest
    providerResponse: ProviderResponse
    timing: Timing


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

    def log(self, request: HeliconeAyncLogRequest, provider: Provider):
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
