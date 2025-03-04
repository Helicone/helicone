import time
import requests
from typing import Callable, Dict, Literal, Optional, TypeVar, Union, TypedDict


T = TypeVar('T')


class LoggingOptions(TypedDict, total=False):
    start_time: float
    end_time: float
    additional_headers: Dict[str, str]
    time_to_first_token_ms: Optional[float]


class HeliconeResultRecorder:
    def __init__(self, request: dict):
        self.request = request
        self.results = {}

    def append_results(self, data: dict):
        self.results.update(data)

    def get_results(self):
        return self.results


class HeliconeManualLogger:
    api_key: str
    headers: dict
    logging_endpoint: str

    def __init__(self, api_key: str, headers: dict = {}, logging_endpoint: str = "https://api.worker.helicone.ai"):
        self.api_key = api_key
        self.headers = dict(headers)
        self.logging_endpoint = logging_endpoint

    def log_request(
        self,
        request: dict,
        operation: Callable[[HeliconeResultRecorder], T],
        additional_headers: dict = {},
        provider: Optional[Union[Literal["openai", "anthropic"], str]] = None,
    ) -> T:
        """
        Logs a custom request to Helicone

        Args:
            request: The request object to log
            operation: The operation which will be executed and logged
            additional_headers: Additional headers to send with the request

        Returns:
            The result of the `operation` function
        """
        start_time = time.time()
        result_recorder = HeliconeResultRecorder(request)

        try:
            result = operation(result_recorder)
            end_time = time.time()

            self.__send_log(provider, request, result_recorder.get_results(), {
                "start_time": start_time,
                "end_time": end_time,
                "additional_headers": additional_headers
            })

            return result
        except Exception as e:
            print("Error during operation:", e)
            raise e

    def __get_logging_endpoint(self, provider: Optional[str]):
        if provider == "openai":
            return self.logging_endpoint + "/oai/v1/log"
        elif provider == "anthropic":
            return self.logging_endpoint + "/anthropic/v1/log"
        else:
            return self.logging_endpoint + "/custom/v1/log"

    def send_log(
        self,
        provider: Optional[str],
        request: dict,
        response: Union[dict, str],
        options: LoggingOptions
    ):
        start_time = options.get("start_time")
        end_time = options.get("end_time")
        additional_headers = dict(options.get("additional_headers", {}))

        provider_request = {
            "url": "custom-model-nopath",
            "json": {
                **request
            },
            "meta": {}
        }
        is_response_string = isinstance(response, str)

        provider_response = {
            "headers": self.headers,
            "status": 200,
            "json": {
                **response,
                "_type": request.get("_type", "unknown"),
                "toolName": request.get("toolName", "unknown"),
            } if not is_response_string else {},
            "textBody": response if is_response_string else None
        }

        timing = {
            "startTime": {
                "seconds": int(start_time),
                "milliseconds": int((start_time - int(start_time)) * 1000)
            },
            "endTime": {
                "seconds": int(end_time),
                "milliseconds": int((end_time - int(end_time)) * 1000)
            },
            "timeToFirstToken": options.get("time_to_first_token") if options.get("time_to_first_token") is not None else None
        }

        fetch_options = {
            "method": "POST",
            "headers": {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                **dict(self.headers),
                **additional_headers
            },
            "body": {
                "providerRequest": provider_request,
                "providerResponse": provider_response,
                "timing": timing
            }
        }

        try:
            result = requests.post(
                self.__get_logging_endpoint(provider),
                json=fetch_options["body"],
                headers=fetch_options["headers"]
            )
            if result.status_code != 200:
                print("Error making request to Helicone log endpoint:", result.text)
        except Exception as e:
            print("Error making request to Helicone log endpoint:", e)
