import asyncio
import json
import time
import traceback
from typing import (Any, AsyncIterable, AsyncIterator, Callable, Dict, List,
                    Literal, Optional, Tuple, TypedDict, TypeVar, Union)

import requests

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


class HeliconeLogBuilder:
    """
    HeliconeLogBuilder provides a simplified way to handle streaming LLM responses
    with better error handling and async support.
    """

    def __init__(self, logger, request, additional_headers=None):
        self.logger = logger
        self.request = request.copy()
        self.additional_headers = additional_headers or {}
        self.start_time = time.time() * 1000  # Convert to milliseconds
        self.end_time = 0
        self.response_body = ""
        self.error = None
        self.time_to_first_token = None
        self.stream_chunks = []
        self.status = 200
        self.was_cancelled = False

    def set_error(self, error):
        """Sets an error that occurred during the request"""
        self.error = error
        self.end_time = time.time() * 1000
        self.status = 500

    def add_model(self, model: str):
        self.request["model"] = model

    def add_response(self, body):
        """Sets the response body for non-streaming responses"""
        if isinstance(body, dict):
            self.response_body = json.dumps(body)
        else:
            self.response_body = str(body)
        self.end_time = time.time() * 1000

    def add_chunk(self, chunk):
        """Adds a chunk from a streaming response"""
        if self.time_to_first_token is None:
            self.time_to_first_token = time.time() * 1000 - self.start_time

        if isinstance(chunk, dict):
            self.stream_chunks.append(json.dumps(chunk))
        else:
            self.stream_chunks.append(str(chunk))

    async def send_log(self):
        """Sends the log to Helicone"""
        if self.end_time == 0:
            self.end_time = time.time() * 1000

        try:
            if self.was_cancelled:
                self.status = -3

            response = ""
            if self.stream_chunks:
                response = "\n".join(self.stream_chunks)
            else:
                response = self.response_body

            if self.error and not self.was_cancelled:
                error_str = str(self.error)
                if hasattr(self.error, '__traceback__'):
                    error_str = ''.join(traceback.format_exception(
                        type(self.error), self.error, self.error.__traceback__))
                response = error_str + "\n\n" + response

            # Convert to format expected by send_log
            options = {
                "start_time": self.start_time / 1000,  # Convert back to seconds
                "end_time": self.end_time / 1000,      # Convert back to seconds
                "additional_headers": self.additional_headers,
                "time_to_first_token_ms": self.time_to_first_token
            }

            # Send the log synchronously for now
            self.logger.send_log(None, self.request, response, options)
        except Exception as e:
            print(f"Error sending log to Helicone: {e}")
            raise e


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

            self.send_log(provider, request, result_recorder.get_results(), {
                "start_time": start_time,
                "end_time": end_time,
                "additional_headers": additional_headers
            })

            return result
        except Exception as e:
            print("Error during operation:", e)
            raise e

    def log_builder(self, request: Dict[str, Any], additional_headers: Optional[Dict[str, str]] = None) -> HeliconeLogBuilder:
        """Creates a new HeliconeLogBuilder"""
        return HeliconeLogBuilder(self, request, additional_headers)

    # Alias for backward compatibility with existing code
    def new_builder(self, request: Dict[str, Any], additional_headers: Optional[Dict[str, str]] = None) -> HeliconeLogBuilder:
        """Alias for log_builder"""
        return self.log_builder(request, additional_headers)

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
            "timeToFirstToken": options.get("time_to_first_token_ms") if options.get("time_to_first_token_ms") is not None else None
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
