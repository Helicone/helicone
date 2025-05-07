use std::{
    collections::{HashMap, HashSet, VecDeque},
    fs,
    path::PathBuf,
};

use anyhow::{Context, Result};
use clap::Parser;
use openapiv3::{OpenAPI, ReferenceOr};
use serde::{Deserialize, Serialize};

#[derive(Parser, Debug)]
#[command(
    author,
    version,
    about = "Filter an OpenAPI schema based on a YAML configuration"
)]
struct Args {
    /// Path to input `OpenAPI` schema file
    #[arg(short, long)]
    input: PathBuf,

    /// Path to configuration YAML file
    #[arg(short, long)]
    config: PathBuf,

    /// Path to output the filtered `OpenAPI` schema
    #[arg(short, long)]
    output: PathBuf,
}

#[derive(Debug, Deserialize, Serialize)]
struct EndpointFilter {
    method: String,
    url: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct Config {
    providers: HashMap<String, Vec<EndpointFilter>>,
}

fn main() -> Result<()> {
    let args = Args::parse();

    // Read the OpenAPI schema
    let schema_content =
        fs::read_to_string(&args.input).with_context(|| {
            format!("Failed to read schema file at {:?}", args.input)
        })?;

    let mut schema: OpenAPI =
        if args.input.extension().is_some_and(|ext| ext == "json") {
            serde_json::from_str(&schema_content)
                .with_context(|| "Failed to parse OpenAPI schema as JSON")?
        } else {
            serde_yaml::from_str(&schema_content)
                .with_context(|| "Failed to parse OpenAPI schema as YAML")?
        };

    // Read the config file
    let config_content =
        fs::read_to_string(&args.config).with_context(|| {
            format!("Failed to read config file at {:?}", args.config)
        })?;

    let config: Config = serde_yaml::from_str(&config_content)
        .with_context(|| "Failed to parse config file")?;

    // Filter the schema
    filter_schema(&mut schema, &config);

    // Write the filtered schema to the output file
    let output_content =
        if args.output.extension().is_some_and(|ext| ext == "json") {
            serde_json::to_string_pretty(&schema).with_context(|| {
                "Failed to serialize filtered schema to JSON"
            })?
        } else {
            serde_yaml::to_string(&schema).with_context(|| {
                "Failed to serialize filtered schema to YAML"
            })?
        };

    fs::write(&args.output, output_content).with_context(|| {
        format!("Failed to write filtered schema to {:?}", args.output)
    })?;

    println!(
        "Successfully filtered schema and wrote to {:?}",
        args.output
    );
    Ok(())
}

fn filter_schema(schema: &mut OpenAPI, config: &Config) {
    // Create a set of paths to keep
    let mut paths_to_keep = HashMap::new();

    // Collect all endpoints from all providers in config
    for endpoints in config.providers.values() {
        for endpoint in endpoints {
            let normalized_path = normalize_path(&endpoint.url);
            paths_to_keep.insert(
                normalized_path.clone(),
                endpoint.method.to_lowercase(),
            );
        }
    }

    // Filter the paths in the schema
    let mut filtered_paths = openapiv3::Paths::default();

    for (path, path_item) in schema.paths.iter() {
        let mut keep_path = false;
        let mut filtered_path_item = path_item.as_item().unwrap().clone();

        // Check GET operations
        if filtered_path_item.get.is_some() {
            if should_keep_operation(path, "get", &paths_to_keep) {
                keep_path = true;
            } else {
                filtered_path_item.get = None;
            }
        }

        // Check POST operations
        if filtered_path_item.post.is_some() {
            if should_keep_operation(path, "post", &paths_to_keep) {
                keep_path = true;
            } else {
                filtered_path_item.post = None;
            }
        }

        // Check PUT operations
        if filtered_path_item.put.is_some() {
            if should_keep_operation(path, "put", &paths_to_keep) {
                keep_path = true;
            } else {
                filtered_path_item.put = None;
            }
        }

        // Check DELETE operations
        if filtered_path_item.delete.is_some() {
            if should_keep_operation(path, "delete", &paths_to_keep) {
                keep_path = true;
            } else {
                filtered_path_item.delete = None;
            }
        }

        // Check PATCH operations
        if filtered_path_item.patch.is_some() {
            if should_keep_operation(path, "patch", &paths_to_keep) {
                keep_path = true;
            } else {
                filtered_path_item.patch = None;
            }
        }

        // If any operations are kept, add the path to filtered paths
        if keep_path {
            filtered_paths.paths.insert(
                path.clone(),
                openapiv3::ReferenceOr::Item(filtered_path_item),
            );
        }
    }

    // Replace the original paths with filtered paths
    schema.paths = filtered_paths;

    // DEBUG: Log the paths that were kept
    println!("DEBUG: Kept paths after filtering:");
    for path in schema.paths.paths.keys() {
        println!("  - {path}");
    }

    // Now find and keep only the schema components that are referenced by the
    // remaining paths
    if schema.components.is_some() {
        // Find which schemas are used in the filtered paths
        let used_schemas = find_referenced_schemas(schema);

        // DEBUG: Log original schemas and the identified used schemas before
        // filtering
        println!("DEBUG: Original component schemas:");
        for key in schema.components.as_ref().unwrap().schemas.keys() {
            println!("  - {key}");
        }
        println!(
            "DEBUG: Final used schemas identified (including dependencies):"
        );
        for schema_name in &used_schemas {
            println!("  - {schema_name}");
        }

        // Clone the schema components to avoid borrow issues
        let mut components = schema.components.clone().unwrap();

        // Filter out unused schemas
        let schemas_to_keep: Vec<String> = components
            .schemas
            .keys()
            .filter(|key| used_schemas.contains(*key))
            .cloned()
            .collect();

        // Create a new schemas map with only the used schemas
        let mut filtered_schemas = indexmap::IndexMap::new();
        for key in schemas_to_keep {
            if let Some(schema_ref) = components.schemas.get(&key) {
                filtered_schemas.insert(key, schema_ref.clone());
            }
        }

        // Replace with filtered schemas
        components.schemas = filtered_schemas;

        // Update the components
        schema.components = Some(components);
    }
}

/// Find all schemas referenced in the paths section and resolve nested
/// references
#[allow(clippy::too_many_lines)]
fn find_referenced_schemas(schema: &OpenAPI) -> HashSet<String> {
    let mut referenced_schemas = HashSet::new();
    let mut to_process = VecDeque::new();
    let mut processed = HashSet::new();

    // Helper function to extract references from a string
    let extract_ref = |reference: &str| -> Option<String> {
        if reference.starts_with("#/components/schemas/") {
            Some(
                reference
                    .trim_start_matches("#/components/schemas/")
                    .to_string(),
            )
        } else {
            None
        }
    };

    // Process each path item
    for (_, path_item) in schema.paths.iter() {
        if let ReferenceOr::Reference { reference } = path_item {
            if let Some(ref_name) = extract_ref(reference) {
                referenced_schemas.insert(ref_name.clone());
                to_process.push_back(ref_name);
            }
            continue;
        }

        let path_item = path_item.as_item().unwrap();

        // Helper function to process an operation
        let mut process_operation = |op: &openapiv3::Operation| {
            // Process parameters
            for param in &op.parameters {
                match param {
                    ReferenceOr::Reference { reference } => {
                        if let Some(ref_name) = extract_ref(reference) {
                            referenced_schemas.insert(ref_name.clone());
                            to_process.push_back(ref_name);
                        }
                    }
                    ReferenceOr::Item(param) => {
                        // Extract schemas from parameter
                        match param {
                            openapiv3::Parameter::Query { parameter_data, .. } |
                            openapiv3::Parameter::Header { parameter_data, .. } |
                            openapiv3::Parameter::Path { parameter_data, .. } |
                            openapiv3::Parameter::Cookie { parameter_data, .. } => {
                                if let openapiv3::ParameterSchemaOrContent::Schema(schema) = &parameter_data.format {
                                    extract_schema_references(schema, &mut referenced_schemas, &mut to_process);
                                }
                            }
                        }
                    }
                }
            }

            // Process request body
            if let Some(req_body) = &op.request_body {
                match req_body {
                    ReferenceOr::Reference { reference } => {
                        if let Some(ref_name) = extract_ref(reference) {
                            referenced_schemas.insert(ref_name.clone());
                            to_process.push_back(ref_name);
                        }
                    }
                    ReferenceOr::Item(body) => {
                        for (_, media_type) in &body.content {
                            if let Some(schema) = &media_type.schema {
                                extract_schema_references(
                                    schema,
                                    &mut referenced_schemas,
                                    &mut to_process,
                                );
                            }
                        }
                    }
                }
            }

            // Process responses
            for (_, response) in &op.responses.responses {
                match response {
                    ReferenceOr::Reference { reference } => {
                        if let Some(ref_name) = extract_ref(reference) {
                            referenced_schemas.insert(ref_name.clone());
                            to_process.push_back(ref_name);
                        }
                    }
                    ReferenceOr::Item(resp) => {
                        for (_, media_type) in &resp.content {
                            if let Some(schema) = &media_type.schema {
                                extract_schema_references(
                                    schema,
                                    &mut referenced_schemas,
                                    &mut to_process,
                                );
                            }
                        }
                    }
                }
            }
        };

        // Process each operation type
        if let Some(op) = &path_item.get {
            process_operation(op);
        }
        if let Some(op) = &path_item.post {
            process_operation(op);
        }
        if let Some(op) = &path_item.put {
            process_operation(op);
        }
        if let Some(op) = &path_item.delete {
            process_operation(op);
        }
        if let Some(op) = &path_item.patch {
            process_operation(op);
        }

        // Process path parameters
        for param in &path_item.parameters {
            if let ReferenceOr::Reference { reference } = param {
                if let Some(ref_name) = extract_ref(reference) {
                    referenced_schemas.insert(ref_name.clone());
                    to_process.push_back(ref_name);
                }
            }
        }
    }

    // DEBUG: Log initial schemas found directly from paths/operations
    println!("DEBUG: Initial schemas directly referenced:");
    for schema_name in &referenced_schemas {
        println!("  - {schema_name}");
    }
    println!("DEBUG: Initial queue for dependency checking:");
    for schema_name in &to_process {
        println!("  - {schema_name}");
    }

    // Process all the referenced schemas to find their dependencies
    if let Some(components) = &schema.components {
        while let Some(schema_name) = to_process.pop_front() {
            if processed.contains(&schema_name) {
                continue;
            }

            processed.insert(schema_name.clone());

            if let Some(schema_or_ref) = components.schemas.get(&schema_name) {
                match schema_or_ref {
                    ReferenceOr::Reference { reference } => {
                        if let Some(ref_name) = extract_ref(reference) {
                            referenced_schemas.insert(ref_name.clone());
                            to_process.push_back(ref_name);
                        }
                    }
                    ReferenceOr::Item(schema) => {
                        // Process the schema to find any nested schema
                        // references
                        process_schema_for_references(
                            schema,
                            &mut referenced_schemas,
                            &mut to_process,
                        );
                    }
                }
            }
        }
    }

    // DEBUG: Log final set of schemas after dependency traversal
    println!("DEBUG: Final set of referenced schemas after traversal:");
    for schema_name in &referenced_schemas {
        println!("  - {schema_name}");
    }

    referenced_schemas
}

/// Extract references from a schema or reference
fn extract_schema_references(
    schema_or_ref: &ReferenceOr<openapiv3::Schema>,
    referenced_schemas: &mut HashSet<String>,
    to_process: &mut VecDeque<String>,
) {
    match schema_or_ref {
        ReferenceOr::Reference { reference } => {
            if reference.starts_with("#/components/schemas/") {
                let schema_name = reference
                    .trim_start_matches("#/components/schemas/")
                    .to_string();
                referenced_schemas.insert(schema_name.clone());
                to_process.push_back(schema_name);
            }
        }
        ReferenceOr::Item(schema) => {
            process_schema_for_references(
                schema,
                referenced_schemas,
                to_process,
            );
        }
    }
}

/// Helper to extract references from a boxed schema reference
fn extract_boxed_schema_references(
    boxed_schema: &ReferenceOr<Box<openapiv3::Schema>>,
    referenced_schemas: &mut HashSet<String>,
    to_process: &mut VecDeque<String>,
) {
    match boxed_schema {
        ReferenceOr::Reference { reference } => {
            if reference.starts_with("#/components/schemas/") {
                let schema_name = reference
                    .trim_start_matches("#/components/schemas/")
                    .to_string();
                referenced_schemas.insert(schema_name.clone());
                to_process.push_back(schema_name);
            }
        }
        ReferenceOr::Item(boxed_schema) => {
            process_schema_for_references(
                boxed_schema,
                referenced_schemas,
                to_process,
            );
        }
    }
}

/// Process a schema to find all nested schema references
fn process_schema_for_references(
    schema: &openapiv3::Schema,
    referenced_schemas: &mut HashSet<String>,
    to_process: &mut VecDeque<String>,
) {
    // Process different types of schema structures
    match &schema.schema_kind {
        openapiv3::SchemaKind::Type(schema_type) => {
            match schema_type {
                openapiv3::Type::Object(obj) => {
                    // Process object properties
                    for (_, prop) in &obj.properties {
                        // Properties are ReferenceOr<Box<Schema>>, use the
                        // boxed helper
                        extract_boxed_schema_references(
                            prop,
                            referenced_schemas,
                            to_process,
                        );
                    }

                    // Process additional properties
                    if let Some(openapiv3::AdditionalProperties::Schema(
                        schema_box_ref,
                    )) = &obj.additional_properties
                    {
                        // AdditionalProperties can be bool or
                        // Schema(Box<ReferenceOr<Schema>>)
                        // Dereference the Box first to get
                        // ReferenceOr<Schema>, then use the standard helper
                        extract_schema_references(
                            schema_box_ref,
                            referenced_schemas,
                            to_process,
                        );
                    }
                }
                openapiv3::Type::Array(arr) => {
                    // Process array items
                    if let Some(items) = &arr.items {
                        // Items are ReferenceOr<Box<Schema>>, use the boxed
                        // helper
                        extract_boxed_schema_references(
                            items,
                            referenced_schemas,
                            to_process,
                        );
                    }
                }
                _ => {} // Other primitive types don't have nested schemas
            }
        }
        openapiv3::SchemaKind::OneOf { one_of } => {
            // one_of contains Vec<ReferenceOr<Schema>>, use the standard helper
            for schema_or_ref in one_of {
                extract_schema_references(
                    schema_or_ref,
                    referenced_schemas,
                    to_process,
                );
            }
        }
        openapiv3::SchemaKind::AllOf { all_of } => {
            // all_of contains Vec<ReferenceOr<Schema>>, use the standard helper
            for schema_or_ref in all_of {
                extract_schema_references(
                    schema_or_ref,
                    referenced_schemas,
                    to_process,
                );
            }
        }
        openapiv3::SchemaKind::AnyOf { any_of } => {
            // any_of contains Vec<ReferenceOr<Schema>>, use the standard helper
            for schema_or_ref in any_of {
                extract_schema_references(
                    schema_or_ref,
                    referenced_schemas,
                    to_process,
                );
            }
        }
        openapiv3::SchemaKind::Not { not } => {
            // 'not' is Box<ReferenceOr<Schema>>. Dereference the Box first.
            extract_schema_references(not, referenced_schemas, to_process);
        }
        openapiv3::SchemaKind::Any(_) => {} /* Any schema type doesn't have
                                             * specific references */
    }
}

fn normalize_path(path: &str) -> String {
    // Remove trailing slash if present
    path.trim_end_matches('/').to_string()
}

fn should_keep_operation(
    path: &str,
    method: &str,
    paths_to_keep: &HashMap<String, String>,
) -> bool {
    let normalized_path = normalize_path(path);

    paths_to_keep
        .get(&normalized_path)
        .is_some_and(|allowed_method| allowed_method == method)
}
