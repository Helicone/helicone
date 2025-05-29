use std::{
    borrow::Cow,
    fmt::{self, Display},
    str::FromStr,
};

use chrono::{DateTime, Datelike, NaiveDate, TimeZone, Utc};
use derive_more::AsRef;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

use super::provider::InferenceProvider;
use crate::middleware::mapper::error::MapperError;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Version {
    /// An alias for the latest version of the model.
    Latest,
    /// An alias for the latest preview version of the model.
    Preview,
    /// A specific version of a preview model based on the date it was released.
    DateVersionedPreview {
        date: DateTime<Utc>,
        /// The format of the date so we know how to re-serialize it
        format: &'static str,
    },
    /// A version of the model based on the date it was released.
    Date {
        date: DateTime<Utc>,
        /// The format of the date so we know how to re-serialize it
        format: &'static str,
    },
    /// A semver version for the model
    Semver(semver::Version),
}

impl<'de> Deserialize<'de> for Version {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Version::from_str(&s).map_err(serde::de::Error::custom)
    }
}

impl Serialize for Version {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl Display for Version {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Version::Latest => write!(f, "latest"),
            Version::Preview => write!(f, "preview"),
            Version::DateVersionedPreview { date, format } => {
                write!(f, "preview-{}", date.format(format))
            }
            Version::Date { date, format } => {
                write!(f, "{}", date.format(format))
            }
            Version::Semver(v) => write!(f, "{v}"),
        }
    }
}

impl FromStr for Version {
    type Err = MapperError;
    fn from_str(input: &str) -> Result<Self, Self::Err> {
        if input.eq_ignore_ascii_case("latest") {
            Ok(Version::Latest)
        } else if input.eq_ignore_ascii_case("preview") {
            Ok(Version::Preview)
        } else if let Some(rest) = input.strip_prefix("preview-") {
            if let Some((dt, fmt)) = parse_date(rest) {
                Ok(Version::DateVersionedPreview {
                    date: dt,
                    format: fmt,
                })
            } else {
                Err(MapperError::InvalidModelName(input.to_string()))
            }
        } else if let Some((dt, fmt)) = parse_date(input) {
            Ok(Version::Date {
                date: dt,
                format: fmt,
            })
        } else if let Ok(semver_ver) = semver::Version::parse(input) {
            Ok(Version::Semver(semver_ver))
        } else {
            Err(MapperError::InvalidModelName(input.to_string()))
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, AsRef, Serialize, Deserialize)]
pub struct ModelName<'a>(Cow<'a, str>);

impl<'a> ModelName<'a> {
    #[must_use]
    pub fn borrowed(name: &'a str) -> Self {
        Self(Cow::Borrowed(name))
    }

    #[must_use]
    pub fn owned(name: String) -> Self {
        Self(Cow::Owned(name))
    }

    #[must_use]
    pub fn from_model(model: &'a ModelId) -> Self {
        match model {
            ModelId::OpenAI(model_id)
            | ModelId::Anthropic(model_id)
            | ModelId::GoogleGemini(model_id) => {
                Self(Cow::Borrowed(model_id.model.as_str()))
            }
            ModelId::Bedrock(bedrock_model_id) => {
                Self(Cow::Borrowed(bedrock_model_id.model.as_str()))
            }
            ModelId::Ollama(ollama_model_id) => {
                Self(Cow::Borrowed(ollama_model_id.model.as_str()))
            }
            ModelId::Unknown(model_id) => {
                Self(Cow::Borrowed(model_id.as_str()))
            }
        }
    }
}

impl std::fmt::Display for ModelName<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum ModelId {
    OpenAI(ModelIdWithVersion),
    Anthropic(ModelIdWithVersion),
    GoogleGemini(ModelIdWithVersion),
    Bedrock(BedrockModelId),
    Ollama(OllamaModelId),
    Unknown(String),
}

impl ModelId {
    /// Create a `ModelId` from a string and an inference provider.
    ///
    /// The `request_style` parameter here is used to determine what format
    /// the model name is in.
    pub(crate) fn from_str_and_provider(
        request_style: InferenceProvider,
        s: &str,
    ) -> Result<Self, MapperError> {
        match request_style {
            InferenceProvider::OpenAI => {
                let model_with_version = ModelIdWithVersion::from_str(s)?;
                Ok(ModelId::OpenAI(model_with_version))
            }
            InferenceProvider::Anthropic => {
                let model_with_version = ModelIdWithVersion::from_str(s)?;
                Ok(ModelId::Anthropic(model_with_version))
            }
            InferenceProvider::Bedrock => {
                let bedrock_model = BedrockModelId::from_str(s)?;
                Ok(ModelId::Bedrock(bedrock_model))
            }
            InferenceProvider::Ollama => {
                let ollama_model = OllamaModelId::from_str(s)?;
                Ok(ModelId::Ollama(ollama_model))
            }
            InferenceProvider::VertexAi => {
                let model_with_version = ModelIdWithVersion::from_str(s)?;
                Ok(ModelId::OpenAI(model_with_version))
            }
            InferenceProvider::GoogleGemini => {
                let model_with_version = ModelIdWithVersion::from_str(s)?;
                Ok(ModelId::GoogleGemini(model_with_version))
            }
        }
    }
}

/// Parse a model id in the format `{provider}/{model_name}` to a `ModelId`.
impl FromStr for ModelId {
    type Err = MapperError;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut parts = s.splitn(2, '/');
        let provider_str = parts.next();
        let model_name = parts.next();

        match (provider_str, model_name) {
            (Some(provider_str), Some(model_name)) => {
                if model_name.is_empty() {
                    return Err(MapperError::InvalidModelName(
                        "Model name cannot be empty after provider".to_string(),
                    ));
                }

                let provider = InferenceProvider::from_str(provider_str)
                    .map_err(|_| {
                        MapperError::ProviderNotSupported(
                            provider_str.to_string(),
                        )
                    })?;

                Self::from_str_and_provider(provider, model_name)
            }
            _ => Err(MapperError::InvalidModelName(format!(
                "Model string must be in format \
                 '{{provider}}/{{model_name}}', got '{s}'",
            ))),
        }
    }
}

impl Display for ModelId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ModelId::OpenAI(model)
            | ModelId::Anthropic(model)
            | ModelId::GoogleGemini(model) => {
                write!(f, "{model}")
            }
            ModelId::Bedrock(model) => write!(f, "{model}"),
            ModelId::Ollama(model) => write!(f, "{model}"),
            ModelId::Unknown(model) => write!(f, "{model}"),
        }
    }
}

/// Has the format of: `{model}-{version}`
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ModelIdWithVersion {
    pub model: String,
    pub version: Version,
}

impl FromStr for ModelIdWithVersion {
    type Err = MapperError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        // Validate input string
        if s.is_empty() {
            return Err(MapperError::InvalidModelName(
                "Model name cannot be empty".to_string(),
            ));
        }

        if s.ends_with('-') {
            return Err(MapperError::InvalidModelName(
                "Model name cannot end with dash".to_string(),
            ));
        }

        if s.ends_with('.') {
            return Err(MapperError::InvalidModelName(
                "Model name cannot end with dot".to_string(),
            ));
        }

        if s.ends_with('@') {
            return Err(MapperError::InvalidModelName(
                "Model name cannot end with @ symbol".to_string(),
            ));
        }

        let (model, version) = parse_model_and_version(s, '-');
        Ok(ModelIdWithVersion {
            model: model.to_string(),
            version: version.unwrap_or(Version::Latest),
        })
    }
}

impl Display for ModelIdWithVersion {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self.version {
            Version::Latest => write!(f, "{}", self.model),
            _ => write!(f, "{}-{}", self.model, self.version),
        }
    }
}

/// Has the format of: `{model}:{tag}`
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct OllamaModelId {
    pub model: String,
    pub tag: Option<String>,
}

impl FromStr for OllamaModelId {
    type Err = MapperError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut parts = s.splitn(2, ':');
        let model = parts
            .next()
            .ok_or_else(|| MapperError::InvalidModelName(s.to_string()))?;
        let tag = parts.next();
        Ok(OllamaModelId {
            model: model.to_string(),
            tag: match tag {
                Some(t) if !t.is_empty() => Some(t.to_string()),
                _ => None,
            },
        })
    }
}

impl Display for OllamaModelId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self.tag {
            Some(tag) => write!(f, "{}:{}", self.model, tag),
            None => write!(f, "{}", self.model),
        }
    }
}

/// Has the format of:
/// `{provider}.{model}(-version)?-{bedrock_internal_version}`
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct BedrockModelId {
    pub provider: InferenceProvider,
    pub model: String,
    pub version: Option<Version>,
    pub bedrock_internal_version: String,
}

impl FromStr for BedrockModelId {
    type Err = MapperError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut split = s.splitn(2, '.');
        let provider_str = split
            .next()
            .ok_or_else(|| MapperError::InvalidModelName(s.to_string()))?;
        let rest = split
            .next()
            .ok_or_else(|| MapperError::InvalidModelName(s.to_string()))?;

        let provider =
            InferenceProvider::from_str(provider_str).map_err(|_| {
                MapperError::ProviderNotSupported(provider_str.to_string())
            })?;

        // Parse the bedrock internal version
        // eg: claude-3-sonnet-20240229-v1:0 (split on `-v`)
        let (model_part, bedrock_version) =
            if let Some(v_pos) = rest.rfind("-v") {
                (&rest[..v_pos], &rest[v_pos + 1..]) // +1 to skip the '-', keeping 'v1:0'
            } else {
                return Err(MapperError::InvalidModelName(s.to_string()));
            };

        // Parse the model and version from the model_part
        let (model, version) = parse_model_and_version(model_part, '-');

        Ok(BedrockModelId {
            provider,
            model: model.to_string(),
            version,
            bedrock_internal_version: bedrock_version.to_string(),
        })
    }
}

impl Display for BedrockModelId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self.version {
            Some(version) => write!(
                f,
                "{}.{}-{}-{}",
                self.provider,
                self.model,
                version,
                self.bedrock_internal_version
            ),
            None => write!(
                f,
                "{}.{}-{}",
                self.provider, self.model, self.bedrock_internal_version
            ),
        }
    }
}

fn parse_date(input: &str) -> Option<(DateTime<Utc>, &'static str)> {
    // try YYYY-MM-DD first
    if let Ok(date) = NaiveDate::parse_from_str(input, "%Y-%m-%d") {
        if let Some(naive_dt) = date.and_hms_opt(0, 0, 0) {
            return Some((Utc.from_utc_datetime(&naive_dt), "%Y-%m-%d"));
        }
    }
    // then YYYYMMDD
    if let Ok(date) = NaiveDate::parse_from_str(input, "%Y%m%d") {
        if let Some(naive_dt) = date.and_hms_opt(0, 0, 0) {
            return Some((Utc.from_utc_datetime(&naive_dt), "%Y%m%d"));
        }
    }
    // then MM-DD (assume current year)
    if let Ok(date) = NaiveDate::parse_from_str(
        &format!("{}-{}", chrono::Utc::now().year(), input),
        "%Y-%m-%d",
    ) {
        if let Some(naive_dt) = date.and_hms_opt(0, 0, 0) {
            return Some((Utc.from_utc_datetime(&naive_dt), "%m-%d"));
        }
    }
    None
}

fn parse_model_and_version(
    s: &str,
    separator: char,
) -> (&str, Option<Version>) {
    // Handle special case for preview versions with dates first
    if let Some(preview_pos) = s.rfind("-preview-") {
        let after_preview = &s[preview_pos + 9..]; // 9 = length of "-preview-"
        if let Some((dt, fmt)) = parse_date(after_preview) {
            let model = &s[..preview_pos];
            return (
                model,
                Some(Version::DateVersionedPreview {
                    date: dt,
                    format: fmt,
                }),
            );
        }
    }

    // Handle "preview" version (not date-versioned)
    if let Some(model) = s.strip_suffix("-preview") {
        return (model, Some(Version::Preview));
    }

    // Handle "latest" version
    if let Some(model) = s.strip_suffix("-latest") {
        return (model, Some(Version::Latest));
    }

    // Collect all possible version candidates first, then choose the best one
    let mut candidates = Vec::new();
    for (idx, ch) in s.char_indices().rev() {
        if ch == separator {
            // Check for trailing separator
            if idx == s.len() - 1 {
                continue;
            }
            let candidate = &s[idx + 1..];
            candidates.push((idx, candidate));
        }
    }

    // Reverse to check longer candidates first (leftmost separators first)
    candidates.reverse();

    // Try to find the best version candidate, prioritizing longer dates
    for (idx, candidate) in &candidates {
        // Try parsing as date first (prioritize full dates like YYYY-MM-DD over
        // MM-DD)
        if let Some((dt, fmt)) = parse_date(candidate) {
            // Prefer YYYY-MM-DD and YYYYMMDD formats over MM-DD
            if fmt == "%Y-%m-%d" || fmt == "%Y%m%d" {
                let model = &s[..*idx];
                return (
                    model,
                    Some(Version::Date {
                        date: dt,
                        format: fmt,
                    }),
                );
            }
        }
    }

    // If no full date found, try other version types
    for (idx, candidate) in &candidates {
        // Try parsing as date (including MM-DD)
        if let Some((dt, fmt)) = parse_date(candidate) {
            let model = &s[..*idx];
            return (
                model,
                Some(Version::Date {
                    date: dt,
                    format: fmt,
                }),
            );
        }

        // Try parsing as semver
        if let Ok(semver_ver) = semver::Version::parse(candidate) {
            let model = &s[..*idx];
            return (model, Some(Version::Semver(semver_ver)));
        }

        // Try parsing as special version keywords
        if candidate.eq_ignore_ascii_case("latest") {
            let model = &s[..*idx];
            return (model, Some(Version::Latest));
        } else if candidate.eq_ignore_ascii_case("preview") {
            let model = &s[..*idx];
            return (model, Some(Version::Preview));
        }
    }

    // No valid version found
    (s, None)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_openai_o1_snapshot_model() {
        let model_id_str = "o1-2024-12-17";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::OpenAI,
            model_id_str,
        )
        .unwrap();
        let ModelId::OpenAI(model_with_version) = &result else {
            panic!("Expected OpenAI ModelId with version");
        };
        assert_eq!(model_with_version.model, "o1");
        let Version::Date { date, .. } = &model_with_version.version else {
            panic!("Expected date version");
        };
        let expected_dt: DateTime<Utc> =
            "2024-12-17T00:00:00Z".parse().unwrap();
        assert_eq!(*date, expected_dt);

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_openai_o1_preview_snapshot_model() {
        let model_id_str = "o1-preview-2024-09-12";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::OpenAI,
            model_id_str,
        )
        .unwrap();
        let ModelId::OpenAI(model_with_version) = &result else {
            panic!("Expected OpenAI ModelId with preview version");
        };
        assert_eq!(model_with_version.model, "o1");
        let Version::DateVersionedPreview { date, .. } =
            &model_with_version.version
        else {
            panic!("Expected date versioned preview");
        };
        let expected_dt: DateTime<Utc> =
            "2024-09-12T00:00:00Z".parse().unwrap();
        assert_eq!(*date, expected_dt);

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_openai_gpt4_snapshot_model() {
        let model_id_str = "gpt-4-2024-08-15";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::OpenAI,
            model_id_str,
        )
        .unwrap();
        let ModelId::OpenAI(model_with_version) = &result else {
            panic!("Expected OpenAI ModelId with version");
        };
        assert_eq!(model_with_version.model, "gpt-4");
        let Version::Date { date, .. } = &model_with_version.version else {
            panic!("Expected date version");
        };
        let expected_dt: DateTime<Utc> =
            "2024-08-15T00:00:00Z".parse().unwrap();
        assert_eq!(*date, expected_dt);

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_openai_gpt35_turbo_snapshot_model() {
        let model_id_str = "gpt-3.5-turbo-2024-01-25";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::OpenAI,
            model_id_str,
        )
        .unwrap();
        let ModelId::OpenAI(model_with_version) = &result else {
            panic!("Expected OpenAI ModelId with version");
        };
        assert_eq!(model_with_version.model, "gpt-3.5-turbo");
        let Version::Date { date, .. } = &model_with_version.version else {
            panic!("Expected date version");
        };
        let expected_dt: DateTime<Utc> =
            "2024-01-25T00:00:00Z".parse().unwrap();
        assert_eq!(*date, expected_dt);

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_openai_o1_alias_model() {
        let model_id_str = "o1";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::OpenAI,
            model_id_str,
        )
        .unwrap();
        let ModelId::OpenAI(model_with_version) = &result else {
            panic!("Expected OpenAI ModelId with latest version");
        };
        assert_eq!(model_with_version.model, "o1");
        assert!(matches!(model_with_version.version, Version::Latest));

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_openai_o1_preview_alias_model() {
        let model_id_str = "o1-preview";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::OpenAI,
            model_id_str,
        )
        .unwrap();
        let ModelId::OpenAI(model_with_version) = &result else {
            panic!("Expected OpenAI ModelId with preview version");
        };
        assert_eq!(model_with_version.model, "o1");
        assert!(matches!(model_with_version.version, Version::Preview));

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_openai_gpt4_alias_model() {
        let model_id_str = "gpt-4";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::OpenAI,
            model_id_str,
        )
        .unwrap();
        let ModelId::OpenAI(model_with_version) = &result else {
            panic!("Expected OpenAI ModelId with latest version");
        };
        assert_eq!(model_with_version.model, "gpt-4");
        assert!(matches!(model_with_version.version, Version::Latest));

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_openai_gpt35_turbo_alias_model() {
        let model_id_str = "gpt-3.5-turbo";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::OpenAI,
            model_id_str,
        )
        .unwrap();
        let ModelId::OpenAI(model_with_version) = &result else {
            panic!("Expected OpenAI ModelId with latest version");
        };
        assert_eq!(model_with_version.model, "gpt-3.5-turbo");
        assert!(matches!(model_with_version.version, Version::Latest));

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_anthropic_claude_opus_4_dated_model() {
        let model_id_str = "claude-opus-4-20250514";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Anthropic,
            model_id_str,
        )
        .unwrap();
        let ModelId::Anthropic(model_with_version) = &result else {
            panic!("Expected Anthropic ModelId with date version");
        };
        assert_eq!(model_with_version.model, "claude-opus-4");
        let Version::Date { date, .. } = model_with_version.version else {
            panic!("Expected date version");
        };
        let expected_dt: DateTime<Utc> =
            "2025-05-14T00:00:00Z".parse().unwrap();
        assert_eq!(date, expected_dt);

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_anthropic_claude_sonnet_4_dated_model() {
        let model_id_str = "claude-sonnet-4-20250514";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Anthropic,
            model_id_str,
        )
        .unwrap();
        let ModelId::Anthropic(model_with_version) = &result else {
            panic!("Expected Anthropic ModelId with date version");
        };
        assert_eq!(model_with_version.model, "claude-sonnet-4");
        let Version::Date { date, .. } = &model_with_version.version else {
            panic!("Expected date version");
        };
        let expected_dt: DateTime<Utc> =
            "2025-05-14T00:00:00Z".parse().unwrap();
        assert_eq!(*date, expected_dt);

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_anthropic_claude_3_7_sonnet_dated_model() {
        let model_id_str = "claude-3-7-sonnet-20250219";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Anthropic,
            model_id_str,
        )
        .unwrap();
        let ModelId::Anthropic(model_with_version) = &result else {
            panic!("Expected Anthropic ModelId with date version");
        };
        assert_eq!(model_with_version.model, "claude-3-7-sonnet");
        let Version::Date { date, .. } = &model_with_version.version else {
            panic!("Expected date version");
        };
        let expected_dt: DateTime<Utc> =
            "2025-02-19T00:00:00Z".parse().unwrap();
        assert_eq!(*date, expected_dt);

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_anthropic_claude_3_haiku_dated_model() {
        let model_id_str = "claude-3-haiku-20240307";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Anthropic,
            model_id_str,
        )
        .unwrap();
        let ModelId::Anthropic(model_with_version) = &result else {
            panic!("Expected Anthropic ModelId with date version");
        };
        assert_eq!(model_with_version.model, "claude-3-haiku");
        let Version::Date { date, .. } = &model_with_version.version else {
            panic!("Expected date version");
        };
        let expected_dt: DateTime<Utc> =
            "2024-03-07T00:00:00Z".parse().unwrap();
        assert_eq!(*date, expected_dt);

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_anthropic_claude_3_7_sonnet_latest_alias() {
        let model_id_str = "claude-3-7-sonnet-latest";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Anthropic,
            model_id_str,
        )
        .unwrap();
        let ModelId::Anthropic(model_with_version) = &result else {
            panic!("Expected Anthropic ModelId with latest version");
        };
        assert_eq!(model_with_version.model, "claude-3-7-sonnet");
        assert!(matches!(model_with_version.version, Version::Latest));

        assert_eq!(result.to_string(), "claude-3-7-sonnet");
    }

    #[test]
    fn test_anthropic_claude_opus_4_semver_alias() {
        let model_id_str = "claude-opus-4";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Anthropic,
            model_id_str,
        )
        .unwrap();
        let ModelId::Anthropic(model_with_version) = &result else {
            panic!("Expected Anthropic ModelId with latest version");
        };
        assert_eq!(model_with_version.model, "claude-opus-4");
        assert!(matches!(model_with_version.version, Version::Latest));

        assert_eq!(result.to_string(), model_id_str);
    }

    #[test]
    fn test_anthropic_claude_sonnet_4_latest_alias() {
        let model_id_str = "claude-sonnet-4-latest";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Anthropic,
            model_id_str,
        )
        .unwrap();
        let ModelId::Anthropic(model_with_version) = &result else {
            panic!("Expected Anthropic ModelId with latest version");
        };
        assert_eq!(model_with_version.model, "claude-sonnet-4");
        assert!(matches!(model_with_version.version, Version::Latest));

        assert_eq!(result.to_string(), "claude-sonnet-4");
    }

    #[test]
    fn test_bedrock_amazon_titan_invalid_provider() {
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            "amazon.titan-embed-text-v1:0",
        );
        assert!(result.is_err());
        if let Err(MapperError::ProviderNotSupported(provider)) = result {
            assert_eq!(provider, "amazon");
        } else {
            panic!("Expected ProviderNotSupported error for amazon provider");
        }
    }

    #[test]
    fn test_bedrock_ai21_jamba_invalid_provider() {
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            "ai21.jamba-1-5-large-v1:0",
        );
        assert!(result.is_err());
        if let Err(MapperError::ProviderNotSupported(provider)) = result {
            assert_eq!(provider, "ai21");
        } else {
            panic!("Expected ProviderNotSupported error for ai21 provider");
        }
    }

    #[test]
    fn test_bedrock_meta_llama_invalid_provider() {
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            "meta.llama3-8b-instruct-v1:0",
        );
        assert!(result.is_err());
        if let Err(MapperError::ProviderNotSupported(provider)) = result {
            assert_eq!(provider, "meta");
        } else {
            panic!("Expected ProviderNotSupported error for meta provider");
        }
    }

    #[test]
    fn test_bedrock_openai_invalid_format() {
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            "openai.gpt-4:1",
        );
        assert!(result.is_err());
        // This should fail because the format doesn't have `-v` pattern
        // required for Bedrock
        if let Err(MapperError::InvalidModelName(model_name)) = result {
            assert_eq!(model_name, "openai.gpt-4:1");
        } else {
            panic!(
                "Expected InvalidModelName error for OpenAI format on \
                 Bedrock, got: {:?}",
                result
            );
        }
    }

    #[test]
    fn test_bedrock_anthropic_claude_opus_4_model() {
        let model_id_str = "anthropic.claude-opus-4-20250514-v1:0";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Bedrock(bedrock_model)) = &result {
            assert_eq!(bedrock_model.provider, InferenceProvider::Anthropic);
            assert_eq!(bedrock_model.model, "claude-opus-4");
            let Version::Date { date, .. } =
                bedrock_model.version.as_ref().unwrap()
            else {
                panic!("Expected date version");
            };
            let expected_dt: chrono::DateTime<chrono::Utc> =
                "2025-05-14T00:00:00Z".parse().unwrap();
            assert_eq!(*date, expected_dt);
            assert_eq!(bedrock_model.bedrock_internal_version, "v1:0");

            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Bedrock ModelId with Anthropic provider");
        }
    }

    #[test]
    fn test_bedrock_anthropic_claude_3_7_sonnet_model() {
        let model_id_str = "anthropic.claude-3-7-sonnet-20250219-v1:0";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Bedrock(bedrock_model)) = &result {
            assert_eq!(bedrock_model.provider, InferenceProvider::Anthropic);
            assert_eq!(bedrock_model.model, "claude-3-7-sonnet");
            let Version::Date { date, .. } =
                bedrock_model.version.as_ref().unwrap()
            else {
                panic!("Expected date version");
            };
            let expected_dt: chrono::DateTime<chrono::Utc> =
                "2025-02-19T00:00:00Z".parse().unwrap();
            assert_eq!(*date, expected_dt);
            assert_eq!(bedrock_model.bedrock_internal_version, "v1:0");
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Bedrock ModelId with Anthropic provider");
        }
    }

    #[test]
    fn test_bedrock_anthropic_claude_3_haiku_model() {
        let model_id_str = "anthropic.claude-3-haiku-20240307-v1:0";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Bedrock(bedrock_model)) = &result {
            assert_eq!(bedrock_model.provider, InferenceProvider::Anthropic);
            assert_eq!(bedrock_model.model, "claude-3-haiku");
            let Version::Date { date, .. } =
                bedrock_model.version.as_ref().unwrap()
            else {
                panic!("Expected date version");
            };
            let expected_dt: chrono::DateTime<chrono::Utc> =
                "2024-03-07T00:00:00Z".parse().unwrap();
            assert_eq!(*date, expected_dt);
            assert_eq!(bedrock_model.bedrock_internal_version, "v1:0");
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Bedrock ModelId with Anthropic provider");
        }
    }

    #[test]
    fn test_bedrock_anthropic_claude_3_sonnet_valid_provider() {
        let model_id_str = "anthropic.claude-3-sonnet-20240229-v1:0";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Bedrock(bedrock_model)) = &result {
            assert_eq!(bedrock_model.provider, InferenceProvider::Anthropic);
            assert_eq!(bedrock_model.model, "claude-3-sonnet");
            let Version::Date { date, .. } =
                bedrock_model.version.as_ref().unwrap()
            else {
                panic!("Expected date version");
            };
            let expected_dt: chrono::DateTime<chrono::Utc> =
                "2024-02-29T00:00:00Z".parse().unwrap();
            assert_eq!(*date, expected_dt);
            assert_eq!(bedrock_model.bedrock_internal_version, "v1:0");
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Bedrock ModelId with Anthropic provider");
        }
    }

    #[test]
    fn test_bedrock_anthropic_claude_3_5_sonnet_model() {
        let model_id_str = "anthropic.claude-3-5-sonnet-20241022-v2:0";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Bedrock(bedrock_model)) = &result {
            assert_eq!(bedrock_model.provider, InferenceProvider::Anthropic);
            assert_eq!(bedrock_model.model, "claude-3-5-sonnet");
            let Version::Date { date, .. } =
                bedrock_model.version.as_ref().unwrap()
            else {
                panic!("Expected date version");
            };
            let expected_dt: chrono::DateTime<chrono::Utc> =
                "2024-10-22T00:00:00Z".parse().unwrap();
            assert_eq!(*date, expected_dt);
            assert_eq!(bedrock_model.bedrock_internal_version, "v2:0");
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Bedrock ModelId with Anthropic provider");
        }
    }

    #[test]
    fn test_bedrock_anthropic_claude_sonnet_4_model_proper_format() {
        let model_id_str = "anthropic.claude-sonnet-4-20250514-v1:0";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Bedrock(bedrock_model)) = &result {
            assert_eq!(bedrock_model.provider, InferenceProvider::Anthropic);
            assert_eq!(bedrock_model.model, "claude-sonnet-4");
            let Version::Date { date, .. } =
                bedrock_model.version.as_ref().unwrap()
            else {
                panic!("Expected date version");
            };
            let expected_dt: chrono::DateTime<chrono::Utc> =
                "2025-05-14T00:00:00Z".parse().unwrap();
            assert_eq!(*date, expected_dt);
            assert_eq!(bedrock_model.bedrock_internal_version, "v1:0");
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Bedrock ModelId with Anthropic provider");
        }
    }

    #[test]
    fn test_ollama_gemma3_basic_model() {
        let model_id_str = "gemma3";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "gemma3");
            assert_eq!(ollama_model.tag, None);

            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId");
        }
    }

    #[test]
    fn test_ollama_llama32_basic_model() {
        let model_id_str = "llama3.2";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "llama3.2");
            assert_eq!(ollama_model.tag, None);
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId");
        }
    }

    #[test]
    fn test_ollama_phi4_mini_basic_model() {
        let model_id_str = "phi4-mini";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "phi4-mini");
            assert_eq!(ollama_model.tag, None);
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId");
        }
    }

    #[test]
    fn test_ollama_llama32_vision_basic_model() {
        let model_id_str = "llama3.2-vision";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "llama3.2-vision");
            assert_eq!(ollama_model.tag, None);
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId");
        }
    }

    #[test]
    fn test_ollama_deepseek_r1_basic_model() {
        let model_id_str = "deepseek-r1";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "deepseek-r1");
            assert_eq!(ollama_model.tag, None);
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId");
        }
    }

    #[test]
    fn test_ollama_gemma3_1b_tagged_model() {
        let model_id_str = "gemma3:1b";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "gemma3");
            assert_eq!(ollama_model.tag, Some("1b".to_string()));

            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId with tag");
        }
    }

    #[test]
    fn test_ollama_gemma3_12b_tagged_model() {
        let model_id_str = "gemma3:12b";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "gemma3");
            assert_eq!(ollama_model.tag, Some("12b".to_string()));
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId with tag");
        }
    }

    #[test]
    fn test_ollama_deepseek_r1_671b_tagged_model() {
        let model_id_str = "deepseek-r1:671b";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "deepseek-r1");
            assert_eq!(ollama_model.tag, Some("671b".to_string()));
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId with tag");
        }
    }

    #[test]
    fn test_ollama_llama4_scout_tagged_model() {
        let model_id_str = "llama4:scout";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "llama4");
            assert_eq!(ollama_model.tag, Some("scout".to_string()));
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId with tag");
        }
    }

    #[test]
    fn test_ollama_llama4_maverick_tagged_model() {
        let model_id_str = "llama4:maverick";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "llama4");
            assert_eq!(ollama_model.tag, Some("maverick".to_string()));
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId with tag");
        }
    }

    #[test]
    fn test_ollama_llama_2_uncensored_freeform() {
        let model_id_str = "Llama 2 Uncensored";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Ollama,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::Ollama(ollama_model)) = &result {
            assert_eq!(ollama_model.model, "Llama 2 Uncensored");
            assert_eq!(ollama_model.tag, None);
            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected Ollama ModelId");
        }
    }

    #[test]
    fn test_invalid_bedrock_unknown_provider_model() {
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            "some-unknown-provider.model",
        );
        assert!(result.is_err());
        if let Err(MapperError::ProviderNotSupported(provider)) = result {
            assert_eq!(provider, "some-unknown-provider");
        } else {
            panic!("Expected ProviderNotSupported error for unknown provider");
        }
    }

    #[test]
    fn test_invalid_bedrock_no_dot_separator() {
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            "custom-local-model",
        );
        assert!(result.is_err());
        if let Err(MapperError::InvalidModelName(model_name)) = result {
            assert_eq!(model_name, "custom-local-model");
        } else {
            panic!(
                "Expected InvalidModelName error for model without dot \
                 separator"
            );
        }
    }

    #[test]
    fn test_invalid_bedrock_malformed_format() {
        let result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            "experimental@format#unknown",
        );
        assert!(result.is_err());
        if let Err(MapperError::InvalidModelName(model_name)) = result {
            assert_eq!(model_name, "experimental@format#unknown");
        } else {
            panic!("Expected InvalidModelName error for malformed format");
        }
    }

    #[test]
    fn test_edge_case_empty_string() {
        let result =
            ModelId::from_str_and_provider(InferenceProvider::OpenAI, "");
        assert!(result.is_err());
        if let Err(MapperError::InvalidModelName(msg)) = result {
            assert_eq!(msg, "Model name cannot be empty");
        } else {
            panic!("Expected InvalidModelName error for empty string");
        }
    }

    #[test]
    fn test_edge_case_single_char() {
        let model_id_str = "a";
        let result = ModelId::from_str_and_provider(
            InferenceProvider::OpenAI,
            model_id_str,
        );
        assert!(result.is_ok());
        if let Ok(ModelId::OpenAI(model_with_version)) = &result {
            assert_eq!(model_with_version.model, "a");
            assert!(matches!(model_with_version.version, Version::Latest));

            assert_eq!(result.as_ref().unwrap().to_string(), model_id_str);
        } else {
            panic!("Expected OpenAI ModelId for single character");
        }
    }

    #[test]
    fn test_edge_case_trailing_dash() {
        let result =
            ModelId::from_str_and_provider(InferenceProvider::OpenAI, "model-");
        assert!(result.is_err());
        if let Err(MapperError::InvalidModelName(msg)) = result {
            assert_eq!(msg, "Model name cannot end with dash");
        } else {
            panic!("Expected InvalidModelName error for trailing dash");
        }
    }

    #[test]
    fn test_edge_case_at_symbol() {
        let result =
            ModelId::from_str_and_provider(InferenceProvider::OpenAI, "model@");
        assert!(result.is_err());
        if let Err(MapperError::InvalidModelName(msg)) = result {
            assert_eq!(msg, "Model name cannot end with @ symbol");
        } else {
            panic!("Expected InvalidModelName error for @ symbol");
        }
    }

    #[test]
    fn test_edge_case_trailing_dot() {
        let result = ModelId::from_str_and_provider(
            InferenceProvider::OpenAI,
            "provider.",
        );
        assert!(result.is_err());
        if let Err(MapperError::InvalidModelName(msg)) = result {
            assert_eq!(msg, "Model name cannot end with dot");
        } else {
            panic!("Expected InvalidModelName error for trailing dot");
        }
    }

    #[test]
    fn test_edge_case_at_only() {
        let result =
            ModelId::from_str_and_provider(InferenceProvider::OpenAI, "@");
        assert!(result.is_err());
        if let Err(MapperError::InvalidModelName(msg)) = result {
            assert_eq!(msg, "Model name cannot end with @ symbol");
        } else {
            panic!("Expected InvalidModelName error for @ only");
        }
    }

    #[test]
    fn test_edge_case_dash_only() {
        let result =
            ModelId::from_str_and_provider(InferenceProvider::OpenAI, "-");
        assert!(result.is_err());
        if let Err(MapperError::InvalidModelName(msg)) = result {
            assert_eq!(msg, "Model name cannot end with dash");
        } else {
            panic!("Expected InvalidModelName error for dash only");
        }
    }

    #[test]
    fn test_provider_specific_model_variants() {
        let openai_result =
            ModelId::from_str_and_provider(InferenceProvider::OpenAI, "gpt-4");
        assert!(matches!(openai_result, Ok(ModelId::OpenAI(_))));

        let anthropic_result = ModelId::from_str_and_provider(
            InferenceProvider::Anthropic,
            "claude-3-sonnet",
        );
        assert!(matches!(anthropic_result, Ok(ModelId::Anthropic(_))));

        let bedrock_result = ModelId::from_str_and_provider(
            InferenceProvider::Bedrock,
            "anthropic.claude-3-sonnet-20240229-v1:0",
        );
        assert!(matches!(bedrock_result, Ok(ModelId::Bedrock(_))));

        let ollama_result =
            ModelId::from_str_and_provider(InferenceProvider::Ollama, "llama3");
        assert!(matches!(ollama_result, Ok(ModelId::Ollama(_))));
    }

    #[test]
    fn test_from_str_openai_model() {
        let model_str = "openai/gpt-4";
        let result = ModelId::from_str(model_str).unwrap();

        if let ModelId::OpenAI(model_with_version) = result {
            assert_eq!(model_with_version.model, "gpt-4");
            assert!(matches!(model_with_version.version, Version::Latest));
        } else {
            panic!("Expected OpenAI ModelId");
        }
    }

    #[test]
    fn test_from_str_anthropic_model() {
        let model_str = "anthropic/claude-3-sonnet-20240229";
        let result = ModelId::from_str(model_str).unwrap();

        if let ModelId::Anthropic(model_with_version) = result {
            assert_eq!(model_with_version.model, "claude-3-sonnet");
            if let Version::Date { date, .. } = model_with_version.version {
                let expected_dt: DateTime<Utc> =
                    "2024-02-29T00:00:00Z".parse().unwrap();
                assert_eq!(date, expected_dt);
            } else {
                panic!("Expected date version");
            }
        } else {
            panic!("Expected Anthropic ModelId");
        }
    }

    #[test]
    fn test_from_str_bedrock_model() {
        let model_str = "bedrock/anthropic.claude-3-sonnet-20240229-v1:0";
        let result = ModelId::from_str(model_str).unwrap();

        if let ModelId::Bedrock(bedrock_model) = result {
            assert_eq!(bedrock_model.provider, InferenceProvider::Anthropic);
            assert_eq!(bedrock_model.model, "claude-3-sonnet");
            assert_eq!(bedrock_model.bedrock_internal_version, "v1:0");
        } else {
            panic!("Expected Bedrock ModelId");
        }
    }

    #[test]
    fn test_from_str_ollama_model() {
        let model_str = "ollama/llama3:8b";
        let result = ModelId::from_str(model_str).unwrap();

        if let ModelId::Ollama(ollama_model) = result {
            assert_eq!(ollama_model.model, "llama3");
            assert_eq!(ollama_model.tag, Some("8b".to_string()));
        } else {
            panic!("Expected Ollama ModelId");
        }
    }

    #[test]
    fn test_from_str_google_gemini_model() {
        let model_str = "gemini/gemini-pro";
        let result = ModelId::from_str(model_str).unwrap();

        if let ModelId::GoogleGemini(model_with_version) = result {
            assert_eq!(model_with_version.model, "gemini-pro");
            assert!(matches!(model_with_version.version, Version::Latest));
        } else {
            panic!("Expected GoogleGemini ModelId");
        }
    }

    #[test]
    fn test_from_str_vertex_ai_model() {
        let model_str = "vertex-ai/gemini-pro";
        let result = ModelId::from_str(model_str).unwrap();

        // VertexAi maps to OpenAI variant based on from_str_and_provider
        if let ModelId::OpenAI(model_with_version) = result {
            assert_eq!(model_with_version.model, "gemini-pro");
            assert!(matches!(model_with_version.version, Version::Latest));
        } else {
            panic!("Expected OpenAI ModelId for VertexAi");
        }
    }

    #[test]
    fn test_from_str_invalid_no_slash() {
        let result = ModelId::from_str("gpt-4");
        assert!(result.is_err());
        if let Err(MapperError::InvalidModelName(msg)) = result {
            assert_eq!(
                msg,
                "Model string must be in format '{provider}/{model_name}', \
                 got 'gpt-4'"
            );
        } else {
            panic!("Expected InvalidModelName error");
        }
    }

    #[test]
    fn test_from_str_invalid_empty_model() {
        let result = ModelId::from_str("openai/");
        assert!(result.is_err());
        if let Err(MapperError::InvalidModelName(msg)) = result {
            assert_eq!(msg, "Model name cannot be empty after provider");
        } else {
            panic!("Expected InvalidModelName error");
        }
    }

    #[test]
    fn test_from_str_invalid_provider() {
        let result = ModelId::from_str("invalid-provider/gpt-4");
        assert!(result.is_err());
        if let Err(MapperError::ProviderNotSupported(provider)) = result {
            assert_eq!(provider, "invalid-provider");
        } else {
            panic!("Expected ProviderNotSupported error");
        }
    }
}
