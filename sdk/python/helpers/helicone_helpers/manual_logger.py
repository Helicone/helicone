import time
import requests
from typing import Callable, TypeVar


T = TypeVar('T')


class HeliconeResultRecorder:
    def __init__(self):
        self.results = {}

    def append_results(self, data: dict):
        self.results.update(data)

    def get_results(self):
        return self.results


class HeliconeManualLogger:
    api_key: str
    headers: dict
    logging_endpoint: str

    def __init__(self, api_key: str, headers: dict = {}, logging_endpoint: str = "https://api.hconeai.com/custom/v1/log"):
        self.api_key = api_key
        self.headers = headers
        self.logging_endpoint = logging_endpoint

    def log_request(
        self,
        request: dict,
        operation: Callable[[HeliconeResultRecorder], T],
        additional_headers: dict = {}
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
        result_recorder = HeliconeResultRecorder()

        try:
            result = operation(result_recorder)
            end_time = time.time()

            self.__send_log(request, result_recorder.get_results(), {
                "start_time": start_time,
                "end_time": end_time,
                "additional_headers": additional_headers
            })

            return result
        except Exception as e:
            print("Error during operation:", e)
            raise e

    def __send_log(
        self,
        request: dict,
        response: dict,
        options: dict
    ):
        start_time = options.get("start_time")
        end_time = options.get("end_time")
        additional_headers = options.get("additional_headers")

        provider_request = {
            "url": "custom-model-nopath",
            "json": {
                **request
            },
            "meta": {}
        }

        provider_response = {
            "headers": self.headers,
            "status": 200,
            "json": {
                **response,
                "_type": request["_type"],
                "toolName": request["toolName"]
            }
        }

        timing = {
            "startTime": {
                "seconds": int(start_time),
                "milliseconds": int((start_time - int(start_time)) * 1000)
            },
            "endTime": {
                "seconds": int(end_time),
                "milliseconds": int((end_time - int(end_time)) * 1000)
            }
        }

        fetch_options = {
            "method": "POST",
            "headers": {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                **self.headers,
                **additional_headers
            },
            "body": {
                "providerRequest": provider_request,
                "providerResponse": provider_response,
                "timing": timing
            }
        }

        try:
            print("fetch_options", fetch_options)
            requests.post(
                self.logging_endpoint,
                json=fetch_options["body"],
                headers=fetch_options["headers"]
            )
        except Exception as e:
            print("Error making request to Helicone log endpoint:", e)
