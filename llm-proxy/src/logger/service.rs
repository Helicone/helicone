use std::{sync::Arc, time::Duration};

use bytes::Bytes;
use chrono::Utc;
use http::{HeaderMap, StatusCode};
use http_body_util::BodyExt;
use indexmap::IndexMap;
use opentelemetry::KeyValue;
use reqwest::Client;
use rusty_s3::S3Action;
use tokio::{sync::oneshot, time::Instant};
use typed_builder::TypedBuilder;
use url::Url;
use uuid::Uuid;

use crate::{
    app_state::AppState,
    error::{init::InitError, logger::LoggerError},
    metrics::tfft::TFFTFuture,
    types::{
        body::BodyReader,
        extensions::{AuthContext, MapperContext, RequestContext},
        logger::{
            HeliconeLogMetadata, Log, LogMessage, RequestLog, ResponseLog,
            S3Log,
        },
        provider::InferenceProvider,
    },
};

const PUT_OBJECT_SIGN_DURATION: Duration = Duration::from_secs(120);
const JAWN_CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Debug)]
pub struct JawnClient {
    pub request_client: Client,
}

impl JawnClient {
    pub fn new() -> Result<Self, InitError> {
        Ok(Self {
            request_client: Client::builder()
                .tcp_nodelay(true)
                .connect_timeout(JAWN_CONNECT_TIMEOUT)
                .build()
                .map_err(InitError::CreateReqwestClient)?,
        })
    }
}

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
    mapper_ctx: MapperContext,
    request_start: Instant,
    tfft_rx: oneshot::Receiver<()>,
}

impl LoggerService {
    #[tracing::instrument(skip_all)]
    async fn log_bodies(
        app_state: &AppState,
        auth_ctx: &AuthContext,
        request_id: Uuid,
        request_body: Bytes,
        response_body: Bytes,
    ) -> Result<(), LoggerError> {
        let object_path = format!(
            "organizations/{}/requests/{}/raw_request_response_body",
            auth_ctx.org_id.as_ref(),
            request_id
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
    #[allow(clippy::cast_precision_loss, clippy::too_many_lines)]
    pub async fn log(mut self) -> Result<(), LoggerError> {
        tracing::trace!("logging request");
        let auth_ctx = self
            .req_ctx
            .auth_context
            .as_ref()
            .ok_or(LoggerError::NoAuthContextSet)?;
        let tfft_future = TFFTFuture::new(self.request_start, self.tfft_rx);
        let collect_future = self.response_body.collect();
        let (response_body, tfft_duration) =
            tokio::join!(collect_future, tfft_future);
        let response_body = response_body
            .inspect_err(|_| tracing::error!("infallible errored"))
            .expect("infallible never errors")
            .to_bytes();
        let tfft_duration = tfft_duration.unwrap_or_else(|_| {
            tracing::error!("Failed to get TFFT signal");
            Duration::from_secs(0)
        });
        let req_body_len = self.request_body.len();
        let resp_body_len = response_body.len();
        let request_id = Uuid::new_v4();
        LoggerService::log_bodies(
            &self.app_state,
            auth_ctx,
            request_id,
            self.request_body,
            response_body,
        )
        .await?;

        let model = self.mapper_ctx.model.as_ref().map_or_else(
            || "unknown".to_string(),
            std::string::ToString::to_string,
        );
        let attributes = [
            KeyValue::new("provider", self.provider.to_string()),
            KeyValue::new("model", model),
            KeyValue::new("path", self.target_url.path().to_string()),
        ];
        self.app_state
            .0
            .metrics
            .tfft_duration
            .record(tfft_duration.as_millis() as f64, &attributes);

        let helicone_metadata =
            HeliconeLogMetadata::from_headers(&mut self.request_headers)?;
        let req_path = self.target_url.path().to_string();
        let request_log = RequestLog::builder()
            .id(request_id)
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
            .id(request_id)
            .status(f64::from(self.response_status.as_u16()))
            .body_size(resp_body_len as f64)
            .response_created_at(Utc::now())
            .delay_ms(tfft_duration.as_millis() as f64)
            .build();
        let log = Log::new(request_log, response_log);
        let log_message = LogMessage::builder()
            .authorization(auth_ctx.api_key.expose().clone())
            .helicone_meta(helicone_metadata)
            .log(log)
            .build();

        let helicone_url = self
            .app_state
            .config()
            .helicone
            .base_url
            .join("/v1/log/request")?;

        let _helicone_response = self
            .app_state
            .0
            .jawn_http_client
            .request_client
            .post(helicone_url)
            .json(&log_message)
            .header(
                "authorization",
                format!("Bearer {}", auth_ctx.api_key.expose()),
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
