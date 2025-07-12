use std::{
    collections::HashMap,
    convert::Infallible,
    hash::{Hash, Hasher},
    sync::Arc,
    task::{Context, Poll},
};

use bytes::Bytes;
use futures::{StreamExt, future::BoxFuture, stream::FuturesUnordered};
use http::{HeaderMap, HeaderName, HeaderValue, StatusCode, request::Parts};
use http_body_util::BodyExt;
use http_cache::{CacheManager, HttpResponse, MokaManager};
use http_cache_semantics::{BeforeRequest, CacheOptions, CachePolicy};
use opentelemetry::KeyValue;
use rustc_hash::FxHasher;
use url::Url;

use crate::{
    app_state::AppState,
    config::{
        cache::{CacheConfig, DEFAULT_BUCKETS, MAX_BUCKET_SIZE},
        router::RouterConfig,
    },
    error::{
        api::ApiError, init::InitError, internal::InternalError,
        invalid_req::InvalidRequestError,
    },
    types::{request::Request, response::Response},
};

const CACHE_HIT_HEADER: HeaderName = HeaderName::from_static("helicone-cache");
const CACHE_BUCKET_IDX: HeaderName =
    HeaderName::from_static("helicone-cache-bucket-idx");
const CACHE_HIT_HEADER_VALUE: HeaderValue = HeaderValue::from_static("hit");
const CACHE_MISS_HEADER_VALUE: HeaderValue = HeaderValue::from_static("miss");

#[derive(Debug)]
struct CacheContext {
    // `Some` only if explicitly set in headers, `None` if not set
    enabled: Option<bool>,
    /// Cache-control header: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control>
    directive: Option<String>,
    buckets: Option<u8>,
    seed: Option<String>,
    options: Option<CacheOptions>,
}

impl CacheContext {
    /// Merge two cache configs. `Other` takes precedence over `Self`.
    #[must_use]
    pub fn merge(&self, other: &Self) -> Self {
        let enabled = if let Some(other_explicitly_set) = other.enabled {
            // if other is set, just use that value (so req headers can disable
            // whether caching is enabled or not per request)
            other_explicitly_set
        } else {
            // if other is not set, use self's value (so router/global config
            // can enable caching if explicitly enabled)
            self.enabled.unwrap_or(false)
        };
        Self {
            enabled: Some(enabled),
            directive: other
                .directive
                .clone()
                .or_else(|| self.directive.clone()),
            buckets: other.buckets.or(self.buckets),
            seed: other.seed.clone().or_else(|| self.seed.clone()),
            options: other.options.or(self.options),
        }
    }
}

#[derive(Debug, Clone)]
pub struct CacheLayer {
    app_state: AppState,
    backend: MokaManager,
    context: Arc<CacheContext>,
}

impl CacheLayer {
    fn new(
        app_state: AppState,
        config: CacheConfig,
    ) -> Result<Self, InitError> {
        let backend = app_state
            .0
            .moka_manager
            .clone()
            .ok_or(InitError::CacheNotConfigured)?;
        let context = CacheContext {
            enabled: Some(true),
            directive: config.directive,
            buckets: Some(config.buckets),
            seed: config.seed,
            options: Some(CacheOptions {
                shared: false,
                ..Default::default()
            }),
        };
        Ok(Self {
            app_state,
            backend,
            context: Arc::new(context),
        })
    }

    pub fn for_router(
        app_state: AppState,
        router_config: &RouterConfig,
    ) -> Option<Self> {
        if let Some(config) = router_config.cache.as_ref() {
            Self::new(app_state, config.clone()).ok()
        } else {
            None
        }
    }

    pub fn global(app_state: &AppState) -> Option<Self> {
        let cloned_app_state = app_state.clone();
        if let Some(config) = &app_state.config().global.cache {
            Self::new(cloned_app_state, config.clone()).ok()
        } else {
            None
        }
    }
}

impl<S> tower::Layer<S> for CacheLayer {
    type Service = CacheService<S>;

    fn layer(&self, inner: S) -> Self::Service {
        CacheService {
            inner,
            app_state: self.app_state.clone(),
            backend: self.backend.clone(),
            context: Arc::clone(&self.context),
        }
    }
}

#[derive(Debug, Clone)]
pub struct CacheService<S> {
    inner: S,
    app_state: AppState,
    backend: MokaManager,
    context: Arc<CacheContext>,
}

impl<S> tower::Service<Request> for CacheService<S>
where
    S: tower::Service<Request, Response = Response, Error = Infallible>
        + Send
        + Clone
        + 'static,
    S::Future: Send + 'static,
{
    type Response = Response;
    type Error = ApiError;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(
        &mut self,
        cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.inner
            .poll_ready(cx)
            .map_err(|_| ApiError::Internal(InternalError::Internal))
    }

    #[tracing::instrument(name = "cache", skip_all)]
    fn call(&mut self, req: Request) -> Self::Future {
        tracing::trace!("cache middleware");
        // see: https://docs.rs/tower/latest/tower/trait.Service.html#be-careful-when-cloning-inner-services
        let mut this = self.clone();
        std::mem::swap(self, &mut this);
        Box::pin(async move {
            let merged_ctx = this.context.merge(&get_cache_ctx(&req)?);
            let backend = this.backend.clone();
            make_request(
                &mut this.inner,
                &this.app_state,
                req,
                &backend,
                merged_ctx,
            )
            .await
        })
    }
}

async fn check_cache<C: CacheManager>(
    cache: &C,
    key: &str,
    req: Request,
    bucket: u8,
    now: std::time::SystemTime,
) -> Result<CacheCheckResult, Box<dyn std::error::Error + Send + Sync>> {
    let Some((http_resp, policy)) = cache.get(key).await? else {
        return Ok(CacheCheckResult::Miss);
    };

    match policy.before_request(&req, now) {
        BeforeRequest::Fresh(parts) => {
            let headers = vec![
                (CACHE_HIT_HEADER, CACHE_HIT_HEADER_VALUE),
                (CACHE_BUCKET_IDX, bucket_header_value(bucket)),
            ];
            let response = build_response(http_resp, parts.status, headers)?;
            Ok(CacheCheckResult::Fresh(response))
        }
        BeforeRequest::Stale { request, matches } if matches => {
            Ok(CacheCheckResult::Stale(request))
        }
        BeforeRequest::Stale { .. } => Ok(CacheCheckResult::Miss),
    }
}

enum CacheCheckResult {
    Fresh(Response),
    Stale(Parts),
    Miss,
}

fn bucket_header_value(bucket: u8) -> HeaderValue {
    HeaderValue::from_str(&bucket.to_string())
        .unwrap_or_else(|_| HeaderValue::from_static("0"))
}

async fn handle_response_for_cache_miss<C: CacheManager>(
    cache: &C,
    key: String,
    req: Request,
    resp: Response,
    bucket: u8,
    cache_options: CacheOptions,
    now: std::time::SystemTime,
) -> Result<Response, ApiError> {
    let policy = CachePolicy::new_options(&req, &resp, now, cache_options);

    if !policy.is_storable() {
        tracing::trace!(
            policy = ?policy,
            "got response that is not storable"
        );
        return Ok(resp);
    }

    let url = Url::parse(&req.uri().to_string())
        .map_err(|e| InvalidRequestError::InvalidUrl(e.to_string()))?;
    let (parts, body) = resp.into_parts();
    let body_bytes = body
        .collect()
        .await
        .map_err(InternalError::CollectBodyError)?
        .to_bytes();

    let http_resp = HttpResponse {
        body: body_bytes.clone().into(),
        headers: get_headers(parts.headers),
        status: parts.status.as_u16(),
        url,
        version: get_version(parts.version),
    };

    let cached = cache
        .put(key, http_resp, policy)
        .await
        .map_err(InternalError::CacheError)?;
    tracing::debug!("cached response");

    build_response(
        cached,
        parts.status,
        vec![
            (CACHE_HIT_HEADER, CACHE_MISS_HEADER_VALUE),
            (CACHE_BUCKET_IDX, bucket_header_value(bucket)),
        ],
    )
    .map_err(Into::into)
}

#[allow(clippy::too_many_lines)]
async fn make_request<S>(
    inner: &mut S,
    app_state: &AppState,
    mut req: Request,
    cache: &MokaManager,
    ctx: CacheContext,
) -> Result<Response, ApiError>
where
    S: tower::Service<Request, Response = Response, Error = Infallible>
        + Send
        + 'static,
{
    if let Some(directive) = ctx.directive {
        req.headers_mut().insert(
            http::header::CACHE_CONTROL,
            HeaderValue::from_str(&directive)
                .map_err(InternalError::InvalidHeader)?,
        );
    }

    let (parts, body) = req.into_parts();
    let body_bytes = body
        .collect()
        .await
        .map_err(InternalError::CollectBodyError)?
        .to_bytes();
    let buckets = ctx.buckets.unwrap_or(DEFAULT_BUCKETS);
    let now = std::time::SystemTime::now();

    // Try each bucket in parallel
    let mut futures = FuturesUnordered::new();
    let hasher = get_hasher(&parts, &body_bytes, ctx.seed.as_deref());
    // fairly samply different buckets
    let mut bucket_indices: Vec<u8> = (0..buckets).collect();
    {
        use rand::seq::SliceRandom;
        let mut rng = rand::rng();
        bucket_indices.shuffle(&mut rng);
    }

    for bucket in bucket_indices {
        let mut cloned_hasher = hasher.clone();
        bucket.hash(&mut cloned_hasher);
        let key = cloned_hasher.finish().to_string();
        let req = Request::from_parts(parts.clone(), body_bytes.clone().into());
        futures.push(async move {
            check_cache(cache, &key, req, bucket, now)
                .await
                .map(|result| (bucket, key, result))
        });
    }

    let mut stale_hits = Vec::new();
    let mut empty_buckets = Vec::new();

    while let Some(result) = futures.next().await {
        match result {
            Ok((bucket, _key, CacheCheckResult::Fresh(mut resp))) => {
                record_cache_hit(app_state, bucket, &parts.uri);
                resp.headers_mut().extend([
                    (CACHE_HIT_HEADER, CACHE_HIT_HEADER_VALUE),
                    (CACHE_BUCKET_IDX, bucket_header_value(bucket)),
                ]);
                return Ok(resp);
            }
            Ok((bucket, key, CacheCheckResult::Stale(stale_parts))) => {
                record_cache_miss(app_state, &parts.uri, bucket);
                stale_hits.push((bucket, key, stale_parts));
            }
            Ok((bucket, _, CacheCheckResult::Miss)) => {
                record_cache_miss(app_state, &parts.uri, bucket);
                empty_buckets.push(bucket);
            }
            Err(e) => {
                tracing::warn!(error = %e, "Cache check error");
            }
        }
    }

    let cache_options = ctx.options.unwrap_or_default();

    // Try stale hits
    if let Some((bucket, key, stale_parts)) = stale_hits.into_iter().next() {
        let req =
            Request::from_parts(stale_parts.clone(), body_bytes.clone().into());
        let resp = inner.call(req).await.map_err(|e| {
            tracing::error!(error = %e, "encountered infallible error");
            ApiError::Internal(InternalError::Internal)
        })?;
        let req_for_cache =
            Request::from_parts(stale_parts, body_bytes.clone().into());
        return handle_response_for_cache_miss(
            cache,
            key,
            req_for_cache,
            resp,
            bucket,
            cache_options,
            now,
        )
        .await;
    }

    // Complete miss - pick a bucket and make the request
    let bucket = empty_buckets
        .first()
        .copied()
        .unwrap_or_else(|| rand::random::<u8>() % buckets);
    let mut cloned_hasher = hasher.clone();
    bucket.hash(&mut cloned_hasher);
    let key = cloned_hasher.finish().to_string();
    record_cache_miss(app_state, &parts.uri, bucket);

    let req = Request::from_parts(parts.clone(), body_bytes.clone().into());
    let resp = inner.call(req).await.map_err(|e| {
        tracing::error!(error = %e, "encountered infallible error");
        ApiError::Internal(InternalError::Internal)
    })?;

    let req_for_cache = Request::from_parts(parts, body_bytes.into());
    handle_response_for_cache_miss(
        cache,
        key,
        req_for_cache,
        resp,
        bucket,
        cache_options,
        now,
    )
    .await
}

fn get_hasher(parts: &Parts, body: &Bytes, seed: Option<&str>) -> FxHasher {
    let mut hasher = FxHasher::default();
    if let Some(s) = seed {
        s.hash(&mut hasher);
    }
    if let Some(pq) = parts.uri.path_and_query() {
        pq.hash(&mut hasher);
    }
    body.hash(&mut hasher);
    hasher
}

fn record_cache_hit(app_state: &AppState, bucket: u8, uri: &http::Uri) {
    let attributes = &[
        KeyValue::new("bucket", bucket.to_string()),
        KeyValue::new("path", uri.path().to_string()),
    ];
    tracing::trace!(bucket = bucket, path = uri.path(), "cache hit");
    app_state.0.metrics.cache.hits.add(1, attributes);
}

fn record_cache_miss(app_state: &AppState, uri: &http::Uri, bucket: u8) {
    let attributes = &[
        KeyValue::new("bucket", bucket.to_string()),
        KeyValue::new("path", uri.path().to_string()),
    ];
    tracing::trace!(bucket = bucket, path = uri.path(), "cache miss");
    app_state.0.metrics.cache.misses.add(1, attributes);
}

fn get_cache_ctx(req: &Request) -> Result<CacheContext, InvalidRequestError> {
    let headers = req.headers();
    let enabled = headers
        .get("helicone-cache-enabled")
        .and_then(|v| v.to_str().map_or(None, |v| v.parse::<bool>().ok()));
    let buckets = headers
        .get("helicone-cache-bucket-max-size")
        .and_then(|v| v.to_str().map_or(None, |v| v.parse::<u8>().ok()));
    if buckets.is_some_and(|b| b > MAX_BUCKET_SIZE) {
        return Err(InvalidRequestError::InvalidCacheConfig);
    }
    let seed = headers
        .get("helicone-cache-seed")
        .and_then(|v| v.to_str().ok().map(String::from));
    let directive = headers
        .get(http::header::CACHE_CONTROL)
        .and_then(|v| v.to_str().ok().map(String::from));
    Ok(CacheContext {
        enabled,
        directive,
        buckets,
        seed,
        options: None,
    })
}

fn get_version(version: http::Version) -> http_cache::HttpVersion {
    match version {
        http::Version::HTTP_09 => http_cache::HttpVersion::Http09,
        http::Version::HTTP_10 => http_cache::HttpVersion::Http10,
        http::Version::HTTP_2 => http_cache::HttpVersion::H2,
        http::Version::HTTP_3 => http_cache::HttpVersion::H3,
        _ => http_cache::HttpVersion::Http11,
    }
}

fn get_headers(headers: HeaderMap) -> HashMap<String, String> {
    headers
        .into_iter()
        .filter_map(|(name, value)| {
            Some((name?.to_string(), value.to_str().ok()?.to_string()))
        })
        .collect()
}

fn build_response(
    cached: HttpResponse,
    status: StatusCode,
    extra_headers: impl IntoIterator<Item = (HeaderName, HeaderValue)>,
) -> Result<Response, InternalError> {
    let mut builder = http::Response::builder().status(status);
    for (k, v) in cached.headers {
        builder = builder.header(k, v);
    }
    let mut response = builder
        .body(cached.body.into())
        .map_err(|_| InternalError::Internal)?;

    response.headers_mut().extend(extra_headers);
    Ok(response)
}
