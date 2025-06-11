use std::time::Duration;

use futures::future::BoxFuture;
use meltdown::Token;
use tracing::{error, info};

use crate::{app_state::AppState, error::runtime::RuntimeError};

pub struct GarbageCollector {
    pub app_state: AppState,
    pub cleanup_interval: Duration,
}

impl GarbageCollector {
    #[must_use]
    pub fn new(app_state: AppState, cleanup_interval: Duration) -> Self {
        Self {
            app_state,
            cleanup_interval,
        }
    }
}

impl meltdown::Service for GarbageCollector {
    type Future = BoxFuture<'static, Result<(), RuntimeError>>;

    fn run(self, mut token: Token) -> Self::Future {
        let app_state = self.app_state;
        let cleanup_interval = self.cleanup_interval;
        Box::pin(async move {
            tokio::task::spawn_blocking(move || async move {
                let global_rate_limit = app_state.0.global_rate_limit.clone();
                loop {
                    tokio::select! {
                        () = tokio::time::sleep(cleanup_interval) => {
                            if let Some(global_rate_limit) = global_rate_limit.as_ref() {
                                global_rate_limit.limiter().retain_recent();
                            }

                            let router_limits = app_state.0.router_rate_limits.read().await;
                            for rate_limit_config in router_limits.values() {
                                rate_limit_config.limiter().retain_recent();
                            }
                        }
                        () = &mut token => {
                            info!(name = "rate-limiting-cleanup-task", "task shutting down");
                            break;
                        }
                    }
                }
            })
            .await
            .inspect_err(|e| error!(error = %e, "error running rate limiting cleanup task"))?
            .await;

            Ok(())
        })
    }
}
