use wiremock::{matchers::path, Mock, ResponseTemplate};

pub struct OpenAiMock {
    pub mock: Mock,
}

impl OpenAiMock {
    pub fn new() -> Self {
        let mock = Mock::given(path("/v1/chat/completions"))
            .respond_with(ResponseTemplate::new(200));
        Self { mock }
    }
}