use std::{sync::Arc, time::Duration};

use rustc_hash::FxHashMap as HashMap;
use strum::IntoEnumIterator;

use crate::{
    endpoints::ApiEndpoint, error::internal::InternalError,
    metrics::RollingCounter, types::provider::InferenceProvider,
};

/// We use this to track metrics for monitoring provider health.
///
/// We do this separately from the OpenTelemetry metrics because a) they
/// don't provide a way to query the metrics and b) it's easy to implement
/// the rolling window this way.
#[derive(Debug, Clone)]
pub struct EndpointMetricsRegistry {
    endpoint_health_metrics: Arc<HashMap<ApiEndpoint, EndpointMetrics>>,
}

impl EndpointMetricsRegistry {
    pub fn health_metrics(
        &self,
        api_endpoint: ApiEndpoint,
    ) -> Result<&EndpointMetrics, InternalError> {
        self.endpoint_health_metrics
            .get(&api_endpoint)
            .ok_or(InternalError::MetricsNotConfigured(api_endpoint))
    }
}

impl Default for EndpointMetricsRegistry {
    fn default() -> Self {
        let mut endpoint_health_metrics = HashMap::default();
        for provider in InferenceProvider::iter() {
            for endpoint in provider.endpoints() {
                endpoint_health_metrics
                    .insert(endpoint, EndpointMetrics::default());
            }
        }
        Self {
            endpoint_health_metrics: Arc::new(endpoint_health_metrics),
        }
    }
}

#[derive(Debug, Default)]
pub struct EndpointMetrics {
    /// total request count
    pub(crate) request_count: RollingCounter,
    /// Count of upstream remote internal errors
    pub(crate) remote_internal_error_count: RollingCounter,
}

impl EndpointMetrics {
    #[must_use]
    pub fn new(window: Duration, buckets: u32) -> Self {
        Self {
            request_count: RollingCounter::new(window, buckets),
            remote_internal_error_count: RollingCounter::new(window, buckets),
        }
    }

    pub fn incr_req_count(&self) {
        self.request_count.incr();
    }

    pub fn incr_remote_internal_error_count(&self) {
        self.remote_internal_error_count.incr();
    }

    pub fn incr_for_stream_error(
        &self,
        stream_error: &reqwest_eventsource::Error,
    ) {
        match stream_error {
            reqwest_eventsource::Error::StreamEnded
            | reqwest_eventsource::Error::Transport(..) => {
                self.incr_remote_internal_error_count();
            }
            reqwest_eventsource::Error::InvalidStatusCode(status_code, ..) => {
                if status_code.is_server_error() {
                    self.incr_remote_internal_error_count();
                    tracing::error!(status_code = %status_code, "received error response in stream");
                } else if status_code.is_client_error() {
                    tracing::debug!(status_code = %status_code, "got upstream client error in stream");
                }
            }
            _ => {}
        }
    }
}
