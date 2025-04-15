use std::path::Path;
use std::fs;
use wiremock::{Match, Request};

use crate::tests::error::TestError;
use crate::tests::stubs::Stub;

pub struct StubMatcher {
    stubs: Vec<Stub>,
}

impl StubMatcher {
    pub fn load_stubs<P: AsRef<Path>>(stub_directory: P) -> Result<Self, TestError> {
        let mut stubs = Vec::new();
        
        let entries = fs::read_dir(stub_directory).map_err(TestError::Io)?;
        for entry in entries.filter_map(Result::ok) {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "yaml" || ext == "yml") {
                match fs::read_to_string(&path) {
                    Ok(content) => {
                        match serde_yml::from_str::<Stub>(&content) {
                            Ok(stub) => stubs.push(stub),
                            Err(e) => eprintln!("Failed to parse stub file {:?}: {}", path, e),
                        }
                    },
                    Err(e) => eprintln!("Failed to read stub file {:?}: {}", path, e),
                }
            }
        }
        stubs.sort_by_key(|stub| stub.priority.unwrap_or(u8::MAX));
        
        Ok(StubMatcher { stubs })
    }
}

impl Match for StubMatcher {
    fn matches(&self, request: &Request) -> bool {
        // self.stubs.iter().any(|stub| stub.matches(request))
        false
    }
}
