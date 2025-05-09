use crate::endpoints::{anthropic::Anthropic, openai::OpenAI};

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
