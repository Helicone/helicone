use std::time::Duration;

use bytes::Bytes;
use rusty_s3::S3Action;
use serde::{Deserialize, Serialize};
use url::Url;
use uuid::Uuid;

use crate::{
    app_state::AppState,
    config::minio::Minio,
    error::logger::LoggerError,
    logger::service::JawnClient,
    types::{extensions::AuthContext, logger::S3Log, response::JawnResponse},
};

const PUT_OBJECT_SIGN_DURATION: Duration = Duration::from_secs(120);

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SignedUrlRequest {
    request_id: Uuid,
    payload_size: usize,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SignedUrlResponse {
    url: Url,
}

pub enum S3Client<'a> {
    SelfHosted(&'a Minio),
    Sidecar(&'a JawnClient),
}

impl<'a> S3Client<'a> {
    #[must_use]
    pub fn self_hosted(minio: &'a Minio) -> Self {
        Self::SelfHosted(minio)
    }

    #[must_use]
    pub fn sidecar(jawn_client: &'a JawnClient) -> Self {
        Self::Sidecar(jawn_client)
    }

    #[tracing::instrument(skip_all)]
    pub async fn log_bodies(
        &self,
        app_state: &AppState,
        auth_ctx: &AuthContext,
        request_id: Uuid,
        request_body: Bytes,
        response_body: Bytes,
    ) -> Result<(), LoggerError> {
        let (signed_url, s3_log) = match self {
            Self::SelfHosted(minio) => {
                let object_path = format!(
                    "organizations/{}/requests/{}/raw_request_response_body",
                    auth_ctx.org_id.as_ref(),
                    request_id
                );
                let action = minio.put_object(&object_path);
                let signed_url = action.sign(PUT_OBJECT_SIGN_DURATION);
                let request_body = String::from_utf8(request_body.to_vec())?;
                let response_body = String::from_utf8(response_body.to_vec())?;

                tracing::trace!("got signed url for self hosted minio");
                let s3_log = S3Log::new(request_body, response_body);
                (signed_url, s3_log)
            }
            Self::Sidecar(client) => {
                let signed_request_url = app_state
                    .config()
                    .helicone_observability
                    .base_url
                    .join("/v1/router/control-plane/sign-s3-url")?;
                let request_body = String::from_utf8(request_body.to_vec())?;
                let response_body = String::from_utf8(response_body.to_vec())?;

                let s3_log = S3Log::new(request_body, response_body);
                let bytes = serde_json::to_vec(&s3_log).map_err(|e| {
                    tracing::error!(error = %e, "failed to serialize s3 log");
                    LoggerError::InvalidLogMessage
                })?;

                let signed_url = client
                  .request_client
                  .post(signed_request_url)
                  .json(&SignedUrlRequest { request_id, payload_size: bytes.len() })
                  .header(
                    "authorization",
                    format!("Bearer {}", auth_ctx.api_key.expose()),
                  )
                  .send()
                  .await
                  .map_err(|e| {
                    tracing::error!(error = %e, "failed to send request for signed url");
                    LoggerError::FailedToSendRequest(e)
                  })?
                  .error_for_status()
                  .map_err(|e| {
                    tracing::error!(error = %e, "failed to get signed url");
                    LoggerError::ResponseError(e)
                  })?;

                let signed_url = signed_url.json::<JawnResponse<SignedUrlResponse>>().await.map_err(|e| {
                    tracing::error!(error = %e, "failed to deserialize signed url response");
                    LoggerError::ResponseError(e)
                })?.data().map_err(|e| {
                    tracing::error!(error = %e, "failed to get signed url");
                    LoggerError::UnexpectedResponse(e)
                })?;
                tracing::trace!("got signed url for sidecar");

                (signed_url.url, s3_log)
            }
        };

        let _resp = app_state
            .0
            .minio
            .as_ref()
            .ok_or(LoggerError::MinioNotConfigured)?
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
}
