import functools
import os
import openai
import warnings
from openai.api_resources import (
    Audio,
    ChatCompletion,
    Completion,
    Edit,
    Embedding,
    Image,
    Moderation,
)

class Helicone:
    def __init__(self):
        self.api_key = None
        self._check_env_var()
        self.apply_helicone_auth()

    def _check_env_var(self):
        if "HELICONE_API_KEY" in os.environ:
            self.api_key = os.environ["HELICONE_API_KEY"]
        else:
            warnings.warn("Helicone API key is not set as an environment variable.")

    def set_api_key(self, key: str):
        self.api_key = key

    def _with_helicone_auth(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Retrieve properties from kwargs and convert them into headers
            properties = kwargs.pop("properties", {})
            property_headers = {
                f"Helicone-Property-{key}": str(value)
                for key, value in properties.items()
            }

            headers = kwargs.get("headers", {})
            if "Helicone-Auth" not in headers and self.api_key:
                headers["Helicone-Auth"] = f"Bearer {self.api_key}"
                headers.update(property_headers)

                # Add cache header if cache kwarg is provided and set to True
                cache = kwargs.pop("cache", None)
                if cache is True:
                    headers["Helicone-Cache-Enabled"] = "true"

                # Add retry header if retry kwarg is provided and set to True
                retry = kwargs.pop("retry", None)
                if retry is True:
                    headers["Helicone-Retry-Enabled"] = "true"

                # Add rate limit policy header if rate_limit_policy kwarg is provided
                rate_limit_policy = kwargs.pop("rate_limit_policy", None)
                if rate_limit_policy:
                    policy = f'{rate_limit_policy["quota"]};w={rate_limit_policy["time_window"]}'
                    if "segment" in rate_limit_policy:
                        policy += f';s={rate_limit_policy["segment"]}'
                    headers["Helicone-RateLimit-Policy"] = policy

                kwargs["headers"] = headers

            original_api_base = openai.api_base
            openai.api_base = "https://oai.hconeai.com/v1"
            try:
                result = func(*args, **kwargs)
            finally:
                openai.api_base = original_api_base

            return result

        return wrapper


    def apply_helicone_auth(self):
        api_resources_classes = [
            (Audio, "transcribe"),
            (ChatCompletion, "create"),
            (Completion, "create"),
            (Edit, "create"),
            (Embedding, "create"),
            (Image, "create"),
            (Moderation, "create"),
        ]

        for api_resource_class, method in api_resources_classes:
            create_method = getattr(api_resource_class, method)
            setattr(api_resource_class, "create", self._with_helicone_auth(create_method))

# Initialize Helicone and apply authentication to the specified classes
helicone_instance = Helicone()

# Expose the methods for easy user access
api_key = helicone_instance.api_key
set_api_key = helicone_instance.set_api_key
