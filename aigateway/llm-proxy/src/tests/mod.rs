pub mod harness;
pub mod mock;

pub trait TestDefault {
    fn test_default() -> Self;
}
