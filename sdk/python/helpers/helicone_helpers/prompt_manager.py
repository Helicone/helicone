import json
import requests
import httpx
from typing import Any, Dict, List, Optional, Union
from .types import (
    Prompt2025Version,
    ValidationError,
    PromptCompilationResult,
    HeliconeChatParams,
    ChatCompletionParams,
    PromptPartialVariable
)
from .template_manager import HeliconeTemplateManager


class HeliconePromptManager:
    """
    HeliconePromptManager provides functions to interact with Helicone's prompt management API
    and merge prompt bodies for use with OpenAI SDK.
    """
    
    def __init__(self, api_key: str, base_url: str = "https://api.helicone.ai"):
        """
        Initialize the HeliconePromptManager.
        
        Args:
            api_key: Your Helicone API key
            base_url: Base URL for Helicone API (defaults to https://api.helicone.ai)
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        })
        self._async_client: Optional[httpx.AsyncClient] = None
    
    @property
    def async_client(self) -> httpx.AsyncClient:
        """Get or create the async HTTP client instance."""
        if self._async_client is None:
            self._async_client = httpx.AsyncClient(
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
            )
        return self._async_client
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit - cleanup async client."""
        if self._async_client is not None:
            await self._async_client.aclose()
            self._async_client = None
    
    async def aclose(self):
        """Manually close the async client if needed."""
        if self._async_client is not None:
            await self._async_client.aclose()
            self._async_client = None
    
    def pull_prompt_version(self, params: HeliconeChatParams) -> Prompt2025Version:
        """
        Finds the prompt version dynamically based on prompt params.
        
        Args:
            params: The chat completion parameters containing prompt_id, optional version_id, 
                   environment, inputs, and other OpenAI parameters
                   
        Returns:
            The prompt version object
        """
        prompt_id = params.get("prompt_id")
        version_id = params.get("version_id")
        environment = params.get("environment")
        
        if environment:
            return self._get_environment_version(prompt_id, environment)
        if version_id:
            return self._get_prompt_version(version_id)
        return self._get_production_version(prompt_id)
    
    def pull_prompt_body(self, params: HeliconeChatParams) -> ChatCompletionParams:
        """
        Pulls a prompt body from Helicone storage based on prompt parameters.
        
        Args:
            params: The chat completion parameters containing prompt_id, optional version_id, 
                   environment, inputs, and other OpenAI parameters
            
        Returns:
            The raw prompt body from storage
            
        Raises:
            Exception: If API call fails or prompt not found
        """
        try:
            prompt_version = self.pull_prompt_version(params)
            prompt_body = self._fetch_prompt_body_from_s3(prompt_version.s3_url)
            return prompt_body
        except Exception as e:
            print(f"Error pulling prompt body: {e}")
            raise
    
    def pull_prompt_body_by_version_id(self, version_id: str) -> ChatCompletionParams:
        """
        Pulls a prompt body from Helicone storage by version ID.

        Args:
            version_id: The unique identifier of the prompt version

        Returns:
            The raw prompt body from storage

        Raises:
            Exception: If API call fails or prompt not found
        """
        try:
            prompt_version = self._get_prompt_version(version_id)
            prompt_body = self._fetch_prompt_body_from_s3(prompt_version.s3_url)
            return prompt_body
        except Exception as e:
            print(f"Error pulling prompt body: {e}")
            raise

    def extract_prompt_partials(
        self,
        source_prompt_body: ChatCompletionParams
    ) -> List[PromptPartialVariable]:
        """
        Extracts all prompt partial variables from a source prompt body.

        Args:
            source_prompt_body: The source prompt body to extract prompt partial variables from

        Returns:
            Array of unique prompt partial variables found in the body
        """
        all_partial_variables: List[PromptPartialVariable] = []
        seen_partials: set = set()

        # Extract prompt partial variables from all messages
        messages = source_prompt_body.get("messages", [])
        for message in messages:
            content = message.get("content")

            if isinstance(content, str):
                partial_vars = HeliconeTemplateManager.extract_prompt_partial_variables(content)

                for partial_var in partial_vars:
                    if partial_var.raw not in seen_partials:
                        seen_partials.add(partial_var.raw)
                        all_partial_variables.append(partial_var)

            elif isinstance(content, list):
                # Extract prompt partial variables from text parts in content arrays
                for content_part in content:
                    if isinstance(content_part, dict) and content_part.get("type") == "text":
                        text = content_part.get("text", "")
                        partial_vars = HeliconeTemplateManager.extract_prompt_partial_variables(text)

                        for partial_var in partial_vars:
                            if partial_var.raw not in seen_partials:
                                seen_partials.add(partial_var.raw)
                                all_partial_variables.append(partial_var)

        return all_partial_variables

    def get_prompt_partial_substitution_value(
        self,
        prompt_partial: PromptPartialVariable,
        source_body: ChatCompletionParams
    ) -> str:
        """
        Get the substitution value for a prompt partial.

        Args:
            prompt_partial: The prompt partial variable
            source_body: The source prompt body containing the message to extract

        Returns:
            The content of the message at the specified index
        """
        messages = source_body.get("messages")
        if not messages or prompt_partial.index < 0:
            return ""

        if prompt_partial.index >= len(messages):
            return ""

        chosen_message = messages[prompt_partial.index]
        if not chosen_message:
            return ""

        content = chosen_message.get("content")

        if isinstance(content, str):
            return content
        elif isinstance(content, list):
            # Extract text from all text content parts
            text_parts = []
            for content_part in content:
                if isinstance(content_part, dict) and content_part.get("type") == "text":
                    text = content_part.get("text", "")
                    if text:
                        text_parts.append(text)
            return " ".join(text_parts)

        return ""

    def merge_prompt_body(
        self,
        params: HeliconeChatParams,
        source_prompt_body: ChatCompletionParams,
        prompt_partial_inputs: Optional[Dict[str, Any]] = None
    ) -> PromptCompilationResult:
        """
        Merges prompt body with input parameters and variable substitution.

        Args:
            params: The chat completion parameters containing inputs and other OpenAI parameters
            source_prompt_body: The source prompt body to merge with
            prompt_partial_inputs: Optional map of prompt partial inputs for substitution

        Returns:
            PromptCompilationResult containing the compiled prompt body and any validation errors
        """
        errors: List[ValidationError] = []

        # Prepare substitution values from inputs
        substitution_values = params.get("inputs", {})
        partial_inputs = prompt_partial_inputs or {}

        # Merge and substitute messages
        pulled_messages = source_prompt_body.get("messages", [])
        input_messages = params.get("messages", [])
        merged_messages = pulled_messages + input_messages

        substituted_messages = []
        for message in merged_messages:
            if isinstance(message.get("content"), str):
                substituted = HeliconeTemplateManager.substitute_variables(
                    message["content"],
                    substitution_values,
                    partial_inputs
                )
                if not substituted.success:
                    errors.extend(substituted.errors or [])

                new_message = message.copy()
                new_message["content"] = (
                    substituted.result if substituted.success else message["content"]
                )
                substituted_messages.append(new_message)
            else:
                substituted_messages.append(message)
        
        # Substitute variables in response format if present
        final_response_format = source_prompt_body.get("response_format")
        if final_response_format:
            substituted_response_format = HeliconeTemplateManager.substitute_variables_json(
                final_response_format,
                substitution_values
            )
            if not substituted_response_format.success:
                errors.extend(substituted_response_format.errors or [])
            else:
                final_response_format = substituted_response_format.result
        
        # Substitute variables in tools if present
        final_tools = source_prompt_body.get("tools")
        if final_tools:
            substituted_tools = HeliconeTemplateManager.substitute_variables_json(
                final_tools,
                substitution_values
            )
            if not substituted_tools.success:
                errors.extend(substituted_tools.errors or [])
            else:
                final_tools = substituted_tools.result
        
        # Extract non-Helicone parameters from input
        input_openai_params = {k: v for k, v in params.items() 
                             if k not in ["prompt_id", "version_id", "inputs", "environment"]}
        
        # Remove messages, response_format, and tools from input params since we handle them specially
        input_openai_params.pop("messages", None)
        input_openai_params.pop("response_format", None)
        input_openai_params.pop("tools", None)
        
        # Merge pulled prompt body with input parameters
        # Input parameters take precedence over pulled parameters
        merged_body = {
            **source_prompt_body,
            **input_openai_params,
            "messages": substituted_messages,
        }
        
        if final_response_format is not None:
            merged_body["response_format"] = final_response_format
        
        if final_tools is not None:
            merged_body["tools"] = final_tools
        
        return PromptCompilationResult(body=merged_body, errors=errors)
    
    def get_prompt_body(self, params: HeliconeChatParams) -> PromptCompilationResult:
        """
        Retrieves and merges prompt body with input parameters and variable substitution.
        
        Args:
            params: The chat completion parameters containing prompt_id, optional version_id, 
                   environment, inputs, and other OpenAI parameters
                   
        Returns:
            PromptCompilationResult containing the compiled prompt body and any validation errors
        """
        try:
            # If no prompt_id, just return the input params as-is
            if not params.get("prompt_id"):
                # Remove Helicone-specific keys
                body = {k: v for k, v in params.items() 
                       if k not in ["prompt_id", "version_id", "inputs", "environment"]}
                return PromptCompilationResult(body=body, errors=[])
            
            # Pull the stored prompt body
            pulled_prompt_body = self.pull_prompt_body(params)
            
            # Merge and substitute
            return self.merge_prompt_body(params, pulled_prompt_body)
        
        except Exception as e:
            print(f"Error getting prompt body: {e}")
            raise
    
    def _get_prompt_version(self, version_id: str) -> Prompt2025Version:
        """Get a specific prompt version by ID."""
        response = self.session.post(
            f"{self.base_url}/v1/prompt-2025/query/version",
            json={"promptVersionId": version_id}
        )
        
        if not response.ok:
            raise Exception(f"Failed to get prompt version: {response.text}")
        
        result = response.json()
        if result.get("error"):
            raise Exception(f"API error: {result['error']}")
        
        data = result.get("data")
        if not data:
            raise Exception("No prompt version data returned")
        
        return Prompt2025Version(
            id=data["id"],
            model=data["model"],
            prompt_id=data["prompt_id"],
            major_version=data["major_version"],
            minor_version=data["minor_version"],
            commit_message=data["commit_message"],
            created_at=data["created_at"],
            s3_url=data.get("s3_url")
        )
    
    def _get_production_version(self, prompt_id: str) -> Prompt2025Version:
        """Get the production version of a prompt."""
        response = self.session.post(
            f"{self.base_url}/v1/prompt-2025/query/production-version",
            json={"promptId": prompt_id}
        )
        
        if not response.ok:
            raise Exception(f"Failed to get production version: {response.text}")
        
        result = response.json()
        if result.get("error"):
            raise Exception(f"API error: {result['error']}")
        
        data = result.get("data")
        if not data:
            raise Exception("No production version data returned")
        
        return Prompt2025Version(
            id=data["id"],
            model=data["model"],
            prompt_id=data["prompt_id"],
            major_version=data["major_version"],
            minor_version=data["minor_version"],
            commit_message=data["commit_message"],
            created_at=data["created_at"],
            s3_url=data.get("s3_url")
        )
    
    def _get_environment_version(self, prompt_id: str, environment: str) -> Prompt2025Version:
        """Get the environment version of a prompt."""
        response = self.session.post(
            f"{self.base_url}/v1/prompt-2025/query/environment-version",
            json={"promptId": prompt_id, "environment": environment}
        )
        
        if not response.ok:
            raise Exception(f"Failed to get environment version: {response.text}")
        
        result = response.json()
        if result.get("error"):
            raise Exception(f"API error: {result['error']}")
        
        data = result.get("data")
        if not data:
            raise Exception("No environment version data returned")
        
        return Prompt2025Version(
            id=data["id"],
            model=data["model"],
            prompt_id=data["prompt_id"],
            major_version=data["major_version"],
            minor_version=data["minor_version"],
            commit_message=data["commit_message"],
            created_at=data["created_at"],
            s3_url=data.get("s3_url")
        )
    
    def _fetch_prompt_body_from_s3(self, s3_url: Optional[str]) -> ChatCompletionParams:
        """Fetch prompt body from S3 URL."""
        if not s3_url:
            raise Exception("No S3 URL provided for prompt body")
        
        response = requests.get(s3_url)
        
        if not response.ok:
            raise Exception(f"Failed to fetch prompt body from S3: {response.text}")
        
        return response.json() 
    
    async def apull_prompt_version(self, params: HeliconeChatParams) -> Prompt2025Version:
        """
        Async version of pull_prompt_version.
        Finds the prompt version dynamically based on prompt params.
        
        Args:
            params: The chat completion parameters containing prompt_id, optional version_id, 
                   environment, inputs, and other OpenAI parameters
                   
        Returns:
            The prompt version object
        """
        prompt_id = params.get("prompt_id")
        version_id = params.get("version_id")
        environment = params.get("environment")
        
        if environment:
            return await self._aget_environment_version(prompt_id, environment)
        if version_id:
            return await self._aget_prompt_version(version_id)
        return await self._aget_production_version(prompt_id)
    
    async def apull_prompt_body(self, params: HeliconeChatParams) -> ChatCompletionParams:
        """
        Async version of pull_prompt_body.
        Pulls a prompt body from Helicone storage based on prompt parameters.
        
        Args:
            params: The chat completion parameters containing prompt_id, optional version_id, 
                   environment, inputs, and other OpenAI parameters
            
        Returns:
            The raw prompt body from storage
            
        Raises:
            Exception: If API call fails or prompt not found
        """
        try:
            prompt_version = await self.apull_prompt_version(params)
            prompt_body = await self._afetch_prompt_body_from_s3(prompt_version.s3_url)
            return prompt_body
        except Exception as e:
            print(f"Error pulling prompt body: {e}")
            raise
    
    async def apull_prompt_body_by_version_id(self, version_id: str) -> ChatCompletionParams:
        """
        Async version of pull_prompt_body_by_version_id.
        Pulls a prompt body from Helicone storage by version ID.
        
        Args:
            version_id: The unique identifier of the prompt version
            
        Returns:
            The raw prompt body from storage
            
        Raises:
            Exception: If API call fails or prompt not found
        """
        try:
            prompt_version = await self._aget_prompt_version(version_id)
            prompt_body = await self._afetch_prompt_body_from_s3(prompt_version.s3_url)
            return prompt_body
        except Exception as e:
            print(f"Error pulling prompt body: {e}")
            raise
    
    async def amerge_prompt_body(
        self,
        params: HeliconeChatParams,
        source_prompt_body: ChatCompletionParams,
        prompt_partial_inputs: Optional[Dict[str, Any]] = None
    ) -> PromptCompilationResult:
        """
        Async version of merge_prompt_body.
        Merges prompt body with input parameters and variable substitution.

        Args:
            params: The chat completion parameters containing inputs and other OpenAI parameters
            source_prompt_body: The source prompt body to merge with
            prompt_partial_inputs: Optional map of prompt partial inputs for substitution

        Returns:
            PromptCompilationResult containing the compiled prompt body and any validation errors
        """
        # This method doesn't need async operations, so we can reuse the sync version
        return self.merge_prompt_body(params, source_prompt_body, prompt_partial_inputs)
    
    async def aget_prompt_body(self, params: HeliconeChatParams) -> PromptCompilationResult:
        """
        Async version of get_prompt_body.
        Retrieves and merges prompt body with input parameters and variable substitution.
        
        Args:
            params: The chat completion parameters containing prompt_id, optional version_id, 
                   environment, inputs, and other OpenAI parameters
                   
        Returns:
            PromptCompilationResult containing the compiled prompt body and any validation errors
        """
        try:
            # If no prompt_id, just return the input params as-is
            if not params.get("prompt_id"):
                # Remove Helicone-specific keys
                body = {k: v for k, v in params.items() 
                       if k not in ["prompt_id", "version_id", "inputs", "environment"]}
                return PromptCompilationResult(body=body, errors=[])
            
            # Pull the stored prompt body
            pulled_prompt_body = await self.apull_prompt_body(params)
            
            # Merge and substitute
            return await self.amerge_prompt_body(params, pulled_prompt_body)
        
        except Exception as e:
            print(f"Error getting prompt body: {e}")
            raise
    
    async def _aget_prompt_version(self, version_id: str) -> Prompt2025Version:
        """Async version of _get_prompt_version. Get a specific prompt version by ID."""
        try:
            response = await self.async_client.post(
                f"{self.base_url}/v1/prompt-2025/query/version",
                json={"promptVersionId": version_id}
            )
            
            if not response.is_success:
                raise Exception(f"Failed to get prompt version: {response.text}")
            
            result = response.json()
            if result.get("error"):
                raise Exception(f"API error: {result['error']}")
            
            data = result.get("data")
            if not data:
                raise Exception("No prompt version data returned")
            
            return Prompt2025Version(
                id=data["id"],
                model=data["model"],
                prompt_id=data["prompt_id"],
                major_version=data["major_version"],
                minor_version=data["minor_version"],
                commit_message=data["commit_message"],
                created_at=data["created_at"],
                s3_url=data.get("s3_url")
            )
        except httpx.HTTPError as e:
            raise Exception(f"HTTP error getting prompt version: {e}")
        except httpx.ConnectError as e:
            raise Exception(f"Connection error getting prompt version: {e}")
        except httpx.TimeoutException as e:
            raise Exception(f"Timeout error getting prompt version: {e}")
        except Exception as e:
            if "Failed to get prompt version" in str(e) or "API error" in str(e):
                raise
            raise Exception(f"Unexpected error getting prompt version: {e}")
    
    async def _aget_production_version(self, prompt_id: str) -> Prompt2025Version:
        """Async version of _get_production_version. Get the production version of a prompt."""
        try:
            response = await self.async_client.post(
                f"{self.base_url}/v1/prompt-2025/query/production-version",
                json={"promptId": prompt_id}
            )
            
            if not response.is_success:
                raise Exception(f"Failed to get production version: {response.text}")
            
            result = response.json()
            if result.get("error"):
                raise Exception(f"API error: {result['error']}")
            
            data = result.get("data")
            if not data:
                raise Exception("No production version data returned")
            
            return Prompt2025Version(
                id=data["id"],
                model=data["model"],
                prompt_id=data["prompt_id"],
                major_version=data["major_version"],
                minor_version=data["minor_version"],
                commit_message=data["commit_message"],
                created_at=data["created_at"],
                s3_url=data.get("s3_url")
            )
        except httpx.HTTPError as e:
            raise Exception(f"HTTP error getting production version: {e}")
        except httpx.ConnectError as e:
            raise Exception(f"Connection error getting production version: {e}")
        except httpx.TimeoutException as e:
            raise Exception(f"Timeout error getting production version: {e}")
        except Exception as e:
            if "Failed to get production version" in str(e) or "API error" in str(e):
                raise
            raise Exception(f"Unexpected error getting production version: {e}")
    
    async def _aget_environment_version(self, prompt_id: str, environment: str) -> Prompt2025Version:
        """Async version of _get_environment_version. Get the environment version of a prompt."""
        try:
            response = await self.async_client.post(
                f"{self.base_url}/v1/prompt-2025/query/environment-version",
                json={"promptId": prompt_id, "environment": environment}
            )
            
            if not response.is_success:
                raise Exception(f"Failed to get environment version: {response.text}")
            
            result = response.json()
            if result.get("error"):
                raise Exception(f"API error: {result['error']}")
            
            data = result.get("data")
            if not data:
                raise Exception("No environment version data returned")
            
            return Prompt2025Version(
                id=data["id"],
                model=data["model"],
                prompt_id=data["prompt_id"],
                major_version=data["major_version"],
                minor_version=data["minor_version"],
                commit_message=data["commit_message"],
                created_at=data["created_at"],
                s3_url=data.get("s3_url")
            )
        except httpx.HTTPError as e:
            raise Exception(f"HTTP error getting environment version: {e}")
        except httpx.ConnectError as e:
            raise Exception(f"Connection error getting environment version: {e}")
        except httpx.TimeoutException as e:
            raise Exception(f"Timeout error getting environment version: {e}")
        except Exception as e:
            if "Failed to get environment version" in str(e) or "API error" in str(e):
                raise
            raise Exception(f"Unexpected error getting environment version: {e}")
    
    async def _afetch_prompt_body_from_s3(self, s3_url: Optional[str]) -> ChatCompletionParams:
        """Async version of _fetch_prompt_body_from_s3. Fetch prompt body from S3 URL."""
        if not s3_url:
            raise Exception("No S3 URL provided for prompt body")
        
        try:
            # Use httpx directly without auth headers for S3 pre-signed URLs
            async with httpx.AsyncClient() as client:
                response = await client.get(s3_url)
            
            if not response.is_success:
                raise Exception(f"Failed to fetch prompt body from S3: {response.text}")
            
            return response.json()
        except httpx.HTTPError as e:
            raise Exception(f"HTTP error fetching prompt body from S3: {e}")
        except httpx.ConnectError as e:
            raise Exception(f"Connection error fetching prompt body from S3: {e}")
        except httpx.TimeoutException as e:
            raise Exception(f"Timeout error fetching prompt body from S3: {e}")
        except Exception as e:
            if "Failed to fetch prompt body from S3" in str(e):
                raise
            raise Exception(f"Unexpected error fetching prompt body from S3: {e}")