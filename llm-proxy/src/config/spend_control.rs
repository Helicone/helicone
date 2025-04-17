use std::{collections::HashMap, time::Duration};

use serde::{Deserialize, Serialize};

use crate::types::org::OrgId;

#[derive(Debug, Default, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct SpendControlConfig {
    #[serde(default)]
    pub spend_controls: Option<HashMap<OrgId, OrgSpendControl>>,
}

#[derive(Debug, Clone, Deserialize, Serialize, Eq, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct OrgSpendControl {
    pub units: String,
    pub quota: u64,
    #[serde(with = "humantime_serde")]
    pub replenish_interval: Duration,
}
