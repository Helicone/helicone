pub mod dispatcher;
pub mod error;
pub mod mapper;
pub mod registry;
pub mod router;
pub mod types;

use types::config::Config;
use worker::*;

#[event(fetch)]
async fn fetch(
    req: HttpRequest,
    _env: Env,
    _ctx: Context,
) -> Result<http::Response<dispatcher::RespBody>> {
    let config = Config::default();
    todo!()
    // router::route(req, config).await
}
