pub mod matcher;
pub mod request;
pub mod response;

use wiremock::{Match, Request};

impl Match for Stub {
    fn matches(&self, request: &Request) -> bool {
        self.request.matches(request)
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
#[serde(rename_all = "kebab-case")]
pub struct Stub {
    pub id: String,
    /// Precedence of the stub. Lower is higher priority, with 1 being the
    /// highest.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<u8>,
    pub request: request::RequestStub,
    pub response: response::ResponseStub,
}
