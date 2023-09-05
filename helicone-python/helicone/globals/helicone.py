

import logging
from typing import Optional
import os


logger = logging.getLogger(__name__)


class HeliconeGlobal:
    _api_key: Optional[str]
    _base_url: Optional[str]
    _proxy_url: Optional[str]
    _fail_on_error: bool = False

    def __init__(self,
                 api_key: Optional[str] = None,
                 base_url: Optional[str] = None,
                 proxy_url: Optional[str] = None,
                 fail_on_error: Optional[bool] = None
                 ):
        self._api_key = api_key
        self._base_url = base_url
        self._proxy_url = proxy_url
        if (fail_on_error is not None):
            self._fail_on_error = fail_on_error

    @property
    def fail_on_error(self) -> bool:
        return self._fail_on_error

    @fail_on_error.setter
    def fail_on_error(self, value: bool):
        self._fail_on_error = value

    @property
    def api_key(self) -> Optional[str]:
        if (self._api_key is None):
            return os.environ.get("HELICONE_API_KEY")

        return self._api_key

    @api_key.setter
    def api_key(self, value: Optional[str]):
        self._api_key = value

    @property
    def base_url(self) -> Optional[str]:
        if (self._base_url is None):
            return "https://api.hconeai.com"
        return self._base_url

    @base_url.setter
    def base_url(self, value: Optional[str]):
        self._base_url = value

    @property
    def proxy_url(self) -> Optional[str]:
        if (self._proxy_url is None):
            return "http://oai.hconeai.com/v1"
        return self._proxy_url

    @proxy_url.setter
    def proxy_url(self, value: Optional[str]):
        self._proxy_url = value


helicone_global = HeliconeGlobal()
