use derive_more::{AsRef, From, Into};

use crate::types::provider::InferenceProvider;

#[derive(Debug, Clone, AsRef, From, Into)]
pub struct ProviderRequestId(pub(crate) http::HeaderValue);

#[derive(Debug, Clone, Copy, AsRef, From, Into)]
pub struct DirectProxy(pub(crate) InferenceProvider);
