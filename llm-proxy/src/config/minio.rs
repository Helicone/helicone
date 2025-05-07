use std::time::Duration;

use reqwest::Client;
use rusty_s3::{Bucket, Credentials, actions::PutObject};
use serde::{Deserialize, Serialize};
use url::Url;

use crate::{error::init::InitError, types::secret::Secret};

const DEFAULT_MINIO_TIMEOUT: Duration = Duration::from_secs(10);

/// The request url format of a S3 bucket.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum UrlStyle {
    /// Requests will use "path-style" url: i.e:
    /// `https://s3.<region>.amazonaws.com/<bucket>/<key>`.
    ///
    /// This style should be considered deprecated and is **NOT RECOMMENDED**.
    /// Check [Amazon S3 Path Deprecation Plan](https://aws.amazon.com/blogs/aws/amazon-s3-path-deprecation-plan-the-rest-of-the-story/)
    /// for more informations.
    Path,
    /// Requests will use "virtual-hosted-style" urls, i.e:
    /// `https://<bucket>.s3.<region>.amazonaws.com/<key>`.
    VirtualHost,
}

impl From<UrlStyle> for rusty_s3::UrlStyle {
    fn from(value: UrlStyle) -> Self {
        match value {
            UrlStyle::Path => rusty_s3::UrlStyle::Path,
            UrlStyle::VirtualHost => rusty_s3::UrlStyle::VirtualHost,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "kebab-case")]
pub struct Config {
    #[serde(default = "default_url_style")]
    pub url_style: UrlStyle,
    #[serde(default = "default_bucket_name")]
    pub bucket_name: String,
    #[serde(default = "default_host")]
    pub host: Url,
    #[serde(default = "default_region")]
    pub region: String,
    /// set via env vars: `PROXY__MINIO__ACCESS_KEY`
    #[serde(default = "default_access_key")]
    pub access_key: Secret<String>,
    /// set via env vars: `PROXY__MINIO__SECRET_KEY`
    #[serde(default = "default_secret_key")]
    pub secret_key: Secret<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            url_style: default_url_style(),
            bucket_name: default_bucket_name(),
            host: default_host(),
            region: default_region(),
            access_key: default_access_key(),
            secret_key: default_secret_key(),
        }
    }
}

#[derive(Debug)]
pub struct Minio {
    pub bucket: Bucket,
    pub client: Client,
    pub credentials: Credentials,
}

impl Minio {
    pub fn new(config: Config) -> Result<Self, InitError> {
        let bucket = Bucket::new(
            config.host,
            config.url_style.into(),
            config.bucket_name,
            config.region,
        )?;
        let client = Client::builder()
            .connect_timeout(DEFAULT_MINIO_TIMEOUT)
            .tcp_nodelay(true)
            .build()
            .map_err(InitError::CreateReqwestClient)?;
        let credentials =
            Credentials::new(config.access_key.0, config.secret_key.0);
        Ok(Self {
            bucket,
            client,
            credentials,
        })
    }

    #[must_use]
    pub fn put_object<'obj, 'client>(
        &'client self,
        object: &'obj str,
    ) -> PutObject<'obj>
    where
        'client: 'obj,
    {
        PutObject::new(&self.bucket, Some(&self.credentials), object)
    }
}

fn default_url_style() -> UrlStyle {
    UrlStyle::Path
}

fn default_bucket_name() -> String {
    "request-response-storage".to_string()
}

fn default_host() -> Url {
    Url::parse("http://localhost:9000").unwrap()
}

fn default_region() -> String {
    "us-west-1".to_string()
}

fn default_access_key() -> Secret<String> {
    Secret("minioadmin".to_string())
}

fn default_secret_key() -> Secret<String> {
    Secret("minioadmin".to_string())
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for Config {
    fn test_default() -> Self {
        Self::default()
    }
}
