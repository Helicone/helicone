use ai_gateway::tests::mock::{Mock, MockArgs};
use tokio::{
    main,
    signal::unix::{SignalKind, signal},
};
use tracing::{info, warn};
use tracing_subscriber::{
    EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt,
};

#[main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            fmt::layer()
                .with_target(true)
                .with_level(true)
                .with_writer(std::io::stdout),
        )
        .with(EnvFilter::new("info"))
        .init();

    let args = MockArgs::builder()
        .openai_port(8100)
        .anthropic_port(8101)
        .google_port(8102)
        .minio_port(8103)
        .jawn_port(8104)
        // .global_openai_latency(10)
        // .global_anthropic_latency(10)
        // .global_google_latency(10)
        .build();

    info!("Starting mock server");
    let _mock = Mock::from_args(args).await;
    info!("Mock server started successfully");
    let mut sigint = signal(SignalKind::interrupt())
        .expect("failed to register SIGINT signal");
    let mut sigterm = signal(SignalKind::terminate())
        .expect("failed to register SIGTERM signal");

    tokio::select! {
        _ = sigint.recv() => {
            warn!("SIGINT received, starting shutdown");
        },
        _ = sigterm.recv() => {
            warn!("SIGTERM received, starting shutdown");
        },
    }
}
