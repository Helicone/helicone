use std::collections::HashMap;

use stubr::{Stubr, wiremock_rs::Times};
use typed_builder::TypedBuilder;
use url::Url;
use workspace_root::get_workspace_root;

use crate::{config::Config, types::provider::InferenceProvider};

fn get_stubs_path(provider: &str) -> String {
    let workspace_root = get_workspace_root();
    let stubs_path = workspace_root.join("llm-proxy/stubs").join(provider);
    stubs_path.to_string_lossy().to_string()
}

#[derive(TypedBuilder)]
pub struct MockArgs {
    #[builder(setter(strip_option), default = None)]
    pub global_openai_latency: Option<u64>,
    #[builder(setter(strip_option), default = None)]
    pub global_anthropic_latency: Option<u64>,
    #[builder(setter(strip_option), default = None)]
    pub global_google_latency: Option<u64>,
    #[builder(setter(strip_option), default = None)]
    pub global_ollama_latency: Option<u64>,

    #[builder(setter(strip_option), default = None)]
    pub openai_port: Option<u16>,
    #[builder(setter(strip_option), default = None)]
    pub anthropic_port: Option<u16>,
    #[builder(setter(strip_option), default = None)]
    pub google_port: Option<u16>,
    #[builder(setter(strip_option), default = None)]
    pub ollama_port: Option<u16>,
    #[builder(setter(strip_option), default = None)]
    pub minio_port: Option<u16>,
    #[builder(setter(strip_option), default = None)]
    pub jawn_port: Option<u16>,

    /// Map of stub id to the expectations on the number of times it should be
    /// called.
    #[builder(setter(strip_option), default = None)]
    pub stubs: Option<HashMap<&'static str, Times>>,
    #[builder(default = true)]
    pub verify: bool,
}

pub struct Mock {
    pub openai_mock: Stubr,
    pub anthropic_mock: Stubr,
    pub google_mock: Stubr,
    pub ollama_mock: Stubr,
    pub minio_mock: Stubr,
    pub jawn_mock: Stubr,
    args: MockArgs,
}

impl Mock {
    pub async fn new(config: &mut Config, args: MockArgs) -> Self {
        tracing::debug!(stubs = ?args.stubs, "starting mock servers");
        let openai_mock = start_mock_for_test(
            &get_stubs_path("openai"),
            args.global_openai_latency,
            args.stubs.as_ref(),
            args.verify,
        )
        .await;
        tracing::debug!(port = %openai_mock.uri(), "openai mock started");
        config
            .providers
            .get_mut(&InferenceProvider::OpenAI)
            .unwrap()
            .base_url = Url::parse(&openai_mock.uri()).unwrap();

        let anthropic_mock = start_mock_for_test(
            &get_stubs_path("anthropic"),
            args.global_anthropic_latency,
            args.stubs.as_ref(),
            args.verify,
        )
        .await;
        config
            .providers
            .get_mut(&InferenceProvider::Anthropic)
            .unwrap()
            .base_url = Url::parse(&anthropic_mock.uri()).unwrap();

        let google_mock = start_mock_for_test(
            &get_stubs_path("google"),
            args.global_google_latency,
            args.stubs.as_ref(),
            args.verify,
        )
        .await;

        config
            .providers
            .get_mut(&InferenceProvider::GoogleGemini)
            .unwrap()
            .base_url = Url::parse(&google_mock.uri()).unwrap();

        let ollama_mock = start_mock_for_test(
            &get_stubs_path("ollama"),
            args.global_ollama_latency,
            args.stubs.as_ref(),
            args.verify,
        )
        .await;

        config
            .providers
            .get_mut(&InferenceProvider::Ollama)
            .unwrap()
            .base_url = Url::parse(&ollama_mock.uri()).unwrap();

        let minio_mock = start_mock_for_test(
            &get_stubs_path("minio"),
            None,
            args.stubs.as_ref(),
            args.verify,
        )
        .await;
        config.minio.host = Url::parse(&minio_mock.uri()).unwrap();

        let jawn_mock = start_mock_for_test(
            &get_stubs_path("jawn"),
            None,
            args.stubs.as_ref(),
            args.verify,
        )
        .await;
        config.helicone.base_url = Url::parse(&jawn_mock.uri()).unwrap();

        Self {
            openai_mock,
            anthropic_mock,
            google_mock,
            ollama_mock,
            minio_mock,
            jawn_mock,
            args,
        }
    }

    pub async fn from_args(args: MockArgs) -> Self {
        let openai_mock = start_mock(
            &get_stubs_path("openai"),
            args.global_openai_latency,
            args.stubs.as_ref(),
            false,
            false,
            args.openai_port,
        )
        .await;
        let anthropic_mock = start_mock(
            &get_stubs_path("anthropic"),
            args.global_anthropic_latency,
            args.stubs.as_ref(),
            false,
            false,
            args.anthropic_port,
        )
        .await;

        let google_mock = start_mock(
            &get_stubs_path("google"),
            args.global_google_latency,
            args.stubs.as_ref(),
            false,
            false,
            args.google_port,
        )
        .await;

        let ollama_mock = start_mock(
            &get_stubs_path("ollama"),
            args.global_ollama_latency,
            args.stubs.as_ref(),
            false,
            false,
            args.ollama_port,
        )
        .await;

        let minio_mock = start_mock(
            &get_stubs_path("minio"),
            None,
            args.stubs.as_ref(),
            false,
            false,
            args.minio_port,
        )
        .await;

        let jawn_mock = start_mock(
            &get_stubs_path("jawn"),
            None,
            args.stubs.as_ref(),
            false,
            false,
            args.jawn_port,
        )
        .await;

        Self {
            openai_mock,
            anthropic_mock,
            google_mock,
            ollama_mock,
            minio_mock,
            jawn_mock,
            args,
        }
    }

    pub async fn verify(&self) {
        self.openai_mock.http_server.verify().await;
        self.anthropic_mock.http_server.verify().await;
        self.google_mock.http_server.verify().await;
        self.ollama_mock.http_server.verify().await;
        self.minio_mock.http_server.verify().await;
        self.jawn_mock.http_server.verify().await;
    }

    pub async fn reset(&self) {
        self.openai_mock.http_server.reset().await;
        self.anthropic_mock.http_server.reset().await;
        self.google_mock.http_server.reset().await;
        self.ollama_mock.http_server.reset().await;
        self.minio_mock.http_server.reset().await;
        self.jawn_mock.http_server.reset().await;
    }

    pub async fn stubs(&self, stubs: HashMap<&'static str, Times>) {
        register_stubs_for_mock(
            &self.openai_mock,
            &get_stubs_path("openai"),
            self.args.global_openai_latency,
            &stubs,
            self.args.verify,
        )
        .await;

        register_stubs_for_mock(
            &self.anthropic_mock,
            &get_stubs_path("anthropic"),
            self.args.global_anthropic_latency,
            &stubs,
            self.args.verify,
        )
        .await;

        register_stubs_for_mock(
            &self.google_mock,
            &get_stubs_path("google"),
            self.args.global_google_latency,
            &stubs,
            self.args.verify,
        )
        .await;

        register_stubs_for_mock(
            &self.ollama_mock,
            &get_stubs_path("ollama"),
            self.args.global_ollama_latency,
            &stubs,
            self.args.verify,
        )
        .await;

        register_stubs_for_mock(
            &self.minio_mock,
            &get_stubs_path("minio"),
            None,
            &stubs,
            self.args.verify,
        )
        .await;

        register_stubs_for_mock(
            &self.jawn_mock,
            &get_stubs_path("jawn"),
            None,
            &stubs,
            self.args.verify,
        )
        .await;
    }
}

async fn start_mock_for_test(
    stub_path: &str,
    global_delay: Option<u64>,
    stubs: Option<&HashMap<&'static str, Times>>,
    verify: bool,
) -> Stubr {
    start_mock(stub_path, global_delay, stubs, verify, true, None).await
}

async fn start_mock(
    stub_path: &str,
    global_delay: Option<u64>,
    stubs: Option<&HashMap<&'static str, Times>>,
    verify: bool,
    record: bool,
    port: Option<u16>,
) -> Stubr {
    let active_stubs =
        stubs.as_ref().map(|stubs| stubs.keys().copied().collect());
    let mock = Stubr::try_start_with(
        stub_path,
        active_stubs,
        stubr::Config {
            record,
            global_delay,
            verify,
            port,
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

async fn register_stubs_for_mock(
    mock: &Stubr,
    stub_path: &str,
    global_latency: Option<u64>,
    stubs: &HashMap<&'static str, Times>,
    verify: bool,
) {
    let active_stubs = stubs.keys().copied().collect();

    mock.try_register_stubs(
        stub_path.into(),
        Some(active_stubs),
        stubr::Config {
            record: true,
            global_delay: global_latency,
            verify,
            ..Default::default()
        },
    )
    .expect("failed to register stubs");

    for (stub_name, times) in stubs {
        mock.http_server
            .set_expectation(stub_name, times.clone())
            .await;
    }
}
