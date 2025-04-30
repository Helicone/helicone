pub mod catch_panic;
pub mod handle_error;
pub mod meltdown;

use std::{fmt, fmt::Display, marker::PhantomData, str::FromStr};

use serde::{
    Deserializer, Serializer,
    de::{Error as DeError, Visitor},
};

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
