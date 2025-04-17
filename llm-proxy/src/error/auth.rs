#[derive(Debug, strum::AsRefStr, thiserror::Error)]
pub enum AuthError {
    #[error(transparent)]
    Database(#[from] sqlx::Error),

    #[error(transparent)]
    Reqwest(#[from] reqwest::Error),

    #[error(transparent)]
    TaskJoin(#[from] tokio::task::JoinError),

    #[error("Invalid credentials")]
    InvalidCredentials,

    #[error("Unauthorized: session not found")]
    SessionNotFound,

    #[error("Password reset not allowed")]
    PasswordResetNotAllowed,
}
