pub mod anthropic;
pub mod openai;

use std::{
    sync::Arc,
    task::{Context, Poll},
};

use anthropic::AnthropicDispatcher;
use futures::future::BoxFuture;
use openai::OpenaiDispatcher;
use tower::{Service, ServiceBuilder};
use tower_http::add_extension::{AddExtension, AddExtensionLayer};

use crate::{
    app::AppState,
    config::router::RouterConfig,
    error::{api::Error, init::InitError},
    middleware::mapper::{
        model::ModelMapper, registry::EndpointConverterRegistry,
    },
    types::{
        provider::InferenceProvider, request::Request, response::Response,
    },
    utils::handle_error::{ErrorHandler, ErrorHandlerLayer},
};

pub type DispatcherFuture = BoxFuture<'static, Result<Response, Error>>;
pub type DispatcherService = AddExtension<
    AddExtension<
        ErrorHandler<crate::middleware::mapper::Service<Dispatcher>>,
        EndpointConverterRegistry,
    >,
    InferenceProvider,
>;

#[derive(Debug, Clone)]
pub enum Dispatcher {
    OpenAI(OpenaiDispatcher),
    Anthropic(AnthropicDispatcher),
}

impl Dispatcher {
    pub fn new(
        app_state: AppState,
        router_config: &Arc<RouterConfig>,
        provider: InferenceProvider,
    ) -> Result<DispatcherService, InitError> {
        match provider {
            InferenceProvider::OpenAI => {
                let openai_dispatcher = Dispatcher::OpenAI(
                    OpenaiDispatcher::new(app_state.clone())?,
                );
                let model_mapper =
                    ModelMapper::new(app_state.clone(), router_config.clone());
                let converter_registry =
                    EndpointConverterRegistry::new(router_config, model_mapper);
                let service = ServiceBuilder::new()
                    .layer(AddExtensionLayer::new(InferenceProvider::OpenAI))
                    .layer(AddExtensionLayer::new(converter_registry))
                    .layer(ErrorHandlerLayer::new(app_state))
                    .layer(crate::middleware::mapper::Layer)
                    // other middleware: rate limiting, logging, etc, etc
                    // will be added here as well
                    .service(openai_dispatcher);

                Ok(service)
            }
            InferenceProvider::Anthropic => {
                let anthropic_dispatcher = Dispatcher::Anthropic(
                    AnthropicDispatcher::new(app_state.clone())?,
                );
                let model_mapper =
                    ModelMapper::new(app_state.clone(), router_config.clone());
                let converter_registry =
                    EndpointConverterRegistry::new(router_config, model_mapper);
                let service = ServiceBuilder::new()
                    .layer(AddExtensionLayer::new(InferenceProvider::Anthropic))
                    .layer(AddExtensionLayer::new(converter_registry))
                    .layer(ErrorHandlerLayer::new(app_state))
                    .layer(crate::middleware::mapper::Layer)
                    .service(anthropic_dispatcher);

                Ok(service)
            }
            _ => todo!(),
        }
    }
}

impl Service<Request> for Dispatcher {
    type Response = Response;
    type Error = Error;
    type Future = DispatcherFuture;

    fn poll_ready(
        &mut self,
        _cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    #[tracing::instrument(name = "dispatcher", skip_all)]
    fn call(&mut self, req: Request) -> Self::Future {
        // see: https://docs.rs/tower/latest/tower/trait.Service.html#be-careful-when-cloning-inner-services
        let this = self.clone();
        let this = std::mem::replace(self, this);
        Box::pin(async move {
            match this {
                Dispatcher::OpenAI(mut dispatcher) => {
                    dispatcher.call(req).await
                }
                Dispatcher::Anthropic(mut dispatcher) => {
                    dispatcher.call(req).await
                }
            }
        })
    }
}
