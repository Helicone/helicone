/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TsoaRoute, fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TokenController } from './../controllers/tokenController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { RequestController } from './../controllers/requestController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GenerateHashController } from './../controllers/generateHashController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DatasetController } from './../controllers/datasetController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { FineTuneMainController } from './../controllers/fineTuneController';
import { expressAuthentication } from './../authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "TokenResponseBody": {
        "dataType": "refObject",
        "properties": {
            "tokens": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TokenBodyParams": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Json": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"dataType":"enum","enums":[null]},{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"union","subSchemas":[{"ref":"Json"},{"dataType":"undefined"}]}},{"dataType":"array","array":{"dataType":"refAlias","ref":"Json"}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Provider": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["OPENAI"]},{"dataType":"enum","enums":["ANTHROPIC"]},{"dataType":"enum","enums":["TOGETHERAI"]},{"dataType":"enum","enums":["GROQ"]},{"dataType":"enum","enums":["CUSTOM"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LlmType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["chat"]},{"dataType":"enum","enums":["completion"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FunctionCall": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "arguments": {"dataType":"object"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Message": {
        "dataType": "refObject",
        "properties": {
            "role": {"dataType":"string"},
            "content": {"dataType":"string"},
            "function_call": {"ref":"FunctionCall"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Request": {
        "dataType": "refObject",
        "properties": {
            "llm_type": {"ref":"LlmType"},
            "model": {"dataType":"string"},
            "provider": {"dataType":"string"},
            "prompt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "max_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "temperature": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "top_p": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "n": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "stream": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}]},
            "stop": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "presence_penalty": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "frequency_penalty": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "logprobs": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "best_of": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "logit_bias": {"dataType":"union","subSchemas":[{"dataType":"object"},{"dataType":"enum","enums":[null]}]},
            "user": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "messages": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"Message"}},{"dataType":"enum","enums":[null]}]},
            "tooLarge": {"dataType":"boolean"},
            "heliconeMessage": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_number.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"string"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ErrorInfo": {
        "dataType": "refObject",
        "properties": {
            "code": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "message": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Response": {
        "dataType": "refObject",
        "properties": {
            "completions": {"dataType":"union","subSchemas":[{"ref":"Record_number.string_"},{"dataType":"enum","enums":[null]}]},
            "message": {"dataType":"union","subSchemas":[{"ref":"Message"},{"dataType":"enum","enums":[null]}]},
            "error": {"dataType":"union","subSchemas":[{"ref":"ErrorInfo"},{"dataType":"enum","enums":[null]}]},
            "model": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "tooLarge": {"dataType":"boolean"},
            "heliconeMessage": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LlmSchema": {
        "dataType": "refObject",
        "properties": {
            "request": {"ref":"Request","required":true},
            "response": {"dataType":"union","subSchemas":[{"ref":"Response"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HeliconeRequest": {
        "dataType": "refObject",
        "properties": {
            "response_id": {"dataType":"string","required":true},
            "response_created_at": {"dataType":"string","required":true},
            "response_body": {"dataType":"any"},
            "response_status": {"dataType":"double","required":true},
            "response_model": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "request_id": {"dataType":"string","required":true},
            "request_model": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "model_override": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "request_created_at": {"dataType":"string","required":true},
            "request_body": {"dataType":"any","required":true},
            "request_path": {"dataType":"string","required":true},
            "request_user_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "request_properties": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Json"}},{"dataType":"enum","enums":[null]}],"required":true},
            "request_feedback": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Json"}},{"dataType":"enum","enums":[null]}],"required":true},
            "helicone_user": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "prompt_name": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "prompt_regex": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "key_name": {"dataType":"string","required":true},
            "delay_ms": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "time_to_first_token": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "total_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "prompt_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "completion_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "provider": {"ref":"Provider","required":true},
            "node_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "feedback_created_at": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "feedback_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "feedback_rating": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}]},
            "signed_body_url": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "llmSchema": {"dataType":"union","subSchemas":[{"ref":"LlmSchema"},{"dataType":"enum","enums":[null]}],"required":true},
            "country_code": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResult_HeliconeRequest-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"HeliconeRequest"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ErrorResult_string_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"enum","enums":[null],"required":true},
            "error": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_HeliconeRequest-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResult_HeliconeRequest-Array_"},{"ref":"ErrorResult_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TextOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"not-equals":{"dataType":"string"},"equals":{"dataType":"string"},"like":{"dataType":"string"},"ilike":{"dataType":"string"},"contains":{"dataType":"string"},"not-contains":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TimestampOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"gte":{"dataType":"string"},"lte":{"dataType":"string"},"lt":{"dataType":"string"},"gt":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_NumberOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"not-equals":{"dataType":"double"},"equals":{"dataType":"double"},"gte":{"dataType":"double"},"lte":{"dataType":"double"},"lt":{"dataType":"double"},"gt":{"dataType":"double"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_UserMetricsToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"user_id":{"ref":"Partial_TextOperators_"},"last_active":{"ref":"Partial_TimestampOperators_"},"total_requests":{"ref":"Partial_NumberOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_UserApiKeysTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"api_key_hash":{"ref":"Partial_TextOperators_"},"api_key_name":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_ResponseTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"body_tokens":{"ref":"Partial_NumberOperators_"},"body_model":{"ref":"Partial_TextOperators_"},"body_completion":{"ref":"Partial_TextOperators_"},"status":{"ref":"Partial_NumberOperators_"},"model":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_RequestTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"prompt":{"ref":"Partial_TextOperators_"},"created_at":{"ref":"Partial_TimestampOperators_"},"user_id":{"ref":"Partial_TextOperators_"},"auth_hash":{"ref":"Partial_TextOperators_"},"org_id":{"ref":"Partial_TextOperators_"},"id":{"ref":"Partial_TextOperators_"},"node_id":{"ref":"Partial_TextOperators_"},"model":{"ref":"Partial_TextOperators_"},"modelOverride":{"ref":"Partial_TextOperators_"},"path":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_BooleanOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"equals":{"dataType":"boolean"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_FeedbackTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"ref":"Partial_NumberOperators_"},"created_at":{"ref":"Partial_TimestampOperators_"},"rating":{"ref":"Partial_BooleanOperators_"},"response_id":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_PropertiesTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"auth_hash":{"ref":"Partial_TextOperators_"},"key":{"ref":"Partial_TextOperators_"},"value":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TimestampOperatorsTyped_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"gte":{"dataType":"datetime"},"lte":{"dataType":"datetime"},"lt":{"dataType":"datetime"},"gt":{"dataType":"datetime"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_RequestResponseLogToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"latency":{"ref":"Partial_NumberOperators_"},"status":{"ref":"Partial_NumberOperators_"},"request_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"response_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"auth_hash":{"ref":"Partial_TextOperators_"},"model":{"ref":"Partial_TextOperators_"},"user_id":{"ref":"Partial_TextOperators_"},"organization_id":{"ref":"Partial_TextOperators_"},"node_id":{"ref":"Partial_TextOperators_"},"job_id":{"ref":"Partial_TextOperators_"},"threat":{"ref":"Partial_BooleanOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_UserViewToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"user_id":{"ref":"Partial_TextOperators_"},"active_for":{"ref":"Partial_NumberOperators_"},"first_active":{"ref":"Partial_TimestampOperators_"},"last_active":{"ref":"Partial_TimestampOperators_"},"total_requests":{"ref":"Partial_NumberOperators_"},"average_requests_per_day_active":{"ref":"Partial_NumberOperators_"},"average_tokens_per_request":{"ref":"Partial_NumberOperators_"},"total_completion_tokens":{"ref":"Partial_NumberOperators_"},"total_prompt_token":{"ref":"Partial_NumberOperators_"},"cost":{"ref":"Partial_NumberOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_PropertiesCopyV2ToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"key":{"ref":"Partial_TextOperators_"},"value":{"ref":"Partial_TextOperators_"},"organization_id":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_PropertyWithResponseV1ToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"property_key":{"ref":"Partial_TextOperators_"},"property_value":{"ref":"Partial_TextOperators_"},"request_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"organization_id":{"ref":"Partial_TextOperators_"},"threat":{"ref":"Partial_BooleanOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_JobToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"ref":"Partial_TextOperators_"},"name":{"ref":"Partial_TextOperators_"},"description":{"ref":"Partial_TextOperators_"},"status":{"ref":"Partial_TextOperators_"},"created_at":{"ref":"Partial_TimestampOperators_"},"updated_at":{"ref":"Partial_TimestampOperators_"},"timeout_seconds":{"ref":"Partial_NumberOperators_"},"custom_properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"org_id":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_NodesToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"ref":"Partial_TextOperators_"},"name":{"ref":"Partial_TextOperators_"},"description":{"ref":"Partial_TextOperators_"},"job_id":{"ref":"Partial_TextOperators_"},"status":{"ref":"Partial_TextOperators_"},"created_at":{"ref":"Partial_TimestampOperators_"},"updated_at":{"ref":"Partial_TimestampOperators_"},"timeout_seconds":{"ref":"Partial_NumberOperators_"},"custom_properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"org_id":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_CacheHitsTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"organization_id":{"ref":"Partial_TextOperators_"},"request_id":{"ref":"Partial_TextOperators_"},"latency":{"ref":"Partial_NumberOperators_"},"completion_tokens":{"ref":"Partial_NumberOperators_"},"prompt_tokens":{"ref":"Partial_NumberOperators_"},"created_at":{"ref":"Partial_TimestampOperatorsTyped_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_RateLimitTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"organization_id":{"ref":"Partial_TextOperators_"},"created_at":{"ref":"Partial_TimestampOperatorsTyped_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TablesAndViews_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"user_metrics":{"ref":"Partial_UserMetricsToOperators_"},"user_api_keys":{"ref":"Partial_UserApiKeysTableToOperators_"},"response":{"ref":"Partial_ResponseTableToOperators_"},"request":{"ref":"Partial_RequestTableToOperators_"},"feedback":{"ref":"Partial_FeedbackTableToOperators_"},"properties_table":{"ref":"Partial_PropertiesTableToOperators_"},"request_response_log":{"ref":"Partial_RequestResponseLogToOperators_"},"users_view":{"ref":"Partial_UserViewToOperators_"},"properties_v3":{"ref":"Partial_PropertiesCopyV2ToOperators_"},"property_with_response_v1":{"ref":"Partial_PropertyWithResponseV1ToOperators_"},"job":{"ref":"Partial_JobToOperators_"},"job_node":{"ref":"Partial_NodesToOperators_"},"cache_hits":{"ref":"Partial_CacheHitsTableToOperators_"},"rate_limit_log":{"ref":"Partial_RateLimitTableToOperators_"},"properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"values":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SingleKey_TablesAndViews_": {
        "dataType": "refAlias",
        "type": {"ref":"Partial_TablesAndViews_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeaf": {
        "dataType": "refAlias",
        "type": {"ref":"SingleKey_TablesAndViews_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeaf"},{"ref":"FilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterBranch": {
        "dataType": "refObject",
        "properties": {
            "left": {"ref":"FilterNode","required":true},
            "operator": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["or"]},{"dataType":"enum","enums":["and"]}],"required":true},
            "right": {"ref":"FilterNode","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortDirection": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortLeafRequest": {
        "dataType": "refObject",
        "properties": {
            "created_at": {"ref":"SortDirection"},
            "cache_created_at": {"ref":"SortDirection"},
            "latency": {"ref":"SortDirection"},
            "last_active": {"ref":"SortDirection"},
            "total_tokens": {"ref":"SortDirection"},
            "completion_tokens": {"ref":"SortDirection"},
            "prompt_tokens": {"ref":"SortDirection"},
            "user_id": {"ref":"SortDirection"},
            "body_model": {"ref":"SortDirection"},
            "is_cached": {"ref":"SortDirection"},
            "request_prompt": {"ref":"SortDirection"},
            "response_text": {"ref":"SortDirection"},
            "properties": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"SortDirection"}},
            "values": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"SortDirection"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestQueryParams": {
        "dataType": "refObject",
        "properties": {
            "filter": {"ref":"FilterNode","required":true},
            "offset": {"dataType":"double"},
            "limit": {"dataType":"double"},
            "sort": {"ref":"SortLeafRequest"},
            "isCached": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GenerateHashQueryParams": {
        "dataType": "refObject",
        "properties": {
            "apiKey": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "keyName": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FineTuneBodyParams": {
        "dataType": "refObject",
        "properties": {
            "providerKeyId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FineTuneBody": {
        "dataType": "refObject",
        "properties": {
            "providerKeyId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: Router) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
        app.post('/v1/tokens/anthropic',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TokenController)),
            ...(fetchMiddlewares<RequestHandler>(TokenController.prototype.anthropicTokenCount)),

            function TokenController_anthropicTokenCount(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    body: {"in":"body","name":"body","required":true,"ref":"TokenBodyParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new TokenController();

              templateService.apiHandler({
                methodName: 'anthropicTokenCount',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/tokens/gpt3',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TokenController)),
            ...(fetchMiddlewares<RequestHandler>(TokenController.prototype.gpt3TokenCount)),

            function TokenController_gpt3TokenCount(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    body: {"in":"body","name":"body","required":true,"ref":"TokenBodyParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new TokenController();

              templateService.apiHandler({
                methodName: 'gpt3TokenCount',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/request/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequests)),

            function RequestController_getRequests(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"RequestQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new RequestController();

              templateService.apiHandler({
                methodName: 'getRequests',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/key/generateHash',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GenerateHashController)),
            ...(fetchMiddlewares<RequestHandler>(GenerateHashController.prototype.generateHash)),

            function GenerateHashController_generateHash(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"GenerateHashQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GenerateHashController();

              templateService.apiHandler({
                methodName: 'generateHash',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/dataset/:datasetId/fine-tune',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DatasetController)),
            ...(fetchMiddlewares<RequestHandler>(DatasetController.prototype.datasetFineTune)),

            function DatasetController_datasetFineTune(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                    body: {"in":"body","name":"body","required":true,"ref":"FineTuneBodyParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new DatasetController();

              templateService.apiHandler({
                methodName: 'datasetFineTune',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/fine-tune',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(FineTuneMainController)),
            ...(fetchMiddlewares<RequestHandler>(FineTuneMainController.prototype.fineTune)),

            function FineTuneMainController_fineTune(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    body: {"in":"body","name":"body","required":true,"ref":"FineTuneBody"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new FineTuneMainController();

              templateService.apiHandler({
                methodName: 'fineTune',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/fine-tune/:jobId/stats',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(FineTuneMainController)),
            ...(fetchMiddlewares<RequestHandler>(FineTuneMainController.prototype.fineTuneJobStats)),

            function FineTuneMainController_fineTuneJobStats(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    jobId: {"in":"path","name":"jobId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new FineTuneMainController();

              templateService.apiHandler({
                methodName: 'fineTuneJobStats',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
