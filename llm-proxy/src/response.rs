use crate::types::response::Response;

pub trait IntoResponse {
    /// Allows us to convert a `Error` into a http response, since if a `Error`
    /// is returned from a `Service` and reaches `hyper`, the connection
    /// will be terminated.
    fn into_response(self) -> Response;
}
