use opentelemetry::metrics::{Counter, Meter};

#[derive(Debug, Clone)]
pub struct Metrics {
    pub error_count: Counter<u64>,
}

impl Metrics {
    #[must_use]
    pub fn new(meter: &Meter) -> Self {
        let error_count = meter
            .u64_counter("error_count")
            .with_description("Number of error occurences")
            .build();
        Self { error_count }
    }
}
