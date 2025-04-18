use std::{convert::Infallible, sync::Arc};

use http::StatusCode;
use minio_rsc::{Minio, provider::StaticProvider};
use rama::{
    Layer, Service,
    error::{ErrorContext, OpaqueError},
    http::{
        Body, IntoResponse, Request, Response,
        core::upgrade::Upgraded,
        layer::{
            classify::{NeverClassifyEos, ServerErrorsFailureClass},
            trace::{DefaultMakeSpan, ResponseBody, TraceLayer},
            upgrade::UpgradeLayer,
        },
        matcher::MethodMatcher,
        server::HttpServer,
    },
    net::tls::{ApplicationProtocol, server::SelfSignedData},
    service::{BoxService, service_fn},
    tls::rustls::server::{
        TlsAcceptorData, TlsAcceptorDataBuilder, TlsAcceptorLayer,
    },
};
use tracing::Level;

use crate::{
    config::Config, dispatcher::Dispatcher, error::init::InitError,
    store::StoreRealm, types::provider::Provider,
};

#[derive(Debug, Clone)]
pub struct AppState(pub Arc<InnerAppState>);
pub type Context = rama::Context<AppState>;

pub struct InnerAppState {
    pub config: Config,
    pub tls_acceptor: TlsAcceptorData,
    pub minio: Option<Minio>,
    pub store: StoreRealm,
}

impl std::fmt::Debug for InnerAppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let minio = if self.minio.is_some() { "Some" } else { "None" };
        f.debug_struct("AppState")
            .field("config", &self.config)
            .field("store", &self.store)
            .field("minio", &minio)
            .finish()
    }
}

impl AppState {
    pub fn new(config: Config) -> Result<Self, InitError> {
        let tls_acceptor = new_mitm_tls_service_data()
            .context("generate self-signed mitm tls cert")
            .map_err(InitError::Tls)?;

        let provider = StaticProvider::from_env();
        let minio = if let Some(provider) = provider {
            Some(
                Minio::builder()
                    .endpoint(config.minio.host.clone())
                    .provider(provider)
                    // we don't need TLS since this is only within the cluster
                    .secure(false)
                    .build()?,
            )
        } else {
            None
        };
        let pg_config =
            sqlx::postgres::PgPoolOptions::from(config.database.clone());
        let pg_pool = pg_config
            .connect_lazy(&config.database.url.0)
            .map_err(InitError::DatabaseConnection)?;

        Ok(Self(Arc::new(InnerAppState {
            config,
            tls_acceptor,
            minio,
            store: StoreRealm::new(pg_pool),
        })))
    }
}

pub struct App {
    service: BoxService<
        AppState,
        Request,
        Response<
            ResponseBody<
                Body,
                NeverClassifyEos<ServerErrorsFailureClass>,
                (),
                (),
            >,
        >,
        Infallible,
    >,
}

impl App {
    pub fn new(ctx: Context) -> Self {
        // add middleware: https://docs.rs/rama/latest/rama/http/layer/error_handling/struct.ErrorHandler.html
        let service = Dispatcher::new_with_middleware(ctx, Provider::OpenAI);
        let service = (
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::new().level(Level::ERROR))
                .on_body_chunk(())
                .on_eos(()),
            UpgradeLayer::new(
                MethodMatcher::CONNECT,
                service_fn(http_connect_accept),
                service_fn(http_connect_proxy),
            ),
        )
            .into_layer(service);
        Self {
            service: BoxService::new(service),
        }
    }
}

impl Service<AppState, Request> for App {
    type Response = Response<ResponseBody<Body, NeverClassifyEos<ServerErrorsFailureClass>, (), ()>>;
    type Error = Infallible;

    async fn serve(&self, ctx: Context, req: Request) -> Result<Self::Response, Self::Error> {
        self.service.serve(ctx, req).await
    }
}

async fn http_connect_accept(
    mut ctx: Context,
    req: Request,
) -> Result<(Response, Context, Request), Response> {
    match ctx.get_or_try_insert_with_ctx::<rama::net::http::RequestContext, _>(
        |ctx| (ctx, &req).try_into(),
    ) {
        Ok(request_ctx) => {
            tracing::info!("accept CONNECT to {}", request_ctx.authority);
        }
        Err(err) => {
            tracing::error!(err = %err, "error extracting authority");
            return Err(StatusCode::BAD_REQUEST.into_response());
        }
    }

    Ok((StatusCode::OK.into_response(), ctx, req))
}

async fn http_connect_proxy(
    ctx: Context,
    upgraded: Upgraded,
) -> Result<(), Infallible> {
    let http_service =
        Dispatcher::new_with_middleware(ctx.clone(), Provider::OpenAI);
    let http_transport_service =
        HttpServer::auto(ctx.executor().clone()).service(http_service);

    let https_service =
        TlsAcceptorLayer::new(ctx.state().0.tls_acceptor.clone())
            .into_layer(http_transport_service);

    https_service
        .serve(ctx, upgraded)
        .await
        .expect("infallible");

    Ok(())
}

// TODO: replace self-signed certs
fn new_mitm_tls_service_data() -> Result<TlsAcceptorData, OpaqueError> {
    let data = TlsAcceptorDataBuilder::new_self_signed(SelfSignedData {
        organisation_name: Some("Example Server Acceptor".to_owned()),
        ..Default::default()
    })
    .context("self signed builder")?
    .with_alpn_protocols(&[
        ApplicationProtocol::HTTP_2,
        ApplicationProtocol::HTTP_11,
    ])
    .with_env_key_logger()
    .context("with env key logger")?
    .build();

    Ok(data)
}
