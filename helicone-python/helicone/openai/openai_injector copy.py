import functools
import uuid
import inspect
import os
import aiohttp
import openai
import requests
import warnings
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
import uuid
from typing import Callable, Mapping


from helicone.globals import helicone_global


class AttributeDict(dict):
    def __init__(self, *args, **kwargs):
        super(AttributeDict, self).__init__(*args, **kwargs)
        self.__dict__ = self


helicone_global.api_key = "sk-ql3xnfy-nokuanq-wpf2jci-jriay3k"
helicone_global.base_url = "https://oai.hconeai.com/v1"


def prepare_api_base(**kwargs):
    original_api_base = openai.api_base
    kwargs["headers"].update({"Helicone-OpenAI-Api-Base": original_api_base})

    openai.api_base = helicone_global.base_url

    if openai.api_type == "azure":
        if helicone_global.base_url.endswith('/v1'):
            if helicone_global.base_url != "https://oai.hconeai.com/v1":
                logging.warning(
                    f"Detected likely invalid Azure API URL when proxying Helicone with proxy url {proxy_url}. Removing '/v1' from the end.")
            openai.api_base = helicone_global.base_url[:-3]

    return original_api_base, kwargs


class RequestBuilder:
    def __init__(self):
        pass

    def add_response_body(response: requests.Response):
        pass

    def add_aresponse_body(response: aiohttp.ClientResponse):
        pass


def build_request_raw_patched(self,
                              original_callback,  # openai.api_requestor.APIRequestor.<request_raw|arequest_raw>
                              push_new_builder_fn: Callable[[RequestBuilder], None],
                              *args,
                              **kwargs):
    '''
    For args and kwargs see `request_raw` in /openai/api_requestor.py
    '''

    def request_raw_patched(self, *args, **kwargs):
        response = original_callback(self, *args, **kwargs)
        request_builder = RequestBuilder()

        with threading.Lock():
            push_new_builder_fn(request_builder)
        return response
    # helicone_id = kwargs["supplied_headers"]["helicone-request-id"]
    print("build_request_raw_patched")
    print(args, kwargs)
    response = original_request_raw(self, *args, **kwargs)
    print("response", response.headers)

    with threading.Lock():
        self_parent.headers_store[helicone_id] = response.headers
    return response


class OpenAIInjector:

    request_builders: Mapping[str, RequestBuilder]

    def __init__(self):
        self.headers_store = {}
        pass

    def _prepare_headers(self, **kwargs):
        headers = kwargs.get("headers", {})

        if "Helicone-Auth" not in headers and helicone_global.api_key:
            headers["Helicone-Auth"] = f"Bearer {helicone_global.api_key}"

        # Generate a UUID and add it to the headers
        helicone_request_id = str(uuid.uuid4())
        headers["helicone-request-id"] = helicone_request_id

        # headers.update(self._get_property_headers(
        #     kwargs.pop("properties", {})))
        # headers.update(self._get_cache_headers(kwargs.pop("cache", None)))
        # headers.update(self._get_retry_headers(kwargs.pop("retry", None)))
        # headers.update(self._get_rate_limit_policy_headers(
        # kwargs.pop("rate_limit_policy", None)))

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

    def _with_helicone_auth(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            helicone_request_id, kwargs = self._prepare_headers(**kwargs)
            original_api_base, kwargs = prepare_api_base(**kwargs)

            try:
                result = func(*args, **kwargs)
            finally:
                openai.api_base = original_api_base
            print("result", result)

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

    def apply_helicone_auth(self_parent):
        def request_raw_patched(self, *args, **kwargs):
            # helicone_id = kwargs["supplied_headers"]["helicone-request-id"]
            print("request_raw_patched")
            print(args, kwargs)
            response = original_request_raw(self, *args, **kwargs)
            print("response", response.headers)

            with threading.Lock():
                self_parent.headers_store[helicone_id] = response.headers
            return response

        # async def arequest_raw_patched(self, *args, **kwargs):
        #     helicone_id = kwargs["supplied_headers"]["helicone-request-id"]
        #     response = await original_arequest_raw(self, *args, **kwargs)
        #     if helicone_id:
        #         with threading.Lock():
        #             self_parent.headers_store[helicone_id] = response.headers
        #     return response

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
