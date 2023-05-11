import functools
import uuid
import inspect
import os
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

logging.basicConfig(level=logging.WARNING)

api_key = os.environ.get("HELICONE_API_KEY", None)
if (api_key is None):
    warnings.warn("Helicone API key is not set as an environment variable.")

base_url = os.environ.get("HELICONE_BASE_URL", "https://oai.hconeai.com/v1")

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
        raise ValueError("Invalid data_type provided. Please use a valid data type or string.")


api_key = os.environ.get("HELICONE_API_KEY", None)
if (api_key is None):
    warnings.warn("Helicone API key is not set as an environment variable.")

base_url = os.environ.get("HELICONE_BASE_URL", "https://oai.hconeai.com/v1")

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
        raise ValueError("Invalid data_type provided. Please use a valid data type or string.")


class Helicone:
    def __init__(self):
        self.openai = openai
        self.apply_helicone_auth()

    @property
    def api_key(self):
        global api_key
        return api_key

    @api_key.setter
    def api_key(self, value):
        global api_key
        api_key = value

    @property
    def base_url(self):
        global base_url
        return base_url

    @base_url.setter
    def base_url(self, value):
        global base_url
        base_url = value

    def log_feedback(self, response, name, value, data_type=None):
        helicone_id = response.get("helicone", {}).get("id")
        if not helicone_id:
            raise ValueError("The provided response does not have a valid Helicone ID.")

        feedback_data = {
            "helicone-id": helicone_id,
            "name": name,
            "value": value,
        }
        if data_type:
            feedback_data["data-type"] = normalize_data_type(data_type)

        url = f"{base_url}/feedback"

        headers = {
            "Content-Type": "application/json",
            "Helicone-Auth": f"Bearer {api_key}",
        }

        response = requests.post(url, headers=headers, json=feedback_data)
        response.raise_for_status()
        return response.json()


    def _with_helicone_auth(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            headers = kwargs.get("headers", {})

            if "Helicone-Auth" not in headers and api_key:
                headers["Helicone-Auth"] = f"Bearer {api_key}"

            # Generate a UUID and add it to the headers
            helicone_request_id = str(uuid.uuid4())
            headers["helicone-request-id"] = helicone_request_id

            headers.update(self._get_property_headers(kwargs.pop("properties", {})))
            headers.update(self._get_cache_headers(kwargs.pop("cache", None)))
            headers.update(self._get_retry_headers(kwargs.pop("retry", None)))
            headers.update(self._get_rate_limit_policy_headers(kwargs.pop("rate_limit_policy", None)))

            original_api_base = openai.api_base
            headers.update({"Helicone-OpenAI-Api-Base": original_api_base})

            kwargs["headers"] = headers

            original_api_base = openai.api_base
            openai.api_base = base_url

            if openai.api_type == "azure":
                if base_url.endswith('/v1'):
                    if base_url != "https://oai.hconeai.com/v1":
                        logging.warning(f"Detected likely invalid Azure API URL when proxying Helicone with proxy url {base_url}. Removing '/v1' from the end.")
                    openai.api_base = base_url[:-3]

            try:
                result = func(*args, **kwargs)
            finally:
                openai.api_base = original_api_base

            # Add the "helicone" field to the response object
            result["helicone"] = {"id": helicone_request_id}

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

    

helicone = Helicone()
log_feedback = helicone.log_feedback
