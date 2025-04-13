use displaydoc::Display;
use thiserror::Error;

/// Database errors
#[derive(Debug, Error, Display, strum::AsRefStr)]
pub enum DatabaseError {
    /// Tokio postgres error: {0}
    TokioPostgres(#[from] tokio_postgres::Error),
    /// Failed to fetch connection: {0}
    Connection(#[from] deadpool_postgres::PoolError),
}
