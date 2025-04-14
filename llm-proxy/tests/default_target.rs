use llm_proxy::{config::Config, tests::harness::Harness};



#[tokio::test]
async fn default_target() {
    let config = Config::test_config();
    let mut harness = Harness::new(config);
}
