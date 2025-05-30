use crate::endpoints::{anthropic::Anthropic, google::Google, openai::OpenAI};

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
