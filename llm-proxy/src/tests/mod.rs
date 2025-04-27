pub mod error;
pub mod harness;

pub trait TestDefault {
    fn default() -> Self;
}
