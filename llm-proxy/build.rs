use std::{env, ffi::OsStr, fs, io::Write, path::Path};

fn main() {
    if std::env::var("PROFILE").is_ok_and(|p| p == "release") {
        // No-op for release builds
        return;
    }
    // Trigger recompilation when bindings are changed
    println!("cargo:rerun-if-changed=./bindings");

    let manifest_dir =
        env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR not set");
    let bindings_path = Path::new(&manifest_dir).join("./bindings");

    if !bindings_path.exists() {
        println!("bindings path does not exist: {}", bindings_path.display());
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
}

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
