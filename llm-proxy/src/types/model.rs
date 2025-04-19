use chrono::{DateTime, TimeZone, Utc};
use serde::{Deserialize, Deserializer, Serializer};

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Version {
    Latest,
    Date(DateTime<Utc>),
    Other(String),
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

        // Handle "@latest" suffix first
        if let Some(idx) = s.rfind('@') {
            let ver_str = &s[idx + 1..];
            if ver_str.eq_ignore_ascii_case("latest") {
                name = s[..idx].to_string();
                version = Some(Version::Latest);
            } else {
                name = s[..idx].to_string();
                version = Some(Version::Other(ver_str.to_string()));
            }
        } else if s.ends_with("-latest") {
            // Handle "-latest" suffix
            name = s[..s.len() - "-latest".len()].to_string();
            version = Some(Version::Latest);
        } else {
            // Attempt to extract a date in the form YYYY-MM-DD at the end of
            // the string
            if s.len() >= 10 {
                let potential_date = &s[s.len() - 10..];
                let is_date_fmt =
                    potential_date.chars().enumerate().all(|(i, c)| match i {
                        4 | 7 => c == '-',
                        _ => c.is_ascii_digit(),
                    });

                if is_date_fmt {
                    if let Ok(date) =
                        NaiveDate::parse_from_str(potential_date, "%Y-%m-%d")
                    {
                        // Use the non‑deprecated constructor
                        let naive =
                            date.and_hms_opt(0, 0, 0).ok_or_else(|| {
                                D::Error::custom(
                                    "Failed to create NaiveDateTime from \
                                     parsed date",
                                )
                            })?;
                        let date_time = Utc.from_utc_datetime(&naive);

                        name =
                            s[..s.len() - 10].trim_end_matches('-').to_string();
                        version = Some(Version::Date(date_time));
                    }
                }
            }

            // If no ISO date, try to interpret the last hyphen-separated
            // segment as an arbitrary version string
            if version.is_none() {
                if let Some(idx) = s.rfind('-') {
                    let ver_str = &s[idx + 1..];
                    if ver_str != s {
                        // ensure we actually have something after the hyphen
                        name = s[..idx].to_string();
                        version = Some(Version::Other(ver_str.to_string()));
                    }
                }
            }
        }

        Ok(Model::new(name, version))
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
            Some(Version::Other(v)) => &format!("{}-{}", &self.name, v),
        };
        serializer.serialize_str(s)
    }
}
