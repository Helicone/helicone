use futures::future::BoxFuture;
use meltdown::Token;
use tracing::{error, info};

use crate::error::{init::InitError, runtime::RuntimeError};

pub struct SystemMetrics;

impl meltdown::Service for SystemMetrics {
    type Future = BoxFuture<'static, Result<(), RuntimeError>>;

    fn run(self, mut token: Token) -> Self::Future {
        let provider = opentelemetry::global::meter_provider();
        let system_metrics = provider.meter("system-metrics");
        Box::pin(async move {
            // TODO: is sysinfo blocking? might want to spawn this in a thread
            // pool instead
            let mut handle = tokio::task::spawn(async {
                opentelemetry_system_metrics::init_process_observer(
                    system_metrics,
                )
                .await
                .map_err(|_| InitError::InitSystemMetrics)
            });

            tokio::select! {
                result = &mut handle => {
                    if let Err(e) = result {
                        error!(name = "system-metrics-task", error = ?e, "System metrics task encountered error, shutting down");
                    } else {
                        info!(name = "system-metrics-task", "System metrics task shut down successfully");
                    }
                    token.trigger();
                }
                () = &mut token => {
                    info!(name = "system-metrics-task", "Shutdown signal received, aborting system metrics task");
                    handle.abort();
                    token.trigger();
                }
            }
            Ok(())
        })
    }
}
