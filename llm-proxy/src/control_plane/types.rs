use std::fmt::Write;

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use ts_rs::TS;
use uuid::Uuid;

/// Computes the hash of an API key for storage and lookup in the control plane.
/// This function adds a "Bearer " prefix to the key before hashing to match
/// the format expected by the authentication middleware.
#[must_use]
pub fn hash_key(key: &str) -> String {
    let key = format!("Bearer {key}");
    let mut hasher = Sha256::new();
    hasher.update(key.as_bytes());
    let result = hasher.finalize();

    result.iter().fold(
        String::with_capacity(result.len() * 2),
        |mut acc, &b| {
            let _ = write!(acc, "{b:02x}");
            acc
        },
    )
}

#[derive(TS, Serialize, Deserialize, Debug, Clone)]
#[ts(export)]
#[serde(tag = "_type")]
pub enum MessageTypeTX {
    Heartbeat,
    RequestConfig {},
    SendLog {
        log: String, // TODO: replace with log
    },
}

#[derive(TS, Serialize, Deserialize, Debug, Clone)]
#[ts(export)]
#[ts(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
#[derive(Default)]
pub struct AuthData {
    pub user_id: String,
    pub organization_id: String,
}

#[derive(TS, Serialize, Deserialize, Debug, Clone)]
#[ts(export)]
#[ts(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
#[derive(Default)]
pub struct Key {
    pub key_hash: String,
    pub owner_id: String,
}

#[derive(TS, Serialize, Deserialize, Debug, Clone)]
#[ts(export)]
#[ts(rename_all = "camelCase")]
#[serde(rename_all = "camelCase")]
#[derive(Default)]
pub struct Config {
    pub auth: AuthData,
    pub keys: Vec<Key>,
    pub router_id: String,
    pub router_config: String, // TODO: replace with router config
}

impl Config {
    #[must_use]
    pub fn get_key_from_hash(&self, key_hash: &str) -> Option<&Key> {
        self.keys.iter().find(|k| k.key_hash == key_hash)
    }
}

#[cfg(feature = "testing")]
impl crate::tests::TestDefault for Config {
    fn test_default() -> Self {
        let test_key = "sk-helicone-test-key";
        let auth_header = format!("Bearer {test_key}");
        let key_hash = hash_key(&auth_header);
        let user_id = Uuid::new_v4();
        let organization_id = Uuid::new_v4();
        Self {
            auth: AuthData {
                user_id: user_id.to_string(),
                organization_id: organization_id.to_string(),
            },
            keys: vec![Key {
                key_hash: key_hash.clone(),
                owner_id: user_id.to_string(),
            }],
            router_id: "default".to_string(),
            router_config: "{}".to_string(),
        }
    }
}

#[derive(TS, Serialize, Deserialize, Debug, Clone)]
#[ts(export)]
pub enum Update {
    AuthData { data: AuthData },
    Config { data: Config },
    Keys { data: Vec<Key> },
}

#[derive(TS, Serialize, Deserialize, Debug, Clone)]
#[ts(export)]
#[derive(Default)]
pub enum Status {
    #[default]
    Success,
    Error {
        message: String,
    },
}

#[derive(TS, Serialize, Deserialize, Debug, Clone)]
#[ts(export)]
pub enum Ack {
    Heartbeat(Status),
    SendLog(Status),
}

#[derive(TS, Serialize, Deserialize, Debug, Clone)]
#[ts(export)]
#[serde(tag = "_type")]
pub enum MessageTypeRX {
    Ack(Ack),
    Update(Update),
}

/// To generate the bindings, run:
/// ```bash
/// BINDING_DIR="../../helicone/packages/llm-mapper/router-bindings" cargo test export_types -- --ignored
/// ```
#[cfg(test)]
mod tests {
    use std::{env, ffi::OsStr, fs, io::Write, path::Path};

    use super::*;

    #[test]
    #[ignore]
    fn export_types() {
        fn generate_exports(dir: &Path) -> Option<Vec<String>> {
            let mut exports: Vec<String> = fs::read_dir(dir)
                .ok()?
                .filter_map(Result::ok)
                .filter_map(|entry| {
                    entry
                        .path()
                        .file_stem()
                        .and_then(OsStr::to_str)
                        .map(str::to_owned)
                })
                .filter(|f| f != "index")
                .map(|f| format!("export * from \"./{f}\""))
                .collect();

            exports.sort();

            Some(exports)
        }

        let binding_dir =
            std::env::var("BINDING_DIR").unwrap_or("./bindings".to_string());
        MessageTypeTX::export_all_to(binding_dir.clone()).unwrap();
        MessageTypeRX::export_all_to(binding_dir.clone()).unwrap();

        let manifest_dir =
            env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
        let bindings_path = Path::new(&manifest_dir).join(&binding_dir);

        if !bindings_path.exists() {
            println!(
                "bindings path does not exist: {}",
                bindings_path.display()
            );
            std::process::exit(1);
        }
        println!("generating bindings");

        // Generate and write exports for bindings/index.ts
        let exports = generate_exports(&bindings_path);
        let Some(exports) = exports else {
            println!("cargo:warning=No exports found for bindings");
            return;
        };
        let index_path = bindings_path.join("index.ts");
        let mut file = fs::File::create(&index_path).unwrap_or_else(|e| {
            panic!("Failed to create {}: {}", index_path.display(), e)
        });
        file.write_all(exports.join("\n").as_bytes())
            .unwrap_or_else(|e| {
                panic!("Failed to write to {}: {}", index_path.display(), e)
            });
        file.flush().expect("Failed to flush file");

        std::process::Command::new("npx")
            .arg("prettier")
            .arg("--write")
            .arg(format!("{binding_dir}/**/*.ts"))
            .output()
            .unwrap();
    }

    #[test]
    fn test_hash_key() {
        // Test that the hash function produces consistent results
        let key = "sk-helicone-test-key";
        let hash1 = hash_key(key);
        let hash2 = hash_key(key);

        assert_eq!(hash1, hash2, "Hash should be deterministic");
        assert_eq!(hash1.len(), 64, "SHA-256 hash should be 64 hex characters");

        // Test that different keys produce different hashes
        let different_key = "sk-helicone-different-key";
        let different_hash = hash_key(different_key);
        assert_ne!(
            hash1, different_hash,
            "Different keys should produce different hashes"
        );

        // Test the expected hash for a known input
        let expected_hash =
            "dea6a3eaf901874aed6d21b1828e4d8c903d740cc125ef2b2f305a2da46f8825";
        assert_eq!(
            hash_key("Bearer sk-helicone-test-key"),
            expected_hash,
            "Hash should match expected value"
        );
    }
}
