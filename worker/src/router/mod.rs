pub mod picker;
pub mod request_context;
use http::Response;
use picker::RouterPicker;
use reqwest::Client;
use tower::{Service, ServiceBuilder, ServiceExt, steer::Steer};
use worker::Result;

use crate::{
    dispatcher::{Dispatcher, ReqBody, RespBody},
    types::config::Config,
};

pub async fn route(
    req: http::Request<ReqBody>,
    config: Config,
) -> Result<Response<RespBody>> {
    // llm-proxy request lifecycle and flow:
    // 0. Receive request.
    // 1. Auth middleware: extract Helicone key, API provider key, perform
    //    checks (RBAC)
    // 2. Fetch+cache router config and other Helicone context
    // 3. Build ServiceStack + router based on user's router config.
    // 4. Use router to route request to appropriate provider impl for each
    //    provider), which will dispatch the actual request to the provider.
    //    - Fallbacks if configured (the `Mapper<A, B>` struct will directly map
    //      types here using TryConvert)
    // 5. In the request dispatcher, convert to concrete types if redirecting to
    //    a different provider, so that the request can be mapped to the other
    //    provider's request type. Then proxy request.
    // 6. Return response to client
    // 7. Log request/response via Kafka + S3
    let mut services = Vec::new();
    for (provider, _url) in config.dispatcher.provider_urls.iter() {
        let dispatcher = Dispatcher::new(Client::new(), provider.clone());
        services.push(dispatcher);
    }
    let service = Steer::new(services, RouterPicker);

    let mut service_stack = ServiceBuilder::new()
        .layer(crate::router::request_context::Layer)
        // other middleware: rate limiting, logging, etc, etc
        .service(service);

    let response = service_stack
        .ready()
        .await
        .unwrap()
        .call(req)
        .await
        .unwrap();

    Ok(response)
}
