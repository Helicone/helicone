use std::{sync::Arc, time::Duration};

use rustc_hash::FxHashMap as HashMap;

use crate::{
    endpoints::{
        ApiEndpoint,
        anthropic::{Anthropic, Messages},
        google::{GenerateContents, Google},
        openai::{ChatCompletions, OpenAI},
    },
    error::internal::InternalError,
    metrics::RollingCounter,
};

/// We use this to track metrics for monitoring provider health.
///
/// We do this separately from the OpenTelemetry metrics because a) they
/// don't provide a way to query the metrics and b) it's easy to implement
/// the rolling window this way.
#[derive(Debug, Clone)]
pub struct EndpointMetricsRegistry {
    known_endpoints: Arc<HashMap<ApiEndpoint, EndpointMetrics>>,
}

impl EndpointMetricsRegistry {
    pub fn endpoint_metrics(
        &self,
        api_endpoint: ApiEndpoint,
    ) -> Result<&EndpointMetrics, InternalError> {
        tracing::debug!("api_endpoint: {:?}", api_endpoint);
        tracing::debug!("known_endpoints: {:?}", self.known_endpoints);
        self.known_endpoints
            .get(&api_endpoint)
            .ok_or(InternalError::MetricsNotConfigured(api_endpoint))
    }
}

impl Default for EndpointMetricsRegistry {
    fn default() -> Self {
        let mut known_endpoints = HashMap::default();
        known_endpoints.insert(
            ApiEndpoint::OpenAI(OpenAI::ChatCompletions(ChatCompletions)),
            EndpointMetrics::default(),
        );
        known_endpoints.insert(
            ApiEndpoint::Anthropic(Anthropic::Messages(Messages)),
            EndpointMetrics::default(),
        );
        known_endpoints.insert(
            ApiEndpoint::Google(Google::GenerateContents(GenerateContents)),
            EndpointMetrics::default(),
        );
        Self {
            known_endpoints: Arc::new(known_endpoints),
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
            reqwest_eventsource::Error::InvalidStatusCode(status_code, ..)
                if status_code.is_server_error() =>
            {
                self.incr_remote_internal_error_count();
            }
            _ => {}
        }
    }

    pub fn incr_for_stream_error_debug(
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
                    tracing::warn!(status_code = %status_code, "got upstream client error in stream");
                }
            }
            _ => {}
        }
    }
}
