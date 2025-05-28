pub mod api;
pub mod auth;
pub mod init;
pub mod internal;
pub mod invalid_req;
pub mod logger;
pub mod provider;
pub mod runtime;

pub trait ErrorMetric {
    /// Convert an error type into a low-cardinality string
    /// that can be used in metrics.
    fn error_metric(&self) -> String;
}
