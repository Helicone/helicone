pub mod catch_panic;
pub mod handle_error;
pub mod meltdown;

use std::{fmt, fmt::Display, marker::PhantomData, str::FromStr};

use http::HeaderValue;
use serde::{
    Deserializer, Serializer,
    de::{Error as DeError, Visitor},
};
use url::Url;

use crate::error::{internal::InternalError, invalid_req::InvalidRequestError};

pub trait ResponseExt: Sized {
    fn error_for_status(self) -> Result<Self, crate::error::api::ApiError>;
}

impl<B> ResponseExt for http::Response<B> {
    fn error_for_status(self) -> Result<Self, crate::error::api::ApiError> {
        let status = self.status();
        if status.is_client_error() {
            Err(InvalidRequestError::Provider4xxError(status).into())
        } else if status.is_server_error() {
            Err(InternalError::Provider5xxError(status).into())
        } else {
            Ok(self)
        }
    }
}

pub fn deserialize_from_str<'de, T, D>(deserializer: D) -> Result<T, D::Error>
where
    T: FromStr,
    T::Err: Display,
    D: Deserializer<'de>,
{
    struct Helper<S>(PhantomData<S>);
    impl<S> Visitor<'_> for Helper<S>
    where
        S: FromStr,
        <S as FromStr>::Err: Display,
    {
        type Value = S;

        fn expecting(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
            write!(formatter, "a string")
        }

        fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
        where
            E: DeError,
        {
            value.parse::<Self::Value>().map_err(DeError::custom)
        }
    }

    deserializer.deserialize_str(Helper(PhantomData))
}

pub fn serialize_to_str<T, S>(
    value: &T,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    T: Display,
    S: Serializer,
{
    serializer.serialize_str(&value.to_string())
}

pub(crate) fn host_header(url: &Url) -> HeaderValue {
    match url.host() {
        Some(url::Host::Domain(host)) => HeaderValue::from_str(host).unwrap(),
        Some(url::Host::Ipv4(host)) => {
            HeaderValue::from_str(host.to_string().as_str()).unwrap()
        }
        Some(url::Host::Ipv6(host)) => {
            HeaderValue::from_str(host.to_string().as_str()).unwrap()
        }
        _ => HeaderValue::from_str("").unwrap(),
    }
}

pub(crate) fn default_true() -> bool {
    true
}
