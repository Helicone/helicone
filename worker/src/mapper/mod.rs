pub mod error;
pub mod openai;

/// TryFrom but allows us to implement it for foreign types, so we can maintain
/// boundaries between our business logic and the provider types.
pub trait TryConvert<Source>: Sized {
    type Error;

    fn try_convert(value: Source) -> std::result::Result<Self, Self::Error>;
}

pub trait Convert<Source>: Sized {
    fn convert(value: Source) -> Self;
}
