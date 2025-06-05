use super::types::MessageTypeRX;

#[derive(Debug, Default)]
pub struct ControlPlaneState {}

impl ControlPlaneState {
    pub fn update(&mut self, m: MessageTypeRX) {
        match m {
            MessageTypeRX::Config => (),
            MessageTypeRX::Message(m) => (),
        }
    }
}
