from dataclasses import dataclass
import functools
from typing import Optional, TypedDict, Union
import uuid
import inspect
from helicone.globals import helicone_global
import openai
import requests
from openai.api_resources import (
    ChatCompletion,
    Completion,
    Edit,
    Embedding,
    Image,
    Moderation,
)
import logging
import threading

logger = logging.getLogger(__name__)


class AttributeDict(dict):
    def __init__(self, *args, **kwargs):
        super(AttributeDict, self).__init__(*args, **kwargs)
        self.__dict__ = self


def normalize_data_type(data_type):
    if isinstance(data_type, str):
        data_type = data_type.lower()

    if data_type in (str, "str", "string"):
        return "string"
    elif data_type in (bool, "bool", "boolean"):
        return "boolean"
    elif data_type in (float, int, "float", "int", "numerical"):
        return "numerical"
    elif data_type in (object, "object", "categorical"):
        return "categorical"
    else:
        raise ValueError(
            "Invalid data_type provided. Please use a valid data type or string.")


def prepare_api_base(**kwargs):
    original_api_base = openai.api_base
    if original_api_base != helicone_global.proxy_url:
        kwargs["headers"].update(
            {"Helicone-OpenAI-Api-Base": original_api_base})

    openai.api_base = helicone_global.proxy_url

    if openai.api_type == "azure":
        if helicone_global.proxy_url.endswith('/v1'):
            if helicone_global.proxy_url != "https://oai.hconeai.com/v1":
                logging.warning(
                    f"Detected likely invalid Azure API URL when proxying Helicone with proxy url {helicone_global.proxy_url}. Removing '/v1' from the end.")
            openai.api_base = helicone_global.proxy_url[:-3]

    return original_api_base, kwargs


@dataclass
class HeliconeRetryProps:
    num: Optional[int] = None
    factor: Optional[float] = None
    min_timeout: Optional[float] = None
    max_timeout: Optional[float] = None


@dataclass
class HeliconeProxyMeta:
    node_id: Optional[str] = None
    retry: Optional[Union[HeliconeRetryProps, bool]] = False
    cache: Optional[bool] = False
    rate_limit_policy: Optional[str] = None


class OpenAIInjector:
    def __init__(self):
        self.openai = openai
        self.headers_store = {}

    def log_feedback(self, response, name, value, data_type=None):
        helicone_id = response.get("helicone", {}).get("id")
        if not helicone_id:
            raise ValueError(
                "The provided response does not have a valid Helicone ID.")

        feedback_data = {
            "helicone-id": helicone_id,
            "name": name,
            "value": value,
        }
        if data_type:
            feedback_data["data-type"] = normalize_data_type(data_type)

        url = f"{helicone_global.proxy_url}/feedback"

        headers = {
            "Content-Type": "application/json",
            "Helicone-Auth": f"Bearer {helicone_global.api_key}",
        }

        response = requests.post(url, headers=headers, json=feedback_data)
        if response.status_code != 200:
            logger.error(f"HTTP error occurred: {response.status_code}")
            logger.error(
                f"Response content: {response.content.decode('utf-8', 'ignore')}")

            response.raise_for_status()
        return response.json()

    def _pull_out_meta(self, **kwargs) -> tuple[HeliconeProxyMeta, dict]:
        if ("heliconeMeta" in kwargs and isinstance(kwargs["heliconeMeta"], HeliconeProxyMeta)):
            return kwargs.pop("heliconeMeta"), kwargs

        meta = HeliconeProxyMeta()
        for key in HeliconeProxyMeta.__annotations__.keys():
            if key in kwargs:
                setattr(meta, key, kwargs.pop(key))

        return meta, kwargs

    def _push_meta_to_headers(self, meta: HeliconeProxyMeta, headers: dict) -> dict:
        if (meta.cache):
            headers["Helicone-Cache-Enabled"] = "true"
        if (meta.retry):
            if (isinstance(meta.retry, bool)):
                headers["Helicone-Retry-Enabled"] = "true" if meta.retry else "false"
            else:
                headers["Helicone-Retry-Enabled"] = "true"
                headers.update(self._get_retry_headers(meta.retry))
        if (meta.rate_limit_policy):
            headers["Helicone-RateLimit-Policy"] = meta.rate_limit_policy
        if (meta.node_id):
            headers["Helicone-Node-Id"] = meta.node_id
        return headers

    def _prepare_headers(self, **kwargs):
        headers = kwargs.get("headers", {})

        if "Helicone-Auth" not in headers and helicone_global.api_key:
            headers["Helicone-Auth"] = f"Bearer {helicone_global.api_key}"

        # Generate a UUID and add it to the headers
        helicone_request_id = str(uuid.uuid4())
        headers["helicone-request-id"] = helicone_request_id

        headers.update(self._get_property_headers(
            kwargs.pop("properties", {})))

        meta, kwargs = self._pull_out_meta(**kwargs)
        headers = self._push_meta_to_headers(meta, headers)

        kwargs["headers"] = headers

        return helicone_request_id, kwargs

    def update_response_headers(self, result, helicone_request_id):
        headers = self.headers_store.get(helicone_request_id, {})
        result["helicone"] = AttributeDict(
            id=headers.get("Helicone-Id"),
            status=headers.get("Helicone-Status"),
            cache=headers.get("Helicone-Cache"),
            rate_limit=AttributeDict(
                limit=headers.get("Helicone-RateLimit-Limit"),
                remaining=headers.get("Helicone-RateLimit-Remaining"),
                reset=headers.get("Helicone-RateLimit-Reset"),
                policy=headers.get("Helicone-RateLimit-Policy"),
            ) if headers.get("Helicone-RateLimit-Policy") else None,
        )

    def _modify_result(self, result, helicone_request_id):
        def result_with_helicone():
            for r in result:
                self.update_response_headers(r, helicone_request_id)
                yield r

        if inspect.isgenerator(result):
            return result_with_helicone()
        else:
            self.update_response_headers(result, helicone_request_id)
            return result

    async def _modify_result_async(self, result, helicone_request_id):
        async def result_with_helicone_async():
            async for r in result:
                self.update_response_headers(r, helicone_request_id)
                yield r

        if inspect.isasyncgen(result):
            return result_with_helicone_async()
        else:
            self.update_response_headers(result, helicone_request_id)
            return result

    def _with_helicone_auth(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            helicone_request_id, kwargs = self._prepare_headers(**kwargs)
            original_api_base, kwargs = prepare_api_base(**kwargs)

            try:
                result = func(*args, **kwargs)
            finally:
                openai.api_base = original_api_base

            return self._modify_result(result, helicone_request_id)

        return wrapper

    def _with_helicone_auth_async(self, func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            helicone_request_id, kwargs = self._prepare_headers(**kwargs)
            original_api_base, kwargs = prepare_api_base(**kwargs)

            try:
                result = await func(*args, **kwargs)
            finally:
                openai.api_base = original_api_base

            return await self._modify_result_async(result, helicone_request_id)

        return wrapper

    def _get_property_headers(self, properties):
        return {f"Helicone-Property-{key}": str(value) for key, value in properties.items()}

    def _get_cache_headers(self, cache):
        return {"Helicone-Cache-Enabled": "true"} if cache is True else {}

    def _get_retry_headers(self, retry: Optional[HeliconeRetryProps]) -> dict:
        headers = {}
        if (retry.num):
            headers["Helicone-Retry-Num"] = str(retry.num)
        if (retry.factor):
            headers["Helicone-Retry-Factor"] = str(retry.factor)
        if (retry.min_timeout):
            headers["Helicone-Retry-Min-Timeout"] = str(retry.min_timeout)
        if (retry.max_timeout):
            headers["Helicone-Retry-Max-Timeout"] = str(retry.max_timeout)
        return headers

    def apply_helicone_auth(self_parent):
        def request_raw_patched(self, *args, **kwargs):
            helicone_id = kwargs["supplied_headers"]["helicone-request-id"]
            response = original_request_raw(self, *args, **kwargs)
            if helicone_id:
                with threading.Lock():
                    self_parent.headers_store[helicone_id] = response.headers
            return response

        async def arequest_raw_patched(self, *args, **kwargs):
            helicone_id = kwargs["supplied_headers"]["helicone-request-id"]
            response = await original_arequest_raw(self, *args, **kwargs)
            if helicone_id:
                with threading.Lock():
                    self_parent.headers_store[helicone_id] = response.headers
            return response

        original_request_raw = openai.api_requestor.APIRequestor.request_raw
        openai.api_requestor.APIRequestor.request_raw = request_raw_patched

        original_arequest_raw = openai.api_requestor.APIRequestor.arequest_raw
        openai.api_requestor.APIRequestor.arequest_raw = arequest_raw_patched

        api_resources_classes = [
            (ChatCompletion, "create", "acreate"),
            (Completion, "create", "acreate"),
            (Edit, "create", "acreate"),
            (Embedding, "create", "acreate"),
            (Image, "create", "acreate"),
            (Moderation, "create", "acreate"),
        ]

        for api_resource_class, method, async_method in api_resources_classes:
            create_method = getattr(api_resource_class, method)
            setattr(api_resource_class, method,
                    self_parent._with_helicone_auth(create_method))

            async_create_method = getattr(api_resource_class, async_method)
            setattr(api_resource_class, async_method,
                    self_parent._with_helicone_auth_async(async_create_method))


injector = OpenAIInjector()
injector.apply_helicone_auth()
