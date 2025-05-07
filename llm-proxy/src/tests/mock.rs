use std::collections::HashMap;

use stubr::{
    Stubr,
    wiremock_rs::{MockServer, Times},
};
use typed_builder::TypedBuilder;
use url::Url;

use crate::{config::Config, types::provider::Provider};

#[derive(TypedBuilder)]
pub struct MockArgs {
    #[builder(setter(strip_option), default = None)]
    pub global_openai_latency: Option<u64>,
    #[builder(setter(strip_option), default = None)]
    pub global_anthropic_latency: Option<u64>,
    /// Map of stub id to the expectations on the number of times it should be
    /// called.
    #[builder(setter(strip_option), default = None)]
    pub stubs: Option<HashMap<&'static str, Times>>,
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
        tracing::debug!(stubs = ?args.stubs, "starting mock servers");
        let openai_mock = start_mock(
            "./stubs/openai",
            args.global_openai_latency,
            &args.stubs,
            args.verify,
        )
        .await;
        config
            .providers
            .get_mut(&Provider::OpenAI)
            .unwrap()
            .base_url = Url::parse(&openai_mock.uri()).unwrap();

        let anthropic_mock = start_mock(
            "./stubs/anthropic",
            args.global_anthropic_latency,
            &args.stubs,
            args.verify,
        )
        .await;
        config
            .providers
            .get_mut(&Provider::Anthropic)
            .unwrap()
            .base_url = Url::parse(&anthropic_mock.uri()).unwrap();

        let minio_mock =
            start_mock("./stubs/minio", None, &args.stubs, args.verify).await;
        config.minio.host = Url::parse(&minio_mock.uri()).unwrap();

        let jawn_mock =
            start_mock("./stubs/jawn", None, &args.stubs, args.verify).await;
        config.helicone.base_url = Url::parse(&jawn_mock.uri()).unwrap();

        Self {
            openai_mock: openai_mock.http_server,
            anthropic_mock: anthropic_mock.http_server,
            minio_mock: minio_mock.http_server,
            jawn_mock: jawn_mock.http_server,
        }
    }
}

async fn start_mock(
    stub_path: &str,
    global_latency: Option<u64>,
    stubs: &Option<HashMap<&'static str, Times>>,
    verify: bool,
) -> Stubr {
    let active_stubs =
        stubs.as_ref().map(|stubs| stubs.keys().copied().collect());
    let mock = Stubr::try_start_with(
        stub_path,
        active_stubs,
        stubr::Config {
            record: true,
            global_delay: global_latency,
            verify,
            ..Default::default()
        },
    )
    .await
    .expect("couldnt start mock htttp server");

    if let Some(stub_expectations) = stubs {
        for (stub_name, times) in stub_expectations {
            mock.http_server
                .set_expectation(stub_name, times.clone())
                .await;
        }
    }

    mock
}
