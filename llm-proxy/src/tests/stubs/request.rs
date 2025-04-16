use serde_json::Value;
use serde_with::{DisplayFromStr, serde_as};
use wiremock::{Match, Request};

#[serde_as]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "kebab-case")]
pub struct RequestStub {
    #[serde_as(as = "DisplayFromStr")]
    pub method: http::Method,
    pub url: url::Url,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body_patterns: Option<Vec<RequestBodyMatcherStub>>,
}

impl Match for RequestStub {
    fn matches(&self, request: &Request) -> bool {
        let method_matches = self.method == request.method;
        let url_matches = self.url == request.url;
        // default true so we can match GETs etc
        let body_matches =
            self.body_patterns.as_ref().map_or(true, |patterns| {
                patterns.iter().any(|pattern| pattern.matches(request))
            });
        method_matches && url_matches && body_matches
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum RequestBodyMatcherStub {
    EqualToJson(Value),
    MatchesJsonPath {
        /// the json path of the request body to match
        path: String,
        /// the value to match against
        value: Value,
    },
}

impl Match for RequestBodyMatcherStub {
    fn matches(&self, request: &Request) -> bool {
        match self {
            Self::EqualToJson(stub_body) => {
                let req_body = request
                    .body_json::<Value>()
                    .expect("Failed to parse request body as JSON");
                req_body == *stub_body
            }
            Self::MatchesJsonPath { path, value } => {
                let req_body = request
                    .body_json::<Value>()
                    .expect("Failed to parse request body as JSON");
                let req_body_path = req_body.pointer(path).expect(&format!(
                    "Failed to get request body for path: {}",
                    path
                ));
                req_body_path == value
            }
        }
    }
}
