//! A generic rate limit tower layer.
//!
//! MIT License
//! Copyright (c) mohammadsamir
use std::task::{Context, Poll};

use axum_core::response::IntoResponse;
use brakes::{
    RateLimiter,
    backend::Backend,
    types::{LimiterType, RateLimiterError},
};
use derive_more::Display;
use futures::future::{Either, Ready, ready};
use http::StatusCode;
use tower::{Layer, Service};

use crate::{
    error::api::ErrorResponse,
    types::{json::Json, request::Request, response::Response},
};

pub trait KeyExtractor: Clone {
    /// Extraction method, will return [`RateLimiterError`] response when the
    /// extract failed
    fn extract<T>(
        &self,
        req: &http::Request<T>,
    ) -> Result<String, KeyExtractorError>;
}

#[derive(Debug, Clone, Copy, Display)]
pub enum KeyExtractorError {
    /// Unable to extract key from request
    UnableToExtractKey,
}

impl IntoResponse for KeyExtractorError {
    fn into_response(self) -> axum_core::response::Response {
        match self {
            KeyExtractorError::UnableToExtractKey => (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse {
                    error: "Unauthenticated".to_string(),
                }),
            )
                .into_response(),
        }
    }
}

#[derive(Debug, Display)]
pub struct RateLimiterErrorWrapper(RateLimiterError);

impl IntoResponse for RateLimiterErrorWrapper {
    fn into_response(self) -> axum_core::response::Response {
        match self.0 {
            RateLimiterError::RateExceeded => (
                StatusCode::TOO_MANY_REQUESTS,
                Json(ErrorResponse {
                    error: "Rate limit exceeded".to_string(),
                }),
            )
                .into_response(),
            RateLimiterError::BackendError(error) => {
                tracing::error!(error = %error, "rate limit backend error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "Rate limit internal server error".to_string(),
                    }),
                )
                    .into_response()
            }
            RateLimiterError::MalformedValue(error) => {
                tracing::error!(error = %error, "rate limit malformed value");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ErrorResponse {
                        error: "Rate limit internal server error".to_string(),
                    }),
                )
                    .into_response()
            }
            RateLimiterError::WrongLimiterInstanceType
            | RateLimiterError::BackendConflict => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "Rate limit internal server error".to_string(),
                }),
            )
                .into_response(),
        }
    }
}

#[derive(Clone)]
pub struct TowerRateLimiter<S, T, B, K> {
    inner: S,
    limiter: RateLimiter<T, B>,
    key_extractor: K,
}

impl<S, T, B, K> std::fmt::Debug for TowerRateLimiter<S, T, B, K>
where
    S: std::fmt::Debug,
    K: std::fmt::Debug,
{
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("TowerRateLimiter")
            .field("inner", &self.inner)
            .field("key_extractor", &self.key_extractor)
            .finish_non_exhaustive()
    }
}

impl<S, T: LimiterType, B: Backend, K> TowerRateLimiter<S, T, B, K> {
    pub fn new(inner: S, limiter: RateLimiter<T, B>, key_extractor: K) -> Self {
        TowerRateLimiter {
            inner,
            limiter,
            key_extractor,
        }
    }
}

impl<S, T, B, K> Service<Request> for TowerRateLimiter<S, T, B, K>
where
    S: Service<Request, Response = Response>,
    T: LimiterType,
    B: Backend,
    K: KeyExtractor,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = Either<Ready<Result<Self::Response, Self::Error>>, S::Future>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, request: Request) -> Self::Future {
        let Ok(key) = self.key_extractor.extract(&request) else {
            return Either::Left(ready(Ok(
                KeyExtractorError::UnableToExtractKey.into_response(),
            )));
        };

        match self
            .limiter
            // TODO: add support for x-retry headers
            .is_ratelimited(&key)
        {
            Ok(()) => Either::Right(self.inner.call(request)),
            Err(e) => {
                let response = RateLimiterErrorWrapper(e).into_response();
                Either::Left(ready(Ok(response)))
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct TowerRateLimiterLayer<T, B, K> {
    limiter: RateLimiter<T, B>,
    key_extractor: K,
}

impl<T: LimiterType, B: Backend, K> TowerRateLimiterLayer<T, B, K> {
    pub fn new(limiter: RateLimiter<T, B>, key_extractor: K) -> Self {
        TowerRateLimiterLayer {
            limiter,
            key_extractor,
        }
    }
}

impl<S, T, B, K: Clone> Layer<S> for TowerRateLimiterLayer<T, B, K>
where
    T: LimiterType,
    B: Backend,
{
    type Service = TowerRateLimiter<S, T, B, K>;

    fn layer(&self, service: S) -> Self::Service {
        TowerRateLimiter::new(
            service,
            self.limiter.clone(),
            self.key_extractor.clone(),
        )
    }
}
