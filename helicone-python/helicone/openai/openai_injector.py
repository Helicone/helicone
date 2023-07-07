import datetime
import functools
import inspect
import json
import logging
import os
import threading
import uuid
import warnings
from typing import Callable, Mapping

import aiohttp
import openai
import requests
from openai.api_resources import (ChatCompletion, Completion, Edit, Embedding,
                                  Image, Moderation)

from helicone.async_logger.async_logger import (HeliconeAsyncLogger,
                                                HeliconeAyncLogRequest,
                                                Provider, ProviderRequest,
                                                ProviderResponse, Timing,
                                                UnixTimeStamp)
from helicone.globals import helicone_global

helicone_global.base_url = "https://oai.hconeai.com/v1"


class CreateArgsExtractor:

    def __init__(self,
                 api_key=None,
                 api_base=None,
                 api_type=None,
                 request_id=None,
                 api_version=None,
                 organization=None,
                 **kwargs):
        self.kwargs = kwargs
        self.kwargs["api_key"] = api_key
        self.kwargs["api_base"] = api_base
        self.kwargs["api_type"] = api_type
        self.kwargs["request_id"] = request_id
        self.kwargs["api_version"] = api_version
        self.kwargs["organization"] = organization

    def get_args(self):
        return self.kwargs

    def get_body(self):
        return self.kwargs


class OpenAIInjector:
    def __init__(self):
        pass

    def update_response_headers(self, result, helicone_request_id):
        result["helicone_request_id"] = helicone_request_id

    def _result_interceptor(self,
                            result,
                            helicone_meta: dict,
                            send_response: Callable[[dict], None] = None):

        def generator_intercept_packets():
            response = {}
            response["streamed_data"] = []
            for r in result:
                r["helicone_meta"] = helicone_meta
                response["streamed_data"].append(json.loads(r.__str__()))
                yield r
            send_response(response)

        if inspect.isgenerator(result):
            return generator_intercept_packets()
        else:
            result["helicone_meta"] = helicone_meta
            send_response(json.loads(result.__str__()))

            return result

    def _result_interceptor_async(self,
                                  result,
                                  helicone_meta: dict,
                                  send_response: Callable[[dict], None] = None):

        async def generator_intercept_packets():
            response = {}
            response["streamed_data"] = []
            for r in result:
                r["helicone_meta"] = helicone_meta
                response["streamed_data"].append(json.loads(r.__str__()))
                yield r
            send_response(response)

        if inspect.isgenerator(result):
            return generator_intercept_packets()
        else:
            result["helicone_meta"] = helicone_meta
            send_response(json.loads(result.__str__()))

            return result

    def _with_helicone_auth(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            logger = HeliconeAsyncLogger.from_helicone_global()

            arg_extractor = CreateArgsExtractor(*args, **kwargs)
            now = datetime.datetime.now()

            providerRequest = ProviderRequest(
                url="N/A",
                json=arg_extractor.get_body(),
                meta={}
            )
            try:
                result = func(**arg_extractor.get_args())
            except Exception as e:
                later = datetime.datetime.now()
                async_log = HeliconeAyncLogRequest(
                    providerRequest=providerRequest,
                    providerResponse=ProviderResponse(
                        json={
                            "error": str(e)
                        },
                        status=500,
                        headers={
                            "openai-version": "ligmaligma"
                        }
                    ),
                    timing=Timing.from_datetimes(now, later)
                )
                logger.log(async_log, Provider.OPENAI)

                raise e

            def send_response(response):
                later = datetime.datetime.now()
                async_log = HeliconeAyncLogRequest(
                    providerRequest=providerRequest,
                    providerResponse=ProviderResponse(
                        json=response,
                        status=200,
                        headers={
                            "openai-version": "ligmaligma"
                        }

                    ),
                    timing=Timing.from_datetimes(now, later)
                )
                print("logging", async_log, Provider.OPENAI)

                logger.log(async_log, Provider.OPENAI)

            return self._result_interceptor(result,
                                            {},
                                            send_response)

        return wrapper

    def _with_helicone_auth_async(self, func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            logger = HeliconeAsyncLogger.from_helicone_global()

            arg_extractor = CreateArgsExtractor(*args, **kwargs)
            now = datetime.datetime.now()

            providerRequest = ProviderRequest(
                url="N/A",
                json=arg_extractor.get_body(),
                meta={}
            )
            try:
                result = await func(**arg_extractor.get_args())
            except Exception as e:
                later = datetime.datetime.now()
                async_log = HeliconeAyncLogRequest(
                    providerRequest=providerRequest,
                    providerResponse=ProviderResponse(
                        json={
                            "error": str(e)
                        },
                        status=500,
                        headers={
                            "openai-version": "ligmaligma"
                        }
                    ),
                    timing=Timing.from_datetimes(now, later)
                )
                logger.log(async_log, Provider.OPENAI)

                raise e

            def send_response(response):
                later = datetime.datetime.now()
                async_log = HeliconeAyncLogRequest(
                    providerRequest=providerRequest,
                    providerResponse=ProviderResponse(
                        json=response,
                        status=200,
                        headers={
                            "openai-version": "ligmaligma"
                        }

                    ),
                    timing=Timing.from_datetimes(now, later)
                )
                print("logging", async_log, Provider.OPENAI)

                logger.log(async_log, Provider.OPENAI)

            return self._result_interceptor_async(result,
                                                  {},
                                                  send_response)

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
