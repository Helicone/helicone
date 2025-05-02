use std::{
    borrow::Cow,
    fmt::{self, Display},
    str::FromStr,
};

use chrono::{DateTime, NaiveDate, TimeZone, Utc};
use derive_more::AsRef;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

use super::provider::Provider;
use crate::middleware::mapper::error::MapperError;

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

#[derive(Debug, Clone, PartialEq, Eq, Hash, AsRef)]
pub struct ModelName<'a>(Cow<'a, str>);

impl<'a> ModelName<'a> {
    pub fn borrowed(name: &'a str) -> Self {
        Self(Cow::Borrowed(name))
    }

    pub fn owned(name: String) -> Self {
        Self(Cow::Owned(name))
    }
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

    pub fn provider(&self) -> Option<Provider> {
        if self.name.as_str().starts_with("gpt-")
            || self.name.as_str().starts_with("o")
        {
            Some(Provider::OpenAI)
        } else if self.name.as_str().starts_with("claude-") {
            Some(Provider::Anthropic)
        } else {
            None
        }
    }
}

impl FromStr for Model {
    type Err = MapperError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut name = s.to_string(); // Default to full string as name
        let mut version: Option<Version> = None;

        // Iterate through separators from right-to-left
        for (idx, ch) in s.char_indices().rev() {
            if ch == '-' || ch == '@' {
                // Check for trailing separator
                if idx == s.len() - 1 {
                    return Err(MapperError::InvalidModelName(name));
                }

                let candidate = &s[idx + 1..];

                // Try parsing candidate as a version
                let mut found_version = true;
                if candidate.eq_ignore_ascii_case("latest") {
                    version = Some(Version::Latest);
                } else if let Some(dt) = parse_date(candidate) {
                    version = Some(Version::Date(dt));
                } else if let Ok(semver_ver) = semver::Version::parse(candidate)
                {
                    version = Some(Version::Semver(semver_ver));
                } else {
                    found_version = false; // This suffix didn't parse
                }

                if found_version {
                    // Successfully parsed the suffix as a version,
                    // so the part before the separator is the name.
                    name = s[..idx].to_string();
                    break; // Stop searching for separators
                }
                // If the suffix didn't parse, this separator might be part of
                // the name. Continue the loop to check the next
                // separator to the left.
            }
        }

        // If the loop finished without finding a valid version suffix,
        // `name` remains the original string `s`, and `version` remains `None`.

        Ok(Model { name, version })
    }
}

impl<'de> Deserialize<'de> for Model {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Model::from_str(&s).map_err(serde::de::Error::custom)
    }
}

fn parse_date(input: &str) -> Option<DateTime<Utc>> {
    // try YYYY-MM-DD first
    let parse_ymd_result = NaiveDate::parse_from_str(input, "%Y-%m-%d");
    if let Ok(date) = parse_ymd_result {
        if let Some(naive_dt) = date.and_hms_opt(0, 0, 0) {
            return Some(Utc.from_utc_datetime(&naive_dt));
        }
    }
    // then YYYYMMDD
    let parse_compact_result = NaiveDate::parse_from_str(input, "%Y%m%d");
    if let Ok(date) = parse_compact_result {
        if let Some(naive_dt) = date.and_hms_opt(0, 0, 0) {
            return Some(Utc.from_utc_datetime(&naive_dt));
        }
    }
    None
}

impl serde::Serialize for Model {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = self.to_string();
        serializer.serialize_str(&s)
    }
}

impl Display for Model {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self.version {
            None => write!(f, "{}", self.name),
            Some(Version::Latest) => write!(f, "{}-latest", self.name),
            Some(Version::Date(dt)) => {
                write!(f, "{}-{}", self.name, dt.format("%Y-%m-%d"))
            }
            Some(Version::Semver(v)) => write!(f, "{}-{}", self.name, v),
        }
    }
}

#[cfg(test)]
mod tests {
    use chrono::{NaiveDate, TimeZone, Utc};
    use semver::Version as SemverVersion;
    use serde_json;

    use super::*;

    #[test]
    fn test_deserialize_no_version() {
        let json = r#""model-name""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "model-name".to_string(),
                version: None
            }
        );
    }

    #[test]
    fn test_deserialize_latest_version_hyphen() {
        let json = r#""model-name-latest""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "model-name".to_string(),
                version: Some(Version::Latest)
            }
        );
    }

    #[test]
    fn test_deserialize_latest_version_at() {
        let json = r#""model-name@latest""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "model-name".to_string(),
                version: Some(Version::Latest)
            }
        );
    }

    #[test]
    fn test_deserialize_date_version_hyphen_yyyy_mm_dd() {
        let json = r#""model-name-2023-10-27""#;
        let model: Model = serde_json::from_str(json).unwrap();
        let expected_date = Utc.from_utc_datetime(
            &NaiveDate::from_ymd_opt(2023, 10, 27)
                .unwrap()
                .and_hms_opt(0, 0, 0)
                .unwrap(),
        );
        assert_eq!(
            model,
            Model {
                name: "model-name".to_string(),
                version: Some(Version::Date(expected_date))
            }
        );
    }

    #[test]
    fn test_deserialize_date_version_at_yyyy_mm_dd() {
        let json = r#""model-name@2023-10-27""#;
        let model: Model = serde_json::from_str(json).unwrap();
        let expected_date = Utc.from_utc_datetime(
            &NaiveDate::from_ymd_opt(2023, 10, 27)
                .unwrap()
                .and_hms_opt(0, 0, 0)
                .unwrap(),
        );
        assert_eq!(
            model,
            Model {
                name: "model-name".to_string(),
                version: Some(Version::Date(expected_date))
            }
        );
    }

    #[test]
    fn test_deserialize_date_version_hyphen_yyyymmdd() {
        let json = r#""model-name-20231027""#;
        let model: Model = serde_json::from_str(json).unwrap();
        let expected_date = Utc.from_utc_datetime(
            &NaiveDate::from_ymd_opt(2023, 10, 27)
                .unwrap()
                .and_hms_opt(0, 0, 0)
                .unwrap(),
        );
        assert_eq!(
            model,
            Model {
                name: "model-name".to_string(),
                version: Some(Version::Date(expected_date))
            }
        );
    }

    #[test]
    fn test_deserialize_date_version_at_yyyymmdd() {
        let json = r#""model-name@20231027""#;
        let model: Model = serde_json::from_str(json).unwrap();
        let expected_date = Utc.from_utc_datetime(
            &NaiveDate::from_ymd_opt(2023, 10, 27)
                .unwrap()
                .and_hms_opt(0, 0, 0)
                .unwrap(),
        );
        assert_eq!(
            model,
            Model {
                name: "model-name".to_string(),
                version: Some(Version::Date(expected_date))
            }
        );
    }

    #[test]
    fn test_deserialize_semver_version_hyphen() {
        let json = r#""model-name-1.2.3""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "model-name".to_string(),
                version: Some(Version::Semver(
                    SemverVersion::parse("1.2.3").unwrap()
                ))
            }
        );
    }

    #[test]
    fn test_deserialize_semver_version_at() {
        let json = r#""model-name@1.2.3""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "model-name".to_string(),
                version: Some(Version::Semver(
                    SemverVersion::parse("1.2.3").unwrap()
                ))
            }
        );
    }

    #[test]
    fn test_deserialize_invalid_version_suffix() {
        let json = r#""model-name-invalid""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "model-name-invalid".to_string(), /* The whole string
                                                         * is the name */
                version: None
            }
        );
    }

    #[test]
    fn test_deserialize_multiple_separators() {
        let json = r#""model-name-with-hyphens@1.0.0""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "model-name-with-hyphens".to_string(),
                version: Some(Version::Semver(
                    SemverVersion::parse("1.0.0").unwrap()
                ))
            }
        );

        let json = r#""model-name@with@ats-latest""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "model-name@with@ats".to_string(),
                version: Some(Version::Latest)
            }
        );
    }

    #[test]
    fn test_deserialize_trailing_separator_error() {
        let json_hyphen = r#""model-name-""#;
        assert!(serde_json::from_str::<Model>(json_hyphen).is_err());

        let json_at = r#""model-name@""#;
        assert!(serde_json::from_str::<Model>(json_at).is_err());
    }

    #[test]
    fn test_deserialize_version_like_name() {
        let json = r#""latest""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "latest".to_string(),
                version: None
            }
        );

        let json = r#""1.2.3""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "1.2.3".to_string(),
                version: None
            }
        );

        let json = r#""2023-01-01""#;
        let model: Model = serde_json::from_str(json).unwrap();
        assert_eq!(
            model,
            Model {
                name: "2023-01-01".to_string(),
                version: None
            }
        );
    }

    #[test]
    fn test_deserialize_version_not_at_end() {
        let json = r#""model-1.0.0-name""#;
        let model: Model = serde_json::from_str(json).unwrap();
        let expected_version = semver::Version::parse("1.0.0-name").unwrap();
        assert_eq!(
            model,
            Model {
                name: "model".to_string(),
                version: Some(Version::Semver(expected_version))
            }
        );
    }

    #[test]
    fn test_serialize_no_version() {
        let model = Model {
            name: "model-name".to_string(),
            version: None,
        };
        let json = serde_json::to_string(&model).unwrap();
        assert_eq!(json, r#""model-name""#);
    }

    #[test]
    fn test_serialize_latest_version() {
        let model = Model {
            name: "model-name".to_string(),
            version: Some(Version::Latest),
        };
        let json = serde_json::to_string(&model).unwrap();
        assert_eq!(json, r#""model-name-latest""#);
    }

    #[test]
    fn test_serialize_date_version() {
        let date = Utc.from_utc_datetime(
            &NaiveDate::from_ymd_opt(2023, 10, 27)
                .unwrap()
                .and_hms_opt(0, 0, 0)
                .unwrap(),
        );
        let model = Model {
            name: "model-name".to_string(),
            version: Some(Version::Date(date)),
        };
        let json = serde_json::to_string(&model).unwrap();
        assert_eq!(json, r#""model-name-2023-10-27""#);
    }

    #[test]
    fn test_serialize_semver_version() {
        let semver_ver = SemverVersion::parse("1.2.3").unwrap();
        let model = Model {
            name: "model-name".to_string(),
            version: Some(Version::Semver(semver_ver)),
        };
        let json = serde_json::to_string(&model).unwrap();
        assert_eq!(json, r#""model-name-1.2.3""#);
    }
}
