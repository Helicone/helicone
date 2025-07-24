from typing import Any, Dict, List, Optional, TypedDict, Union
from dataclasses import dataclass

try:
    from openai.types.chat import ChatCompletionMessageParam
    from openai.types.chat.completion_create_params import CompletionCreateParams
    OPENAI_AVAILABLE = True
except ImportError:
    ChatCompletionMessageParam = Dict[str, Any]
    CompletionCreateParams = Dict[str, Any]
    OPENAI_AVAILABLE = False


@dataclass
class ValidationError:
    variable: str
    expected: str
    value: Any


@dataclass
class SubstitutionResult:
    success: bool
    result: Optional[Any] = None
    errors: Optional[List[ValidationError]] = None


@dataclass
class TemplateVariable:
    name: str
    type: str
    raw: str


@dataclass
class Prompt2025Version:
    id: str
    model: str
    prompt_id: str
    major_version: int
    minor_version: int
    commit_message: str
    created_at: str
    s3_url: Optional[str] = None


@dataclass
class Prompt2025:
    id: str
    name: str
    tags: List[str]
    created_at: str


class PromptCompilationResult(TypedDict):
    body: Dict[str, Any]
    errors: List[ValidationError]


if OPENAI_AVAILABLE:
    class HeliconeChatParams(CompletionCreateParams, total=False):
        prompt_id: str
        version_id: Optional[str]
        inputs: Optional[Dict[str, Any]]
    
    ChatMessage = ChatCompletionMessageParam
    ChatCompletionParams = CompletionCreateParams
else:
    class ChatMessage(TypedDict, total=False):
        role: str
        content: Union[str, List[Dict[str, Any]]]
        name: Optional[str]
        tool_call_id: Optional[str]
        tool_calls: Optional[List[Dict[str, Any]]]

    class ChatCompletionParams(TypedDict, total=False):
        model: str
        messages: List[ChatMessage]
        temperature: Optional[float]
        max_tokens: Optional[int]
        top_p: Optional[float]
        frequency_penalty: Optional[float]
        presence_penalty: Optional[float]
        response_format: Optional[Dict[str, Any]]
        tools: Optional[List[Dict[str, Any]]]
        tool_choice: Optional[Union[str, Dict[str, Any]]]
        stream: Optional[bool]
        stop: Optional[Union[str, List[str]]]
        seed: Optional[int]

    class HeliconeChatParams(ChatCompletionParams, total=False):
        prompt_id: str
        version_id: Optional[str]
        inputs: Optional[Dict[str, Any]] 