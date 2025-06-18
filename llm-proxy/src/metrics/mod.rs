pub mod attribute_extractor;
pub mod request_count;
pub mod rolling_counter;
pub mod system;
pub mod tfft;

use opentelemetry::metrics::{Counter, Gauge, Histogram, Meter};

pub use self::rolling_counter::RollingCounter;

/// The top level struct that contains all metrics
/// which are exported to OpenTelemetry.
#[derive(Debug, Clone)]
pub struct Metrics {
    pub error_count: Counter<u64>,
    pub provider_health: Gauge<u64>,
    pub auth_attempts: Counter<u64>,
    pub auth_rejections: Counter<u64>,
    pub request_count: Counter<u64>,
    pub response_count: Counter<u64>,
    pub tfft_duration: Histogram<f64>,
    pub cache: CacheMetrics,
}

#[derive(Debug, Clone)]
pub struct CacheMetrics {
    pub hits: Counter<u64>,
    pub misses: Counter<u64>,
    pub evictions: Counter<u64>,
}

impl Metrics {
    #[must_use]
    pub fn new(meter: &Meter) -> Self {
        let error_count = meter
            .u64_counter("error_count")
            .with_description("Number of error occurences")
            .build();
        let provider_health = meter
            .u64_gauge("provider_health")
            .with_description("Upstream provider health")
            .build();
        let auth_attempts = meter
            .u64_counter("auth_attempts")
            .with_description("Number of authentication attempts")
            .build();
        let auth_rejections = meter
            .u64_counter("auth_rejections")
            .with_description("Number of unauthenticated requests")
            .build();
        let request_count = meter
            .u64_counter("request_count")
            .with_description("Total request count")
            .build();
        let response_count = meter
            .u64_counter("response_count")
            .with_description("Number of successful responses")
            .build();
        let tfft_duration = meter
            .f64_histogram("tfft_duration")
            .with_unit("ms")
            .with_description("Time to first token duration")
            .build();
        let cache_hits = meter
            .u64_counter("cache_hits")
            .with_description("Number of cache hits")
            .build();
        let cache_misses = meter
            .u64_counter("cache_misses")
            .with_description("Number of cache misses")
            .build();
        let cache_evictions = meter
            .u64_counter("cache_evictions")
            .with_description("Number of cache evictions")
            .build();
        let cache = CacheMetrics {
            hits: cache_hits,
            misses: cache_misses,
            evictions: cache_evictions,
        };
        Self {
            error_count,
            provider_health,
            auth_attempts,
            auth_rejections,
            request_count,
            response_count,
            tfft_duration,
            cache,
        }
    }
}
