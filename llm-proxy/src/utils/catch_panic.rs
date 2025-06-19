use std::any::Any;

use axum_core::response::IntoResponse;
use tower_http::catch_panic::ResponseForPanic;

use crate::error::internal::InternalError;

#[derive(Debug, Clone, Copy)]
pub struct PanicResponder;

impl ResponseForPanic for PanicResponder {
    type ResponseBody = axum_core::body::Body;
    fn response_for_panic(
        &mut self,
        err: Box<dyn Any + Send + 'static>,
    ) -> http::Response<axum_core::body::Body> {
        if let Some(s) = err.downcast_ref::<String>() {
            tracing::error!("Service panicked: {}", s);
        } else if let Some(s) = err.downcast_ref::<&str>() {
            tracing::error!("Service panicked: {}", s);
        } else {
            tracing::error!(
                "Service panicked but `CatchPanic` was unable to downcast the \
                 panic info"
            );
        }
        InternalError::Internal.into_response()
    }
}
