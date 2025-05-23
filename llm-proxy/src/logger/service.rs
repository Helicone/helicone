use std::{sync::Arc, time::Duration};

use bytes::Bytes;
use chrono::Utc;
use http::{HeaderMap, StatusCode};
use http_body_util::BodyExt;
use indexmap::IndexMap;
use rusty_s3::S3Action;
use typed_builder::TypedBuilder;
use url::Url;

use crate::{
    app::AppState,
    error::logger::LoggerError,
    types::{
        body::BodyReader,
        logger::{
            HeliconeLogMetadata, Log, LogMessage, RequestLog, ResponseLog,
            S3Log,
        },
        provider::InferenceProvider,
        request::RequestContext,
    },
};

const PUT_OBJECT_SIGN_DURATION: Duration = Duration::from_secs(120);

#[derive(Debug, TypedBuilder)]
pub struct LoggerService {
    app_state: AppState,
    req_ctx: Arc<RequestContext>,
    response_body: BodyReader,
    request_body: Bytes,
    target_url: Url,
    request_headers: HeaderMap,
    response_status: StatusCode,
    provider: InferenceProvider,
}

impl LoggerService {
    #[tracing::instrument(skip_all)]
    async fn log_bodies(
        app_state: &AppState,
        req_ctx: &Arc<RequestContext>,
        request_body: Bytes,
        response_body: Bytes,
    ) -> Result<(), LoggerError> {
        let auth_ctx = req_ctx
            .auth_context
            .as_ref()
            .ok_or(LoggerError::NoAuthContextSet)?;

        let object_path = format!(
            "organizations/{}/requests/{}/raw_request_response_body",
            auth_ctx.org_id.as_ref(),
            req_ctx.request_id
        );
        let action = app_state.0.minio.put_object(&object_path);
        let signed_url = action.sign(PUT_OBJECT_SIGN_DURATION);
        let request_body = String::from_utf8(request_body.to_vec())?;
        let response_body = String::from_utf8(response_body.to_vec())?;

        let s3_log = S3Log::new(request_body, response_body);
        let _resp = app_state
            .0
            .minio
            .client
            .put(signed_url)
            .json(&s3_log)
            .send()
            .await
            .map_err(|e| {
                tracing::debug!(error = %e, "failed to send request to S3");
                LoggerError::FailedToSendRequest(e)
            })?
            .error_for_status()
            .map_err(|e| {
                tracing::error!(error = %e, "failed to log bodies in S3");
                LoggerError::ResponseError(e)
            })?;
        Ok(())
    }

    #[tracing::instrument(skip_all)]
    #[allow(clippy::cast_precision_loss)]
    pub async fn log(mut self) -> Result<(), LoggerError> {
        tracing::trace!("logging request");
        let auth_ctx = self
            .req_ctx
            .auth_context
            .as_ref()
            .ok_or(LoggerError::NoAuthContextSet)?;
        let response_body = self
            .response_body
            .collect()
            .await
            .inspect_err(|_| tracing::error!("infallible errored"))
            .expect("infallible never errors")
            .to_bytes();
        let req_body_len = self.request_body.len();
        let resp_body_len = response_body.len();
        LoggerService::log_bodies(
            &self.app_state,
            &self.req_ctx,
            self.request_body,
            response_body,
        )
        .await?;

        let helicone_metadata =
            HeliconeLogMetadata::from_headers(&mut self.request_headers)?;
        let req_path = self.target_url.path().to_string();
        let request_log = RequestLog::builder()
            .id(self.req_ctx.request_id)
            .user_id(auth_ctx.user_id)
            .properties(IndexMap::new())
            .target_url(self.target_url)
            .provider(self.provider)
            .body_size(req_body_len as f64)
            .path(req_path)
            .request_created_at(self.req_ctx.start_time)
            .is_stream(false)
            .build();
        let response_log = ResponseLog::builder()
            .id(self.req_ctx.request_id)
            .status(f64::from(self.response_status.as_u16()))
            .body_size(resp_body_len as f64)
            .response_created_at(Utc::now())
            .delay_ms(0.0)
            .build();
        let log = Log::new(request_log, response_log);
        let log_message = LogMessage::builder()
            .authorization(auth_ctx.api_key.clone())
            .helicone_meta(helicone_metadata)
            .log(log)
            .build();

        let helicone_url = self
            .app_state
            .0
            .config
            .helicone
            .base_url
            .join("/v1/log/request")?;

        let _helicone_response = self
            .app_state
            .0
            .jawn_client
            .post(helicone_url)
            .json(&log_message)
            .header(
                "authorization",
                format!("Bearer {}", auth_ctx.api_key),
            )
            .send()
            .await
            .map_err(|e| {
                tracing::debug!(error = %e, "failed to send request to helicone");
                LoggerError::FailedToSendRequest(e)
            })?
            .error_for_status()
            .map_err(|e| {
                tracing::error!(error = %e, "failed to log request to helicone");
                LoggerError::ResponseError(e)
            })?;

        Ok(())
    }
}
