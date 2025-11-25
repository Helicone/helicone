import re
import json
from typing import Any, Dict, List, Union, Optional
from .types import TemplateVariable, ValidationError, SubstitutionResult, PromptPartialVariable

# Regex pattern to match {{hc:name:type}} format - matches TypeScript version
TEMPLATE_REGEX = re.compile(r'\{\{\s*hc\s*:\s*([a-zA-Z_-][a-zA-Z0-9_-]*)\s*:\s*([a-zA-Z_-][a-zA-Z0-9_-]*)\s*\}\}')
# Regex pattern to match {{hcp:prompt_id:index:environment}} format for prompt partials
PROMPT_PARTIAL_REGEX = re.compile(r'\{\{\s*hcp\s*:\s*([a-zA-Z0-9]{6})\s*:\s*(\d+)\s*(?::\s*([a-zA-Z_-][a-zA-Z0-9_-]*))?\s*\}\}')


class HeliconeTemplateManager:
    """
    Template manager for Helicone prompt variable substitution.
    Handles both string templates and JSON object templates with type validation.
    """

    ALLOWED_TYPES = {"string", "number", "boolean"}

    @classmethod
    def extract_prompt_partial_variables(cls, template: str) -> List[PromptPartialVariable]:
        """
        Extract all distinct prompt partial variables from a template string.

        Args:
            template: The template string containing {{hcp:prompt_id:index:environment}} patterns

        Returns:
            Array of unique prompt partial variables with their prompt_id, index, and optional environment
        """
        variables_dict: Dict[str, PromptPartialVariable] = {}

        for match in PROMPT_PARTIAL_REGEX.finditer(template):
            full_match = match.group(0)
            prompt_id = match.group(1).strip()
            index = int(match.group(2).strip())
            environment = match.group(3).strip() if match.group(3) else None

            key = f"{prompt_id}:{index}:{environment or ''}"

            if key not in variables_dict:
                variables_dict[key] = PromptPartialVariable(
                    prompt_id=prompt_id,
                    index=index,
                    environment=environment,
                    raw=full_match
                )

        return list(variables_dict.values())

    @classmethod
    def extract_variables(cls, template: str) -> List[TemplateVariable]:
        """Extract all template variables from a string."""
        variables = []
        for match in TEMPLATE_REGEX.finditer(template):
            name = match.group(1).strip()
            var_type = match.group(2).strip()
            raw = match.group(0)
            variables.append(TemplateVariable(name=name, type=var_type, raw=raw))
        return variables
    
    @classmethod
    def is_type_compatible(cls, value: Any, expected_type: str) -> bool:
        """Check if a value is compatible with the expected type."""
        if expected_type == "string":
            return isinstance(value, str)
        elif expected_type == "number":
            return isinstance(value, (int, float))
        elif expected_type == "boolean":
            if isinstance(value, bool):
                return True
            if isinstance(value, str):
                return value.lower() in {"true", "false", "yes", "no"}
            return False
        else:
            return True
    
    @classmethod
    def convert_boolean_value(cls, value: Any) -> bool:
        """Convert various boolean representations to actual boolean."""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in {"true", "yes"}
        return bool(value)
    
    @classmethod
    def substitute_variables(
        cls,
        template: str,
        inputs: Dict[str, Any],
        prompt_partial_inputs: Optional[Dict[str, Any]] = None
    ) -> SubstitutionResult:
        """
        Substitute variables in template with provided inputs after type validation.

        Args:
            template: The template string containing {{hc:NAME:type}} patterns
            inputs: Hash map of input values
            prompt_partial_inputs: Hash map of prompt partial replacement values (keyed by raw template string)

        Returns:
            SubstitutionResult with success status and either result string or errors
        """
        if prompt_partial_inputs is None:
            prompt_partial_inputs = {}

        variables = cls.extract_variables(template)
        errors: List[ValidationError] = []

        # Validate all variables first
        for variable in variables:
            value = inputs.get(variable.name)

            if value is None:
                continue

            if not cls.is_type_compatible(value, variable.type):
                errors.append(ValidationError(
                    variable=variable.name,
                    expected=variable.type,
                    value=value
                ))

        if errors:
            return SubstitutionResult(success=False, errors=errors)

        # First replace prompt partials, since they contain variables
        result = template
        for match in PROMPT_PARTIAL_REGEX.finditer(template):
            full_match = match.group(0)
            value = prompt_partial_inputs.get(full_match)
            if value is not None:
                result = result.replace(full_match, str(value))

        # Now result contains prompt partials replaced, so a full prompt with all variables
        # Perform variable substitution
        for variable in variables:
            value = inputs.get(variable.name)
            if value is not None:
                # Convert boolean values if needed
                if variable.type == "boolean":
                    value = cls.convert_boolean_value(value)
                result = result.replace(variable.raw, str(value))

        return SubstitutionResult(success=True, result=result)
    
    @classmethod
    def is_whole_match(cls, text: str) -> bool:
        """Check if the entire string is a single template variable."""
        match = TEMPLATE_REGEX.fullmatch(text.strip())
        return match is not None
    
    @classmethod
    def get_variable_name(cls, text: str) -> str:
        """Extract variable name from a template string."""
        match = TEMPLATE_REGEX.search(text)
        if match:
            return match.group(1).strip()
        return ""
    
    @classmethod
    def perform_regex_replacement(cls, text: str, inputs: Dict[str, Any]) -> str:
        """Perform regex replacement for partial template matches."""
        def replace_match(match):
            name = match.group(1).strip()
            value = inputs.get(name)
            return str(value) if value is not None else match.group(0)
        
        return TEMPLATE_REGEX.sub(replace_match, text)
    
    @classmethod
    def process_object_kv(cls, obj: Any, inputs: Dict[str, Any], errors: List[ValidationError]) -> Any:
        """
        Process keys and values in an object for template substitution.
        Handles both whole-match replacement and regex substitution.
        """
        if isinstance(obj, str):
            # If it's a string and wholly matches tag regex, replace with input value
            if cls.is_whole_match(obj):
                var_name = cls.get_variable_name(obj)
                if var_name and var_name in inputs:
                    return inputs[var_name]
            # Otherwise, perform regex replacement
            return cls.perform_regex_replacement(obj, inputs)
        
        elif isinstance(obj, list):
            return [cls.process_object_kv(item, inputs, errors) for item in obj]
        
        elif isinstance(obj, dict):
            result = {}
            for key, value in obj.items():
                processed_key = key
                
                if isinstance(key, str):
                    if cls.is_whole_match(key):
                        # Key wholly matches -> must be string replacement only
                        var_name = cls.get_variable_name(key)
                        if var_name and var_name in inputs:
                            input_value = inputs[var_name]
                            if isinstance(input_value, str):
                                processed_key = input_value
                            else:
                                errors.append(ValidationError(
                                    variable=var_name,
                                    expected="string",
                                    value=input_value
                                ))
                                continue
                    else:
                        # Key contains template but not wholly -> regex replacement
                        processed_key = cls.perform_regex_replacement(key, inputs)
                
                processed_value = cls.process_object_kv(value, inputs, errors)
                result[processed_key] = processed_value
            
            return result
        
        # For other types (number, boolean, None), return as-is
        return obj
    
    @classmethod
    def substitute_variables_json(cls, json_obj: Dict[str, Any], inputs: Dict[str, Any]) -> SubstitutionResult:
        """
        Substitute variables in JSON format object with provided inputs.
        
        Args:
            json_obj: The JSON object containing "{{hc:NAME:type}}" patterns
            inputs: Hash map of input values
            
        Returns:
            SubstitutionResult with success status and either result object or errors
        """
        # Extract variables from the JSON string representation
        json_str = json.dumps(json_obj)
        variables = cls.extract_variables(json_str)
        errors: List[ValidationError] = []
        
        # Validate all variables first
        for variable in variables:
            value = inputs.get(variable.name)
            
            if value is None or not cls.is_type_compatible(value, variable.type):
                errors.append(ValidationError(
                    variable=variable.name,
                    expected=variable.type,
                    value=value
                ))
        
        if errors:
            return SubstitutionResult(success=False, errors=errors)
        
        try:
            result = cls.process_object_kv(json_obj, inputs, errors)
            
            if errors:
                return SubstitutionResult(success=False, errors=errors)
            
            return SubstitutionResult(success=True, result=result)
        
        except Exception as e:
            return SubstitutionResult(
                success=False,
                errors=[ValidationError(
                    variable="unknown",
                    expected="valid",
                    value=str(e)
                )]
            ) 