use chrono::{DateTime, Utc};

use super::types::{Config, MessageTypeRX, Update};
const MAX_HISTORY_SIZE: usize = 100;

#[derive(Debug, Default)]
pub struct ControlPlaneState {
    pub last_heartbeat: Option<DateTime<Utc>>,
    pub config: Config,

    // used mainly for debugging and testing, can remove later
    pub history: Vec<MessageTypeRX>,
}

impl ControlPlaneState {
    #[must_use]
    pub fn new() -> Self {
        Self {
            last_heartbeat: None,
            config: Config::default(),
            history: Vec::new(),
        }
    }
    pub fn update(&mut self, m: MessageTypeRX) {
        self.history.push(m.clone());
        if self.history.len() > MAX_HISTORY_SIZE {
            self.history.remove(0);
        }

        match m {
            MessageTypeRX::Update(Update::Keys { data }) => {
                self.config.keys = data;
            }
            MessageTypeRX::Update(Update::AuthData { data }) => {
                self.config.auth = data;
            }
            MessageTypeRX::Update(Update::Config { data }) => {
                self.config = data;
            }
            MessageTypeRX::Ack(_) => todo!(),
        }
    }
}
