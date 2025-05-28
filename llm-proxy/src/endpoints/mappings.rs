use crate::endpoints::{anthropic::Anthropic, openai::OpenAI, google::Google};

impl From<Anthropic> for OpenAI {
    fn from(value: Anthropic) -> Self {
        match value {
            Anthropic::Messages(_) => Self::chat_completions(),
        }
    }
}

impl From<OpenAI> for Anthropic {
    fn from(value: OpenAI) -> Self {
        match value {
            OpenAI::ChatCompletions(_) => Self::messages(),
        }
    }
}

impl From<Google> for OpenAI {
    fn from(value: Google) -> Self {
        match value {
            Google::GenerateContents(_) => Self::chat_completions(),
        }
    }
}

impl From<OpenAI> for Google {
    fn from(value: OpenAI) -> Self {
        match value {
            OpenAI::ChatCompletions(_) => Self::generate_contents(),
        }
    }
}


impl From<Anthropic> for Google {
    fn from(value: Anthropic) -> Self {
        match value {
            Anthropic::Messages(_) => Self::generate_contents(),
        }
    }
}

impl From<Google> for Anthropic {
    fn from(value: Google) -> Self {
        match value {
            Google::GenerateContents(_) => Self::messages(),
        }
    }
}
