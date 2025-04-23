use std::{sync::Arc, time::Duration};

use futures::future::BoxFuture;
use meltdown::Token;
use tracing::{error, info};

use crate::{
    config::rate_limit::{AuthedLimiterConfig, UnauthedLimiterConfig},
    error::runtime,
};

pub struct Service {
    pub authed_rate_limit: Arc<AuthedLimiterConfig>,
    pub unauthed_rate_limit: Arc<UnauthedLimiterConfig>,
    pub cleanup_interval: Duration,
}

impl Service {
    pub fn new(
        authed_rate_limit: Arc<AuthedLimiterConfig>,
        unauthed_rate_limit: Arc<UnauthedLimiterConfig>,
        cleanup_interval: Duration,
    ) -> Self {
        Self {
            authed_rate_limit,
            unauthed_rate_limit,
            cleanup_interval,
        }
    }
}

impl meltdown::Service for Service {
    type Future = BoxFuture<'static, Result<(), runtime::RuntimeError>>;

    fn run(self, mut token: Token) -> Self::Future {
        let unauthed_governor_limiter =
            self.unauthed_rate_limit.limiter().clone();
        let authed_governor_limiter = self.authed_rate_limit.limiter().clone();
        let cleanup_interval = self.cleanup_interval;
        Box::pin(async move {
            tokio::task::spawn_blocking(move || async move {
                loop {
                    tokio::select! {
                        _ = tokio::time::sleep(cleanup_interval) => {
                            unauthed_governor_limiter.retain_recent();
                            authed_governor_limiter.retain_recent();
                        }
                        _ = &mut token => {
                            info!(name = "rate-limiting-cleanup-task", "task shutting down");
                            break;
                        }
                    }
                }
            })
            .await
            .inspect_err(|e| error!(error = %e, "error running rate limiting cleanup task"))?
            .await;

            info!(
                name = "rate-limiting-cleanup-task",
                "task shutdown successfully"
            );
            Ok(())
        })
    }
}
