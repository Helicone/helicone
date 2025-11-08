from typing import Any, Dict, List, Optional, TypedDict
from dataclasses import dataclass

try:
    from openai.types.chat import ChatCompletionMessageParam
    from openai.types.chat.completion_create_params import CompletionCreateParamsBase
    OPENAI_AVAILABLE = True
except ImportError:
    ChatCompletionMessageParam = Dict[str, Any]
    CompletionCreateParamsBase = Dict[str, Any]
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
class PromptPartialVariable:
    prompt_id: str
    index: int
    raw: str
    environment: Optional[str] = None


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
    class HeliconeChatParams(CompletionCreateParamsBase, total=False):
        prompt_id: str
        version_id: Optional[str]
        environment: Optional[str]
        inputs: Optional[Dict[str, Any]]
    
    ChatMessage = ChatCompletionMessageParam
    ChatCompletionParams = CompletionCreateParamsBase
else:
    ChatMessage = Dict[str, Any]
    ChatCompletionParams = Dict[str, Any]
    HeliconeChatParams = Dict[str, Any] 