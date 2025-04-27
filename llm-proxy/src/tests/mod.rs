pub mod error;
pub mod harness;

pub trait TestDefault {
    fn test_default() -> Self;
}
