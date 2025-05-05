use std::collections::HashSet;

use stubr::{Stubr, wiremock_rs::MockServer};
use typed_builder::TypedBuilder;
use url::Url;

use crate::{config::Config, types::provider::Provider};

#[derive(TypedBuilder)]
pub struct MockArgs {
    #[builder(setter(strip_option), default = None)]
    pub global_openai_latency: Option<u64>,
    #[builder(setter(strip_option), default = None)]
    pub global_anthropic_latency: Option<u64>,
    #[builder(setter(strip_option), default = None)]
    pub stubs_in_scope: Option<HashSet<String>>,
    #[builder(default = true)]
    pub verify: bool,
}

pub struct Mock {
    pub openai_mock: MockServer,
    pub anthropic_mock: MockServer,
    pub minio_mock: MockServer,
    pub jawn_mock: MockServer,
}

impl Mock {
    pub async fn new(config: &mut Config, args: MockArgs) -> Self {
        tracing::debug!(stubs = ?args.stubs_in_scope, "starting mock servers");
        let openai_mock = Stubr::try_start_with(
            "./stubs/openai",
            args.stubs_in_scope.clone(),
            stubr::Config {
                record: true,
                latency: args.global_openai_latency,
                verify: args.verify,
                ..Default::default()
            },
        )
        .await
        .expect("couldnt start mock htttp server");
        config
            .providers
            .get_mut(&Provider::OpenAI)
            .unwrap()
            .base_url = Url::parse(&openai_mock.uri()).unwrap();

        let anthropic_mock = Stubr::try_start_with(
            "./stubs/anthropic",
            args.stubs_in_scope.clone(),
            stubr::Config {
                record: true,
                latency: args.global_anthropic_latency,
                verify: args.verify,
                ..Default::default()
            },
        )
        .await
        .expect("couldnt start mock htttp server");
        config
            .providers
            .get_mut(&Provider::Anthropic)
            .unwrap()
            .base_url = Url::parse(&anthropic_mock.uri()).unwrap();

        let minio_mock = Stubr::try_start_with(
            "./stubs/minio",
            args.stubs_in_scope.clone(),
            stubr::Config {
                record: true,
                latency: args.global_anthropic_latency,
                verify: args.verify,
                ..Default::default()
            },
        )
        .await
        .expect("couldnt start mock htttp server");
        config.minio.host = Url::parse(&minio_mock.uri()).unwrap();

        let jawn_mock = Stubr::try_start_with(
            "./stubs/jawn",
            args.stubs_in_scope.clone(),
            stubr::Config {
                record: true,
                latency: args.global_anthropic_latency,
                verify: args.verify,
                ..Default::default()
            },
        )
        .await
        .expect("couldnt start mock htttp server");
        config.helicone.base_url = Url::parse(&jawn_mock.uri()).unwrap();

        Self {
            openai_mock: openai_mock.http_server,
            anthropic_mock: anthropic_mock.http_server,
            minio_mock: minio_mock.http_server,
            jawn_mock: jawn_mock.http_server,
        }
    }
}
