import json
import requests
from typing import Any, Dict, List, Optional, Union
from .types import (
    Prompt2025Version, 
    ValidationError, 
    PromptCompilationResult,
    HeliconeChatParams,
    ChatCompletionParams
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
    
    def pull_prompt_body(self, prompt_id: str, version_id: Optional[str] = None) -> ChatCompletionParams:
        """
        Pulls a prompt body from Helicone storage by prompt ID and optional version ID.
        
        Args:
            prompt_id: The unique identifier of the prompt
            version_id: Optional version ID, if not provided uses production version
            
        Returns:
            The raw prompt body from storage
            
        Raises:
            Exception: If API call fails or prompt not found
        """
        try:
            if not version_id:
                production_version = self._get_production_version(prompt_id)
                version_id = production_version.id
            
            prompt_version = self._get_prompt_version(version_id)
            prompt_body = self._fetch_prompt_body_from_s3(prompt_version.s3_url)
            
            return prompt_body
        
        except Exception as e:
            print(f"Error pulling prompt body: {e}")
            raise
    
    def get_prompt_body(self, params: HeliconeChatParams) -> PromptCompilationResult:
        """
        Retrieves and merges prompt body with input parameters and variable substitution.
        
        Args:
            params: The chat completion parameters containing prompt_id, optional version_id, 
                   inputs, and other OpenAI parameters
                   
        Returns:
            PromptCompilationResult containing the compiled prompt body and any validation errors
        """
        try:
            errors: List[ValidationError] = []
            
            # If no prompt_id, just return the input params as-is
            if not params.get("prompt_id"):
                # Remove Helicone-specific keys
                body = {k: v for k, v in params.items() 
                       if k not in ["prompt_id", "version_id", "inputs"]}
                return PromptCompilationResult(body=body, errors=errors)
            
            # Pull the stored prompt body
            pulled_prompt_body = self.pull_prompt_body(
                params["prompt_id"], 
                params.get("version_id")
            )
            
            # Prepare substitution values from inputs
            substitution_values = params.get("inputs", {})
            
            # Merge and substitute messages
            pulled_messages = pulled_prompt_body.get("messages", [])
            input_messages = params.get("messages", [])
            merged_messages = pulled_messages + input_messages
            
            substituted_messages = []
            for message in merged_messages:
                if isinstance(message.get("content"), str):
                    substituted = HeliconeTemplateManager.substitute_variables(
                        message["content"],
                        substitution_values
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
            final_response_format = pulled_prompt_body.get("response_format")
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
            final_tools = pulled_prompt_body.get("tools")
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
                                 if k not in ["prompt_id", "version_id", "inputs"]}
            
            # Remove messages, response_format, and tools from input params since we handle them specially
            input_openai_params.pop("messages", None)
            input_openai_params.pop("response_format", None)
            input_openai_params.pop("tools", None)
            
            # Merge pulled prompt body with input parameters
            # Input parameters take precedence over pulled parameters
            merged_body = {
                **pulled_prompt_body,
                **input_openai_params,
                "messages": substituted_messages,
            }
            
            if final_response_format is not None:
                merged_body["response_format"] = final_response_format
            
            if final_tools is not None:
                merged_body["tools"] = final_tools
            
            return PromptCompilationResult(body=merged_body, errors=errors)
        
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
    
    def _fetch_prompt_body_from_s3(self, s3_url: Optional[str]) -> ChatCompletionParams:
        """Fetch prompt body from S3 URL."""
        if not s3_url:
            raise Exception("No S3 URL provided for prompt body")
        
        response = requests.get(s3_url)
        
        if not response.ok:
            raise Exception(f"Failed to fetch prompt body from S3: {response.text}")
        
        return response.json() 