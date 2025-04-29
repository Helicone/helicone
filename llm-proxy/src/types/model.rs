use chrono::{DateTime, Utc};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Version {
    Latest,
    Date(DateTime<Utc>),
    #[serde(
        serialize_with = "crate::utils::serialize_to_str",
        deserialize_with = "crate::utils::deserialize_from_str"
    )]
    Semver(semver::Version),
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Model {
    pub name: String,
    pub version: Option<Version>,
}

impl Model {
    pub fn new(name: String, version: Option<Version>) -> Self {
        Self { name, version }
    }
}

impl<'de> Deserialize<'de> for Model {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        use chrono::NaiveDate;
        use serde::de::Error;

        let s = String::deserialize(deserializer)?;

        let mut name = s.clone();
        let mut version: Option<Version> = None;

        // - scan string starting from the right
        // - extract first segment from the end until a '-' or an '@',
        //   - check if the segment == 'latest'
        //   - attempt to parse the segment as a date in the format YYYY-MM-DD
        //     or YYYYMMDD
        //   - attempt to parse the segment as a semver version
        // - if the first segment cannot be parsed as a date or semver version
        //   or 'latest', then the segment is the name and the version is None

        todo!()
    }
}

impl serde::Serialize for Model {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = match &self.version {
            None => &self.name,
            Some(Version::Latest) => &format!("{}-latest", &self.name),
            Some(Version::Date(dt)) => {
                &format!("{}-{}", &self.name, dt.format("%Y-%m-%d"))
            }
            Some(Version::Semver(v)) => &format!("{}-{}", &self.name, v),
        };
        serializer.serialize_str(s)
    }
}
