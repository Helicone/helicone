use std::sync::Arc;

use http::Request;
use tower::steer::Picker;
use worker::console_log;

use crate::{
    dispatcher::{AiProviderDispatcher, ReqBody as Body},
    types::request::RequestContext,
};

/// Selects a service based on the `model` specified in the `RequestContext`
/// attached to the request and the rules defined in `RouterConfig`.
#[derive(Clone)]
pub struct RouterPicker;

// Implement the Picker trait for any Service type S and hyper::Request<Body>
impl<S> Picker<S, Request<Body>> for RouterPicker
where
    S: AiProviderDispatcher,
{
    /// Chooses a service index based on the request's `RequestContext`.
    fn pick(&mut self, req: &Request<Body>, services: &[S]) -> usize {
        println!("in router picker");
        let context = req.extensions().get::<Arc<RequestContext>>().unwrap();
        let target_provider = context.proxy_context.target_provider;
        let index = services
            .iter()
            .position(|s| s.provider() == target_provider)
            .unwrap();
        println!("Picked service index: {}", index);
        index
    }
}
