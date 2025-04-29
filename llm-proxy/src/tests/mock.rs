use stubr::{Stubr, wiremock_rs::MockServer};
use url::Url;

use crate::{config::providers::ProvidersConfig, types::provider::Provider};

pub const MOCK_OPENAI_PORT: u16 = 8111;
pub const MOCK_ANTHROPIC_PORT: u16 = 8112;

pub struct Mock {
    pub openai_mock: MockServer,
    pub anthropic_mock: MockServer,
}

impl Mock {
    pub async fn new_with_latency(
        providers: &mut ProvidersConfig,
        openai_latency: Option<u64>,
        anthropic_latency: Option<u64>,
    ) -> Self {
        let openai_mock = Stubr::try_start_with(
            "./stubs/openai",
            stubr::Config {
                port: Some(MOCK_OPENAI_PORT),
                record: true,
                latency: openai_latency,
                ..Default::default()
            },
        )
        .await
        .expect("couldnt start mock htttp server");
        providers.get_mut(&Provider::OpenAI).unwrap().base_url =
            Url::parse(&openai_mock.uri()).unwrap();
        let anthropic_mock = Stubr::try_start_with(
            "./stubs/anthropic",
            stubr::Config {
                port: Some(MOCK_ANTHROPIC_PORT),
                record: true,
                latency: anthropic_latency,
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

    pub async fn new(providers: &mut ProvidersConfig) -> Self {
        Self::new_with_latency(providers, None, None).await
    }
}
