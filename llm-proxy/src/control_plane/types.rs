use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(TS, Serialize, Deserialize, Debug)]
#[ts(export)]
pub enum MessageTypeTX {
    Heartbeat,
}

#[derive(TS, Serialize, Deserialize, Debug)]
#[ts(export)]
pub enum MessageTypeRX {
    Config,
    Message(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn export_types() {
        MessageTypeTX::export_all().unwrap();
        MessageTypeRX::export_all().unwrap();
    }
}
