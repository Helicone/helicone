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

helicone_global.api_key = "sk-ql3xnfy-nokuanq-wpf2jci-jriay3k"
helicone_global.base_url = "https://oai.hconeai.com/v1"


class OpenAIInjector:
    def __init__(self):
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
            pass

            # try:
            #     result = await func(*args, **kwargs)
            # finally:
            #     openai.api_base = original_api_base

            # return await self._modify_result_async(result, helicone_request_id)

        return wrapper

    def apply_helicone_auth(self_parent):
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
