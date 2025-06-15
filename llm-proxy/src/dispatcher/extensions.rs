use http::Extensions;
use typed_builder::TypedBuilder;

use crate::types::{
    extensions::{AuthContext, ProviderRequestId},
    provider::InferenceProvider,
    router::RouterId,
};

#[derive(Debug, TypedBuilder)]
pub struct ExtensionsCopier {
    inference_provider: InferenceProvider,
    router_id: Option<RouterId>,
    auth_context: Option<AuthContext>,
    provider_request_id: Option<http::HeaderValue>,
}

impl ExtensionsCopier {
    /// Copies required request extensions to response extensions.
    pub fn copy_extensions(self, resp_extensions: &mut Extensions) {
        // MapperContext, ApiEndpoint, and PathAndQuery are copied out of bound
        // from this helper because we already removed them from the request
        // extensions in order to use them in the dispatcher service logic.
        resp_extensions.insert(self.inference_provider);
        if let Some(router_id) = self.router_id {
            resp_extensions.insert(router_id);
        }
        if let Some(auth_context) = self.auth_context {
            resp_extensions.insert(auth_context);
        }
        if let Some(provider_request_id) = self.provider_request_id {
            resp_extensions.insert(ProviderRequestId(provider_request_id));
        }
    }
}
