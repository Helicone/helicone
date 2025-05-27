pub mod attribute_extractor;
pub mod rolling_counter;
pub mod system;

use opentelemetry::metrics::{Counter, Gauge, Meter};

pub use self::rolling_counter::RollingCounter;

/// The top level struct that contains all metrics
/// which are exported to OpenTelemetry.
#[derive(Debug, Clone)]
pub struct Metrics {
    pub error_count: Counter<u64>,
    pub provider_health: Gauge<u64>,
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
        Self {
            error_count,
            provider_health,
        }
    }
}
