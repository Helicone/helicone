from typing import Optional
from helicone.globals import helicone_global

import requests
from urllib.parse import urljoin


class Requests:
    base_url: str
    api_key: str
    fail_on_error: bool

    def __init__(self, base_url: Optional[str] = None,
                 api_key: Optional[str] = None,
                 fail_on_error: Optional[bool] = None
                 ):
        if (base_url is None):
            self.base_url = helicone_global.base_url
        else:
            self.base_url = base_url

        if (api_key is None):
            self.api_key = helicone_global.api_key
        else:
            self.api_key = api_key

        if (fail_on_error is not None):
            self.fail_on_error = fail_on_error
        else:
            self.fail_on_error = helicone_global.fail_on_error

    def post(self, path: str, json: dict) -> requests.Response:
        res = requests.post(
            url=urljoin(self.base_url, path),
            json=json,
            headers={
                "Authorization": f"Bearer {self.api_key}"
            }
        )
        if (res.status_code != 200):
            print(f"Failed to log to {path}. Status code {res.status_code}")

        if (self.fail_on_error):
            res.raise_for_status()
        return res

    def patch(self, path: str, json: dict) -> requests.Response:
        res = requests.patch(
            url=urljoin(self.base_url, path),
            json=json,
            headers={
                "Authorization": f"Bearer {self.api_key}"
            }
        )
        if (res.status_code != 200):
            print(f"Failed to log to {path}. Status code {res.status_code}")

        if (self.fail_on_error):
            res.raise_for_status()
        return res
