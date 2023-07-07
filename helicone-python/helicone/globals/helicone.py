

import logging
from typing import Optional
import os


logger = logging.getLogger(__name__)


class HeliconeGlobal:
    _api_key: Optional[str]
    _base_url: Optional[str]

    def __init__(self,
                 api_key: Optional[str] = None,
                 base_url: Optional[str] = None
                 ):
        self._api_key = api_key
        self._base_url = base_url

    @property
    def api_key(self) -> Optional[str]:
        if (self._api_key is None):
            self._api_key = os.environ.get("HELICONE_API_KEY")

        return self._api_key

    @api_key.setter
    def api_key(self, value: Optional[str]):
        self._api_key = value

    @property
    def base_url(self) -> Optional[str]:
        return self._base_url

    @base_url.setter
    def base_url(self, value: Optional[str]):
        self._base_url = value


helicone_global = HeliconeGlobal()
