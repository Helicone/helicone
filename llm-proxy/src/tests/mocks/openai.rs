use stubr::wiremock_rs::MockServer;
use wiremock::{Mock, ResponseTemplate, matchers::path};

pub struct OpenAiMock {
    pub mock: MockServer,
}

impl OpenAiMock {
    pub fn new() -> Self {
        let mock = Mock::given(path("/v1/chat/completions"))
            .respond_with(ResponseTemplate::new(200));
        Self { mock }
    }
}
