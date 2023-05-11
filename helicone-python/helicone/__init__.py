import functools
import inspect
import os
import openai
import warnings
from openai.api_resources import (
    ChatCompletion,
    Completion,
    Edit,
    Embedding,
    Image,
    Moderation,
)

class Helicone:
    def __init__(self):
        self._api_key = None
        self._check_env_var()
        self.apply_helicone_auth()

    def _check_env_var(self):
        if "HELICONE_API_KEY" in os.environ:
            self.api_key = os.environ["HELICONE_API_KEY"]
        else:
            warnings.warn("Helicone API key is not set as an environment variable.")

    @property
    def api_key(self):
        return self._api_key
    
    @api_key.setter
    def api_key(self, key: str):
        self._api_key = key

    def _with_helicone_auth(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            headers = kwargs.get("headers", {})

            if "Helicone-Auth" not in headers and self.api_key:
                headers["Helicone-Auth"] = f"Bearer {self.api_key}"

            headers.update(self._get_property_headers(kwargs.pop("properties", {})))
            headers.update(self._get_cache_headers(kwargs.pop("cache", None)))
            headers.update(self._get_retry_headers(kwargs.pop("retry", None)))
            headers.update(self._get_rate_limit_policy_headers(kwargs.pop("rate_limit_policy", None)))

            kwargs["headers"] = headers

            original_api_base = openai.api_base
            openai.api_base = "https://oai.hconeai.com/v1"
            try:
                result = func(*args, **kwargs)
            finally:
                openai.api_base = original_api_base

            return result

        return wrapper
    
    def _with_helicone_auth_async(self, func):
        @functools.wraps(func)
        async def async_func_wrapper(*args, **kwargs):
            headers = kwargs.get("headers", {})

            if "Helicone-Auth" not in headers and self.api_key:
                headers["Helicone-Auth"] = f"Bearer {self.api_key}"

            headers.update(self._get_property_headers(kwargs.pop("properties", {})))
            headers.update(self._get_cache_headers(kwargs.pop("cache", None)))
            headers.update(self._get_retry_headers(kwargs.pop("retry", None)))
            headers.update(self._get_rate_limit_policy_headers(kwargs.pop("rate_limit_policy", None)))

            kwargs["headers"] = headers

            original_api_base = openai.api_base
            openai.api_base = "https://oai.hconeai.com/v1"
            try:
                return await func(*args, **kwargs)
            finally:
                openai.api_base = original_api_base

        @functools.wraps(func)
        async def async_gen_wrapper(*args, **kwargs):
            headers = kwargs.get("headers", {})

            if "Helicone-Auth" not in headers and self.api_key:
                headers["Helicone-Auth"] = f"Bearer {self.api_key}"

            headers.update(self._get_property_headers(kwargs.pop("properties", {})))
            headers.update(self._get_cache_headers(kwargs.pop("cache", None)))
            headers.update(self._get_retry_headers(kwargs.pop("retry", None)))
            headers.update(self._get_rate_limit_policy_headers(kwargs.pop("rate_limit_policy", None)))

            kwargs["headers"] = headers

            original_api_base = openai.api_base
            openai.api_base = "https://oai.hconeai.com/v1"
            try:
                async for item in func(*args, **kwargs):
                    yield item
            finally:
                openai.api_base = original_api_base

        return async_gen_wrapper if inspect.isasyncgenfunction(func) else async_func_wrapper


    def _get_property_headers(self, properties):
        return {f"Helicone-Property-{key}": str(value) for key, value in properties.items()}

    def _get_cache_headers(self, cache):
        return {"Helicone-Cache-Enabled": "true"} if cache is True else {}

    def _get_retry_headers(self, retry):
        if isinstance(retry, bool) and retry:
            return {"Helicone-Retry-Enabled": "true"}
        elif isinstance(retry, dict):
            headers = {"Helicone-Retry-Enabled": "true"}
            if "num" in retry:
                headers["Helicone-Retry-Num"] = str(retry["num"])
            if "factor" in retry:
                headers["Helicone-Retry-Factor"] = str(retry["factor"])
            if "min_timeout" in retry:
                headers["Helicone-Retry-Min-Timeout"] = str(retry["min_timeout"])
            if "max_timeout" in retry:
                headers["Helicone-Retry-Max-Timeout"] = str(retry["max_timeout"])
            return headers
        return {}

    def _get_rate_limit_policy_headers(self, rate_limit_policy):
        if rate_limit_policy:
            if isinstance(rate_limit_policy, str):
                policy = rate_limit_policy
            elif isinstance(rate_limit_policy, dict):
                policy = f'{rate_limit_policy["quota"]};w={rate_limit_policy["time_window"]}'
                if "segment" in rate_limit_policy:
                    policy += f';s={rate_limit_policy["segment"]}'
            else:
                raise TypeError("rate_limit_policy must be either a string or a dictionary")
            return {"Helicone-RateLimit-Policy": policy}
        return {}


    def apply_helicone_auth(self):
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
            setattr(api_resource_class, method, self._with_helicone_auth(create_method))

            async_create_method = getattr(api_resource_class, async_method)
            setattr(api_resource_class, async_method, self._with_helicone_auth_async(async_create_method))

    

# Initialize Helicone and apply authentication to the specified classes
helicone_instance = Helicone()

# Expose the methods for easy user access
api_key = helicone_instance.api_key