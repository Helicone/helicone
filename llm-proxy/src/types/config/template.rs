use derive_more::From;
use indexmap::IndexMap;

#[derive(Debug, From, PartialEq, Eq, Hash)]
pub struct TemplateInput(String);

#[derive(Debug, From, PartialEq, Eq, Hash)]
pub struct TemplateInputKey(String);

#[derive(Debug, PartialEq, Eq)]
pub struct TemplateInputs(IndexMap<TemplateInputKey, TemplateInput>);
