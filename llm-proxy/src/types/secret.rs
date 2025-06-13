use std::{
    fmt::{self, Debug, Formatter},
    ops::{Deref, DerefMut},
};

/// A wrapper around a type containing secrets.
///
/// This type can be used to wrap secrets without worrying about accidentally
/// logging or serializing them. This type cannot be serialized, and its
/// [`Debug`] implementation doesn't contain anything from the inner type.
#[derive(Default, Clone, Copy, PartialEq, Eq, Hash, serde::Deserialize)]
pub struct Secret<T>(T);

impl<T> Secret<T> {
    pub fn expose(&self) -> &T {
        &self.0
    }
}

impl<T> From<T> for Secret<T> {
    fn from(value: T) -> Self {
        Self(value)
    }
}

impl<T> serde::Serialize for Secret<T> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str("*****")
    }
}

impl<T> Debug for Secret<T> {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.write_str("*****")
    }
}

impl<T> Deref for Secret<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> DerefMut for Secret<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}
