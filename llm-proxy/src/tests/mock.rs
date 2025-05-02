use stubr::{Stubr, wiremock_rs::MockServer};
use typed_builder::TypedBuilder;
use url::Url;

use crate::{config::providers::ProvidersConfig, types::provider::Provider};

pub const MOCK_OPENAI_PORT: u16 = 8111;
pub const MOCK_ANTHROPIC_PORT: u16 = 8112;

#[derive(TypedBuilder)]
pub struct MockArgs {
    #[builder(default = "./stubs/openai".to_string())]
    pub openai_path: String,
    #[builder(setter(strip_option), default = None)]
    pub global_openai_latency: Option<u64>,
    #[builder(default = "./stubs/anthropic".to_string())]
    pub anthropic_path: String,
    #[builder(setter(strip_option), default = None)]
    pub global_anthropic_latency: Option<u64>,
}

pub struct Mock {
    pub openai_mock: MockServer,
    pub anthropic_mock: MockServer,
}

impl Mock {
    pub async fn new(providers: &mut ProvidersConfig, args: MockArgs) -> Self {
        let openai_mock = Stubr::try_start_with(
            args.openai_path,
            stubr::Config {
                port: Some(MOCK_OPENAI_PORT),
                record: true,
                latency: args.global_openai_latency,
                ..Default::default()
            },
        )
        .await
        .expect("couldnt start mock htttp server");
        providers.get_mut(&Provider::OpenAI).unwrap().base_url =
            Url::parse(&openai_mock.uri()).unwrap();
        let anthropic_mock = Stubr::try_start_with(
            args.anthropic_path,
            stubr::Config {
                port: Some(MOCK_ANTHROPIC_PORT),
                record: true,
                latency: args.global_anthropic_latency,
                ..Default::default()
            },
        )
        .await
        .expect("couldnt start mock htttp server");
        providers.get_mut(&Provider::Anthropic).unwrap().base_url =
            Url::parse(&anthropic_mock.uri()).unwrap();
        Self {
            openai_mock: openai_mock.http_server,
            anthropic_mock: anthropic_mock.http_server,
        }
    }
}
