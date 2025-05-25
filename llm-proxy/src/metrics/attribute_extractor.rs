use http::uri::PathAndQuery;
use opentelemetry::KeyValue;
use tower_otel_http_metrics::ResponseAttributeExtractor;

use crate::types::{
    provider::InferenceProvider, request::MapperContext, router::RouterId,
};

#[derive(Debug, Clone)]
pub struct AttributeExtractor;

impl<B> ResponseAttributeExtractor<B> for AttributeExtractor {
    fn extract_attributes(
        &self,
        response: &http::Response<B>,
    ) -> Vec<KeyValue> {
        let resp_extensions = response.extensions();
        let mut attributes = Vec::new();
        if let Some(mapper_ctx) = resp_extensions.get::<MapperContext>() {
            attributes.push(KeyValue::new("stream", mapper_ctx.is_stream));
            if let Some(model) = &mapper_ctx.model {
                attributes.push(KeyValue::new("model", model.to_string()));
            }
        }
        if let Some(path) = resp_extensions.get::<PathAndQuery>() {
            attributes
                .push(KeyValue::new("provider_path", path.path().to_string()));
        }
        if let Some(provider) = resp_extensions.get::<InferenceProvider>() {
            attributes.push(KeyValue::new("provider", provider.to_string()));
        }
        if let Some(router_id) = resp_extensions.get::<RouterId>() {
            attributes.push(KeyValue::new("router_id", router_id.to_string()));
        }
        attributes
    }
}
