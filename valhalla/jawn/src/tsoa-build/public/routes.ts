/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { WebhookController } from './../../controllers/public/webhookController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { WaitlistController } from './../../controllers/public/waitlistController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { VaultController } from './../../controllers/public/vaultController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserController } from './../../controllers/public/userController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EvaluatorController } from './../../controllers/public/evaluatorController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { Prompt2025Controller } from './../../controllers/public/prompt2025Controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { RequestController } from './../../controllers/public/requestController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PromptController } from './../../controllers/public/promptController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ExperimentV2Controller } from './../../controllers/public/experimentV2Controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { StripeController } from './../../controllers/public/stripeController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TraceController } from './../../controllers/public/traceController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SessionController } from './../../controllers/public/sessionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { StatusController } from './../../controllers/public/providerStatusController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PropertyController } from './../../controllers/public/propertyController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PlaygroundController } from './../../controllers/public/playgroundController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PiPublicController } from './../../controllers/public/piPublicController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PiController } from './../../controllers/public/piController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ModelRegistryController } from './../../controllers/public/modelRegistryController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ModelComparisonController } from './../../controllers/public/modelComparisonController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ModelController } from './../../controllers/public/modelController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LLMSecurityController } from './../../controllers/public/llmSecurityController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { IntegrationController } from './../../controllers/public/integrationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HeliconeSqlController } from './../../controllers/public/heliconeSqlController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ExperimentController } from './../../controllers/public/experimentController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ExperimentDatasetController } from './../../controllers/public/experimentDatasetController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HeliconeDatasetController } from './../../controllers/public/heliconeDatasetController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GatewayController } from './../../controllers/public/gatewayController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EvalController } from './../../controllers/public/evalController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DataIsBeautifulRouter } from './../../controllers/public/dataIsBeautifulController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DashboardController } from './../../controllers/public/dashboardController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CustomerController } from './../../controllers/public/customerController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ApiKeyController } from './../../controllers/public/apiKeyController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AlertBannerController } from './../../controllers/public/alertBannerController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AgentController } from './../../controllers/public/agentController';
import { expressAuthentication } from './../../authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "ResultSuccess_unknown_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"any","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultError_unknown_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"enum","enums":[null],"required":true},
            "error": {"dataType":"any","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WebhookData": {
        "dataType": "refObject",
        "properties": {
            "destination": {"dataType":"string","required":true},
            "config": {"ref":"Record_string.any_","required":true},
            "includeData": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__id-string--created_at-string--destination-string--version-string--config-string--hmac_key-string_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"hmac_key":{"dataType":"string","required":true},"config":{"dataType":"string","required":true},"version":{"dataType":"string","required":true},"destination":{"dataType":"string","required":true},"created_at":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultError_string_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"enum","enums":[null],"required":true},
            "error": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__id-string--created_at-string--destination-string--version-string--config-string--hmac_key-string_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__id-string--created_at-string--destination-string--version-string--config-string--hmac_key-string_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_null_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"enum","enums":[null],"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_null.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_null_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultError_any_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"enum","enums":[null],"required":true},
            "error": {"dataType":"any","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__id-string__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"dataType":"string","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__id-string_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__id-string__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AddVaultKeyParams": {
        "dataType": "refObject",
        "properties": {
            "key": {"dataType":"string","required":true},
            "provider": {"dataType":"string","required":true},
            "name": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DecryptedProviderKey": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"provider_secret_key":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"provider_key_name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"provider_name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"provider_key":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"org_id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_DecryptedProviderKey-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"DecryptedProviderKey"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_DecryptedProviderKey-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_DecryptedProviderKey-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_DecryptedProviderKey_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"DecryptedProviderKey","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_DecryptedProviderKey.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_DecryptedProviderKey_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HistogramRow": {
        "dataType": "refObject",
        "properties": {
            "range_start": {"dataType":"string","required":true},
            "range_end": {"dataType":"string","required":true},
            "value": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__request_count-HistogramRow-Array--user_cost-HistogramRow-Array__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"user_cost":{"dataType":"array","array":{"dataType":"refObject","ref":"HistogramRow"},"required":true},"request_count":{"dataType":"array","array":{"dataType":"refObject","ref":"HistogramRow"},"required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__request_count-HistogramRow-Array--user_cost-HistogramRow-Array_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__request_count-HistogramRow-Array--user_cost-HistogramRow-Array__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TextOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"not-equals":{"dataType":"string"},"equals":{"dataType":"string"},"like":{"dataType":"string"},"ilike":{"dataType":"string"},"contains":{"dataType":"string"},"not-contains":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_NumberOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"not-equals":{"dataType":"double"},"equals":{"dataType":"double"},"gte":{"dataType":"double"},"lte":{"dataType":"double"},"lt":{"dataType":"double"},"gt":{"dataType":"double"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TimestampOperatorsTyped_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"equals":{"dataType":"datetime"},"gte":{"dataType":"datetime"},"lte":{"dataType":"datetime"},"lt":{"dataType":"datetime"},"gt":{"dataType":"datetime"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_UserViewToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"user_user_id":{"ref":"Partial_TextOperators_"},"user_active_for":{"ref":"Partial_NumberOperators_"},"user_first_active":{"ref":"Partial_TimestampOperatorsTyped_"},"user_last_active":{"ref":"Partial_TimestampOperatorsTyped_"},"user_total_requests":{"ref":"Partial_NumberOperators_"},"user_average_requests_per_day_active":{"ref":"Partial_NumberOperators_"},"user_average_tokens_per_request":{"ref":"Partial_NumberOperators_"},"user_total_completion_tokens":{"ref":"Partial_NumberOperators_"},"user_total_prompt_tokens":{"ref":"Partial_NumberOperators_"},"user_cost":{"ref":"Partial_NumberOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_BooleanOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"equals":{"dataType":"boolean"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_VectorOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"contains":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_RequestResponseRMTToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"country_code":{"ref":"Partial_TextOperators_"},"latency":{"ref":"Partial_NumberOperators_"},"cost":{"ref":"Partial_NumberOperators_"},"provider":{"ref":"Partial_TextOperators_"},"time_to_first_token":{"ref":"Partial_NumberOperators_"},"status":{"ref":"Partial_NumberOperators_"},"request_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"response_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"model":{"ref":"Partial_TextOperators_"},"user_id":{"ref":"Partial_TextOperators_"},"organization_id":{"ref":"Partial_TextOperators_"},"node_id":{"ref":"Partial_TextOperators_"},"job_id":{"ref":"Partial_TextOperators_"},"threat":{"ref":"Partial_BooleanOperators_"},"request_id":{"ref":"Partial_TextOperators_"},"prompt_tokens":{"ref":"Partial_NumberOperators_"},"completion_tokens":{"ref":"Partial_NumberOperators_"},"prompt_cache_read_tokens":{"ref":"Partial_NumberOperators_"},"prompt_cache_write_tokens":{"ref":"Partial_NumberOperators_"},"total_tokens":{"ref":"Partial_NumberOperators_"},"target_url":{"ref":"Partial_TextOperators_"},"properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"search_properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"scores":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"scores_column":{"ref":"Partial_TextOperators_"},"request_body":{"ref":"Partial_VectorOperators_"},"response_body":{"ref":"Partial_VectorOperators_"},"cache_enabled":{"ref":"Partial_BooleanOperators_"},"cache_reference_id":{"ref":"Partial_TextOperators_"},"cached":{"ref":"Partial_BooleanOperators_"},"assets":{"ref":"Partial_TextOperators_"},"helicone-score-feedback":{"ref":"Partial_BooleanOperators_"},"prompt_id":{"ref":"Partial_TextOperators_"},"prompt_version":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.users_view-or-request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"users_view":{"ref":"Partial_UserViewToOperators_"},"request_response_rmt":{"ref":"Partial_RequestResponseRMTToOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeafSubset_users_view-or-request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_FilterLeaf.users_view-or-request_response_rmt_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_users_view-or-request_response_rmt_"},{"ref":"UserFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserFilterBranch": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"right":{"ref":"UserFilterNode","required":true},"operator":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["or"]},{"dataType":"enum","enums":["and"]}],"required":true},"left":{"ref":"UserFilterNode","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PSize": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["p50"]},{"dataType":"enum","enums":["p75"]},{"dataType":"enum","enums":["p95"]},{"dataType":"enum","enums":["p99"]},{"dataType":"enum","enums":["p99.9"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserMetricsResult": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "user_id": {"dataType":"string","required":true},
            "active_for": {"dataType":"double","required":true},
            "first_active": {"dataType":"string","required":true},
            "last_active": {"dataType":"string","required":true},
            "total_requests": {"dataType":"double","required":true},
            "average_requests_per_day_active": {"dataType":"double","required":true},
            "average_tokens_per_request": {"dataType":"double","required":true},
            "total_completion_tokens": {"dataType":"double","required":true},
            "total_prompt_tokens": {"dataType":"double","required":true},
            "cost": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__users-UserMetricsResult-Array--count-number--hasUsers-boolean__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"hasUsers":{"dataType":"boolean","required":true},"count":{"dataType":"double","required":true},"users":{"dataType":"array","array":{"dataType":"refObject","ref":"UserMetricsResult"},"required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__users-UserMetricsResult-Array--count-number--hasUsers-boolean_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__users-UserMetricsResult-Array--count-number--hasUsers-boolean__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortDirection": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortLeafUsers": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"ref":"SortDirection"},"user_id":{"ref":"SortDirection"},"active_for":{"ref":"SortDirection"},"first_active":{"ref":"SortDirection"},"last_active":{"ref":"SortDirection"},"total_requests":{"ref":"SortDirection"},"average_requests_per_day_active":{"ref":"SortDirection"},"average_tokens_per_request":{"ref":"SortDirection"},"total_prompt_tokens":{"ref":"SortDirection"},"total_completion_tokens":{"ref":"SortDirection"},"cost":{"ref":"SortDirection"},"rate_limited_count":{"ref":"SortDirection"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserMetricsQueryParams": {
        "dataType": "refObject",
        "properties": {
            "filter": {"ref":"UserFilterNode","required":true},
            "offset": {"dataType":"double","required":true},
            "limit": {"dataType":"double","required":true},
            "timeFilter": {"dataType":"nestedObjectLiteral","nestedProperties":{"endTimeUnixSeconds":{"dataType":"double","required":true},"startTimeUnixSeconds":{"dataType":"double","required":true}}},
            "timeZoneDifferenceMinutes": {"dataType":"double"},
            "sort": {"ref":"SortLeafUsers"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__count-number--prompt_tokens-number--completion_tokens-number--user_id-string--cost-number_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"cost":{"dataType":"double","required":true},"user_id":{"dataType":"string","required":true},"completion_tokens":{"dataType":"double","required":true},"prompt_tokens":{"dataType":"double","required":true},"count":{"dataType":"double","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__count-number--prompt_tokens-number--completion_tokens-number--user_id-string--cost-number_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__count-number--prompt_tokens-number--completion_tokens-number--user_id-string--cost-number_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserQueryParams": {
        "dataType": "refObject",
        "properties": {
            "userIds": {"dataType":"array","array":{"dataType":"string"}},
            "timeFilter": {"dataType":"nestedObjectLiteral","nestedProperties":{"endTimeUnixSeconds":{"dataType":"double","required":true},"startTimeUnixSeconds":{"dataType":"double","required":true}}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EvaluatorResult": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
            "scoring_type": {"dataType":"string","required":true},
            "llm_template": {"dataType":"any","required":true},
            "organization_id": {"dataType":"string","required":true},
            "updated_at": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "code_template": {"dataType":"any","required":true},
            "last_mile_config": {"dataType":"any","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_EvaluatorResult_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"EvaluatorResult","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_EvaluatorResult.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_EvaluatorResult_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateEvaluatorParams": {
        "dataType": "refObject",
        "properties": {
            "scoring_type": {"dataType":"string","required":true},
            "llm_template": {"dataType":"any"},
            "name": {"dataType":"string","required":true},
            "code_template": {"dataType":"any"},
            "last_mile_config": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_EvaluatorResult-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"EvaluatorResult"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_EvaluatorResult-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_EvaluatorResult-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateEvaluatorParams": {
        "dataType": "refObject",
        "properties": {
            "scoring_type": {"dataType":"string"},
            "llm_template": {"dataType":"any"},
            "code_template": {"dataType":"any"},
            "name": {"dataType":"string"},
            "last_mile_config": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EvaluatorExperiment": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"experiment_name":{"dataType":"string","required":true},"experiment_created_at":{"dataType":"string","required":true},"experiment_id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_EvaluatorExperiment-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"EvaluatorExperiment"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_EvaluatorExperiment-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_EvaluatorExperiment-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OnlineEvaluatorByEvaluatorId": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"config":{"dataType":"any","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_OnlineEvaluatorByEvaluatorId-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"OnlineEvaluatorByEvaluatorId"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_OnlineEvaluatorByEvaluatorId-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_OnlineEvaluatorByEvaluatorId-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateOnlineEvaluatorParams": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"config":{"ref":"Record_string.any_","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__output-string--traces-string-Array--statusCode_63_-number__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"statusCode":{"dataType":"double"},"traces":{"dataType":"array","array":{"dataType":"string"},"required":true},"output":{"dataType":"string","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__output-string--traces-string-Array--statusCode_63_-number_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__output-string--traces-string-Array--statusCode_63_-number__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"string"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TestInput": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"promptTemplate":{"dataType":"string"},"inputs":{"dataType":"nestedObjectLiteral","nestedProperties":{"autoInputs":{"ref":"Record_string.string_"},"inputs":{"ref":"Record_string.string_","required":true}},"required":true},"outputBody":{"dataType":"string","required":true},"inputBody":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EvaluatorScore": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"score":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"boolean"}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_EvaluatorScore_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"EvaluatorScore","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_EvaluatorScore.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_EvaluatorScore_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EvaluatorScoreResult": {
        "dataType": "refAlias",
        "type": {"ref":"Result_EvaluatorScore.string_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EvaluatorConfig": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"evaluator_code_template":{"dataType":"string"},"evaluator_llm_template":{"dataType":"string"},"evaluator_scoring_type":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__score-number--input-string--output-string--ground_truth_63_-string__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"ground_truth":{"dataType":"string"},"output":{"dataType":"string","required":true},"input":{"dataType":"string","required":true},"score":{"dataType":"double","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__score-number--input-string--output-string--ground_truth_63_-string_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__score-number--input-string--output-string--ground_truth_63_-string__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DataEntry": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"_type":{"dataType":"enum","enums":["system-prompt"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"inputKey":{"dataType":"string","required":true},"_type":{"dataType":"enum","enums":["prompt-input"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"content":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["jsonify"]},{"dataType":"enum","enums":["message"]}],"required":true},"_type":{"dataType":"enum","enums":["input-body"],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"content":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["jsonify"]},{"dataType":"enum","enums":["message"]}],"required":true},"_type":{"dataType":"enum","enums":["output-body"],"required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BaseLastMileConfigForm": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"output":{"ref":"DataEntry","required":true},"input":{"ref":"DataEntry","required":true},"name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LastMileConfigForm": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"BaseLastMileConfigForm"},{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"_type":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["relevance"]},{"dataType":"enum","enums":["context_relevance"]}],"required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"groundTruth":{"ref":"DataEntry","required":true},"_type":{"dataType":"enum","enums":["faithfulness"],"required":true}}}]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EvaluatorStats": {
        "dataType": "refObject",
        "properties": {
            "averageScore": {"dataType":"double","required":true},
            "totalUses": {"dataType":"double","required":true},
            "recentTrend": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["up"]},{"dataType":"enum","enums":["down"]},{"dataType":"enum","enums":["stable"]}],"required":true},
            "scoreDistribution": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"count":{"dataType":"double","required":true},"range":{"dataType":"string","required":true}}},"required":true},
            "timeSeriesData": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"double","required":true},"date":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_EvaluatorStats_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"EvaluatorStats","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_EvaluatorStats.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_EvaluatorStats_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Prompt2025": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "tags": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Prompt2025_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"Prompt2025","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Prompt2025.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Prompt2025_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Prompt2025Input": {
        "dataType": "refObject",
        "properties": {
            "request_id": {"dataType":"string","required":true},
            "version_id": {"dataType":"string","required":true},
            "inputs": {"ref":"Record_string.any_","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Prompt2025Input_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"Prompt2025Input","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Prompt2025Input.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Prompt2025Input_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_string-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_string-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_string-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptCreateResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "versionId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_PromptCreateResponse_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"PromptCreateResponse","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_PromptCreateResponse.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_PromptCreateResponse_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.number_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"double"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OpenAIChatRequest": {
        "dataType": "refObject",
        "properties": {
            "model": {"dataType":"string"},
            "messages": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"tool_calls":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"type":{"dataType":"enum","enums":["function"],"required":true},"function":{"dataType":"nestedObjectLiteral","nestedProperties":{"arguments":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}},"required":true},"id":{"dataType":"string","required":true}}}},"tool_call_id":{"dataType":"string"},"name":{"dataType":"string"},"content":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"image_url":{"dataType":"nestedObjectLiteral","nestedProperties":{"url":{"dataType":"string","required":true}}},"text":{"dataType":"string"},"type":{"dataType":"string","required":true}}}},{"dataType":"enum","enums":[null]}],"required":true},"role":{"dataType":"string","required":true}}}},
            "temperature": {"dataType":"double"},
            "top_p": {"dataType":"double"},
            "max_tokens": {"dataType":"double"},
            "max_completion_tokens": {"dataType":"double"},
            "stream": {"dataType":"boolean"},
            "stop": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"string"}]},
            "tools": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"function":{"dataType":"nestedObjectLiteral","nestedProperties":{"parameters":{"ref":"Record_string.any_","required":true},"description":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}},"required":true},"type":{"dataType":"enum","enums":["function"],"required":true}}}},
            "tool_choice": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["none"]},{"dataType":"enum","enums":["auto"]},{"dataType":"enum","enums":["required"]},{"dataType":"nestedObjectLiteral","nestedProperties":{"function":{"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true},"type":{"dataType":"enum","enums":["function"],"required":true}}},"type":{"dataType":"string","required":true}}}]},
            "parallel_tool_calls": {"dataType":"boolean"},
            "reasoning_effort": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["minimal"]},{"dataType":"enum","enums":["low"]},{"dataType":"enum","enums":["medium"]},{"dataType":"enum","enums":["high"]}]},
            "verbosity": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["low"]},{"dataType":"enum","enums":["medium"]},{"dataType":"enum","enums":["high"]}]},
            "frequency_penalty": {"dataType":"double"},
            "presence_penalty": {"dataType":"double"},
            "logit_bias": {"ref":"Record_string.number_"},
            "logprobs": {"dataType":"boolean"},
            "top_logprobs": {"dataType":"double"},
            "n": {"dataType":"double"},
            "modalities": {"dataType":"array","array":{"dataType":"string"}},
            "prediction": {"dataType":"any"},
            "audio": {"dataType":"any"},
            "response_format": {"dataType":"nestedObjectLiteral","nestedProperties":{"json_schema":{"dataType":"any"},"type":{"dataType":"string","required":true}}},
            "seed": {"dataType":"double"},
            "service_tier": {"dataType":"string"},
            "store": {"dataType":"boolean"},
            "stream_options": {"dataType":"any"},
            "metadata": {"ref":"Record_string.string_"},
            "user": {"dataType":"string"},
            "function_call": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true}}}]},
            "functions": {"dataType":"array","array":{"dataType":"any"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_number_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"double","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_number.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_number_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Prompt2025-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"Prompt2025"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Prompt2025-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Prompt2025-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Prompt2025Version": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "prompt_id": {"dataType":"string","required":true},
            "major_version": {"dataType":"double","required":true},
            "minor_version": {"dataType":"double","required":true},
            "commit_message": {"dataType":"string","required":true},
            "environment": {"dataType":"string"},
            "created_at": {"dataType":"string","required":true},
            "s3_url": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Prompt2025Version_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"Prompt2025Version","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Prompt2025Version.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Prompt2025Version_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Prompt2025Version-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"Prompt2025Version"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Prompt2025Version-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Prompt2025Version-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptVersionCounts": {
        "dataType": "refObject",
        "properties": {
            "totalVersions": {"dataType":"double","required":true},
            "majorVersions": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_PromptVersionCounts_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"PromptVersionCounts","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_PromptVersionCounts.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_PromptVersionCounts_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_ResponseTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"body_tokens":{"ref":"Partial_NumberOperators_"},"body_model":{"ref":"Partial_TextOperators_"},"body_completion":{"ref":"Partial_TextOperators_"},"status":{"ref":"Partial_NumberOperators_"},"model":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TimestampOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"equals":{"dataType":"string"},"gte":{"dataType":"string"},"lte":{"dataType":"string"},"lt":{"dataType":"string"},"gt":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_RequestTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"prompt":{"ref":"Partial_TextOperators_"},"created_at":{"ref":"Partial_TimestampOperators_"},"user_id":{"ref":"Partial_TextOperators_"},"auth_hash":{"ref":"Partial_TextOperators_"},"org_id":{"ref":"Partial_TextOperators_"},"id":{"ref":"Partial_TextOperators_"},"node_id":{"ref":"Partial_TextOperators_"},"model":{"ref":"Partial_TextOperators_"},"modelOverride":{"ref":"Partial_TextOperators_"},"path":{"ref":"Partial_TextOperators_"},"country_code":{"ref":"Partial_TextOperators_"},"prompt_id":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_FeedbackTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"ref":"Partial_NumberOperators_"},"created_at":{"ref":"Partial_TimestampOperators_"},"rating":{"ref":"Partial_BooleanOperators_"},"response_id":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_SessionsRequestResponseRMTToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"session_session_id":{"ref":"Partial_TextOperators_"},"session_session_name":{"ref":"Partial_TextOperators_"},"session_total_cost":{"ref":"Partial_NumberOperators_"},"session_total_tokens":{"ref":"Partial_NumberOperators_"},"session_prompt_tokens":{"ref":"Partial_NumberOperators_"},"session_completion_tokens":{"ref":"Partial_NumberOperators_"},"session_total_requests":{"ref":"Partial_NumberOperators_"},"session_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"session_latest_request_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"session_tag":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.feedback-or-request-or-response-or-properties-or-values-or-request_response_rmt-or-sessions_request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"request_response_rmt":{"ref":"Partial_RequestResponseRMTToOperators_"},"response":{"ref":"Partial_ResponseTableToOperators_"},"request":{"ref":"Partial_RequestTableToOperators_"},"feedback":{"ref":"Partial_FeedbackTableToOperators_"},"sessions_request_response_rmt":{"ref":"Partial_SessionsRequestResponseRMTToOperators_"},"properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"values":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeafSubset_feedback-or-request-or-response-or-properties-or-values-or-request_response_rmt-or-sessions_request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_FilterLeaf.feedback-or-request-or-response-or-properties-or-values-or-request_response_rmt-or-sessions_request_response_rmt_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_feedback-or-request-or-response-or-properties-or-values-or-request_response_rmt-or-sessions_request_response_rmt_"},{"ref":"RequestFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestFilterBranch": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"right":{"ref":"RequestFilterNode","required":true},"operator":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["or"]},{"dataType":"enum","enums":["and"]}],"required":true},"left":{"ref":"RequestFilterNode","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortLeafRequest": {
        "dataType": "refObject",
        "properties": {
            "random": {"dataType":"enum","enums":[true]},
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
            "cost": {"ref":"SortDirection"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestQueryParams": {
        "dataType": "refObject",
        "properties": {
            "filter": {"ref":"RequestFilterNode","required":true},
            "offset": {"dataType":"double"},
            "limit": {"dataType":"double"},
            "sort": {"ref":"SortLeafRequest"},
            "isCached": {"dataType":"boolean"},
            "includeInputs": {"dataType":"boolean"},
            "isPartOfExperiment": {"dataType":"boolean"},
            "isScored": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProviderName": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["OPENAI"]},{"dataType":"enum","enums":["ANTHROPIC"]},{"dataType":"enum","enums":["AZURE"]},{"dataType":"enum","enums":["LOCAL"]},{"dataType":"enum","enums":["HELICONE"]},{"dataType":"enum","enums":["AMDBARTEK"]},{"dataType":"enum","enums":["ANYSCALE"]},{"dataType":"enum","enums":["CLOUDFLARE"]},{"dataType":"enum","enums":["2YFV"]},{"dataType":"enum","enums":["TOGETHER"]},{"dataType":"enum","enums":["LEMONFOX"]},{"dataType":"enum","enums":["FIREWORKS"]},{"dataType":"enum","enums":["PERPLEXITY"]},{"dataType":"enum","enums":["GOOGLE"]},{"dataType":"enum","enums":["OPENROUTER"]},{"dataType":"enum","enums":["WISDOMINANUTSHELL"]},{"dataType":"enum","enums":["GROQ"]},{"dataType":"enum","enums":["COHERE"]},{"dataType":"enum","enums":["MISTRAL"]},{"dataType":"enum","enums":["DEEPINFRA"]},{"dataType":"enum","enums":["QSTASH"]},{"dataType":"enum","enums":["FIRECRAWL"]},{"dataType":"enum","enums":["AWS"]},{"dataType":"enum","enums":["BEDROCK"]},{"dataType":"enum","enums":["DEEPSEEK"]},{"dataType":"enum","enums":["X"]},{"dataType":"enum","enums":["AVIAN"]},{"dataType":"enum","enums":["NEBIUS"]},{"dataType":"enum","enums":["NOVITA"]},{"dataType":"enum","enums":["OPENPIPE"]},{"dataType":"enum","enums":["CHUTES"]},{"dataType":"enum","enums":["LLAMA"]},{"dataType":"enum","enums":["NVIDIA"]},{"dataType":"enum","enums":["VERCEL"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Provider": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ProviderName"},{"dataType":"enum","enums":["CUSTOM"]}],"validators":{}},
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
            "id": {"dataType":"string"},
            "name": {"dataType":"string","required":true},
            "arguments": {"ref":"Record_string.any_","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Message": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"ending_event_id":{"dataType":"string"},"trigger_event_id":{"dataType":"string"},"start_timestamp":{"dataType":"string"},"reasoning":{"dataType":"string"},"deleted":{"dataType":"boolean"},"contentArray":{"dataType":"array","array":{"dataType":"refAlias","ref":"Message"}},"idx":{"dataType":"double"},"detail":{"dataType":"string"},"filename":{"dataType":"string"},"file_id":{"dataType":"string"},"file_data":{"dataType":"string"},"type":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["input_image"]},{"dataType":"enum","enums":["input_text"]},{"dataType":"enum","enums":["input_file"]}]},"audio_data":{"dataType":"string"},"image_url":{"dataType":"string"},"timestamp":{"dataType":"string"},"tool_call_id":{"dataType":"string"},"tool_calls":{"dataType":"array","array":{"dataType":"refObject","ref":"FunctionCall"}},"mime_type":{"dataType":"string"},"content":{"dataType":"string"},"name":{"dataType":"string"},"instruction":{"dataType":"string"},"role":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["assistant"]},{"dataType":"enum","enums":["system"]},{"dataType":"enum","enums":["developer"]}]},"id":{"dataType":"string"},"_type":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["functionCall"]},{"dataType":"enum","enums":["function"]},{"dataType":"enum","enums":["image"]},{"dataType":"enum","enums":["file"]},{"dataType":"enum","enums":["message"]},{"dataType":"enum","enums":["autoInput"]},{"dataType":"enum","enums":["contentArray"]},{"dataType":"enum","enums":["audio"]}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Tool": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "parameters": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HeliconeEventTool": {
        "dataType": "refObject",
        "properties": {
            "_type": {"dataType":"enum","enums":["tool"],"required":true},
            "toolName": {"dataType":"string","required":true},
            "input": {"dataType":"any","required":true},
        },
        "additionalProperties": {"dataType":"any"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HeliconeEventVectorDB": {
        "dataType": "refObject",
        "properties": {
            "_type": {"dataType":"enum","enums":["vector_db"],"required":true},
            "operation": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["search"]},{"dataType":"enum","enums":["insert"]},{"dataType":"enum","enums":["delete"]},{"dataType":"enum","enums":["update"]}],"required":true},
            "text": {"dataType":"string"},
            "vector": {"dataType":"array","array":{"dataType":"double"}},
            "topK": {"dataType":"double"},
            "filter": {"dataType":"object"},
            "databaseName": {"dataType":"string"},
        },
        "additionalProperties": {"dataType":"any"},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMRequestBody": {
        "dataType": "refObject",
        "properties": {
            "llm_type": {"ref":"LlmType"},
            "provider": {"dataType":"string"},
            "model": {"dataType":"string"},
            "messages": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refAlias","ref":"Message"}},{"dataType":"enum","enums":[null]}]},
            "prompt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "instructions": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "max_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "temperature": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "top_p": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "seed": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "stream": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}]},
            "presence_penalty": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "frequency_penalty": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "stop": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "reasoning_effort": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["minimal"]},{"dataType":"enum","enums":["low"]},{"dataType":"enum","enums":["medium"]},{"dataType":"enum","enums":["high"]},{"dataType":"enum","enums":[null]}]},
            "verbosity": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["low"]},{"dataType":"enum","enums":["medium"]},{"dataType":"enum","enums":["high"]},{"dataType":"enum","enums":[null]}]},
            "tools": {"dataType":"array","array":{"dataType":"refObject","ref":"Tool"}},
            "parallel_tool_calls": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}]},
            "tool_choice": {"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string"},"type":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["none"]},{"dataType":"enum","enums":["auto"]},{"dataType":"enum","enums":["any"]},{"dataType":"enum","enums":["tool"]}],"required":true}}},
            "response_format": {"dataType":"nestedObjectLiteral","nestedProperties":{"json_schema":{"dataType":"any"},"type":{"dataType":"string","required":true}}},
            "toolDetails": {"ref":"HeliconeEventTool"},
            "vectorDBDetails": {"ref":"HeliconeEventVectorDB"},
            "input": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"array","array":{"dataType":"string"}}]},
            "n": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "size": {"dataType":"string"},
            "quality": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Response": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"contentArray":{"dataType":"array","array":{"dataType":"refAlias","ref":"Response"}},"detail":{"dataType":"string"},"filename":{"dataType":"string"},"file_id":{"dataType":"string"},"file_data":{"dataType":"string"},"idx":{"dataType":"double"},"audio_data":{"dataType":"string"},"image_url":{"dataType":"string"},"timestamp":{"dataType":"string"},"tool_call_id":{"dataType":"string"},"tool_calls":{"dataType":"array","array":{"dataType":"refObject","ref":"FunctionCall"}},"text":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"undefined"}]},"type":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["input_image"]},{"dataType":"enum","enums":["input_text"]},{"dataType":"enum","enums":["input_file"]}],"required":true},"name":{"dataType":"string"},"role":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["assistant"]},{"dataType":"enum","enums":["system"]},{"dataType":"enum","enums":["developer"]}],"required":true},"id":{"dataType":"string"},"_type":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["functionCall"]},{"dataType":"enum","enums":["function"]},{"dataType":"enum","enums":["image"]},{"dataType":"enum","enums":["text"]},{"dataType":"enum","enums":["file"]},{"dataType":"enum","enums":["contentArray"]}],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMResponseBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"vectorDBDetailsResponse":{"dataType":"nestedObjectLiteral","nestedProperties":{"_type":{"dataType":"enum","enums":["vector_db"],"required":true},"metadata":{"dataType":"nestedObjectLiteral","nestedProperties":{"timestamp":{"dataType":"string","required":true},"destination_parsed":{"dataType":"boolean"},"destination":{"dataType":"string"}},"required":true},"actualSimilarity":{"dataType":"double"},"similarityThreshold":{"dataType":"double"},"message":{"dataType":"string","required":true},"status":{"dataType":"string","required":true}}},"toolDetailsResponse":{"dataType":"nestedObjectLiteral","nestedProperties":{"toolName":{"dataType":"string","required":true},"_type":{"dataType":"enum","enums":["tool"],"required":true},"metadata":{"dataType":"nestedObjectLiteral","nestedProperties":{"timestamp":{"dataType":"string","required":true}},"required":true},"tips":{"dataType":"array","array":{"dataType":"string"},"required":true},"message":{"dataType":"string","required":true},"status":{"dataType":"string","required":true}}},"error":{"dataType":"nestedObjectLiteral","nestedProperties":{"heliconeMessage":{"dataType":"any","required":true}}},"model":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"instructions":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"responses":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refAlias","ref":"Response"}},{"dataType":"enum","enums":[null]}]},"messages":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refAlias","ref":"Message"}},{"dataType":"enum","enums":[null]}]}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LlmSchema": {
        "dataType": "refObject",
        "properties": {
            "request": {"ref":"LLMRequestBody","required":true},
            "response": {"dataType":"union","subSchemas":[{"ref":"LLMResponseBody"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HeliconeRequest": {
        "dataType": "refObject",
        "properties": {
            "response_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "response_created_at": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "response_body": {"dataType":"any"},
            "response_status": {"dataType":"double","required":true},
            "response_model": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "request_id": {"dataType":"string","required":true},
            "request_created_at": {"dataType":"string","required":true},
            "request_body": {"dataType":"any","required":true},
            "request_path": {"dataType":"string","required":true},
            "request_user_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "request_properties": {"dataType":"union","subSchemas":[{"ref":"Record_string.string_"},{"dataType":"enum","enums":[null]}],"required":true},
            "request_model": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "model_override": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "helicone_user": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "provider": {"ref":"Provider","required":true},
            "delay_ms": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "time_to_first_token": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "total_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "prompt_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "prompt_cache_write_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "prompt_cache_read_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "completion_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "prompt_audio_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "completion_audio_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "cost": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "prompt_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "prompt_version": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "feedback_created_at": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "feedback_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "feedback_rating": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}]},
            "signed_body_url": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "llmSchema": {"dataType":"union","subSchemas":[{"ref":"LlmSchema"},{"dataType":"enum","enums":[null]}],"required":true},
            "country_code": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "asset_ids": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "asset_urls": {"dataType":"union","subSchemas":[{"ref":"Record_string.string_"},{"dataType":"enum","enums":[null]}],"required":true},
            "scores": {"dataType":"union","subSchemas":[{"ref":"Record_string.number_"},{"dataType":"enum","enums":[null]}],"required":true},
            "costUSD": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "properties": {"ref":"Record_string.string_","required":true},
            "assets": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "target_url": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "cache_reference_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "cache_enabled": {"dataType":"boolean","required":true},
            "updated_at": {"dataType":"string"},
            "request_referrer": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_HeliconeRequest-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"HeliconeRequest"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_HeliconeRequest-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_HeliconeRequest-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_HeliconeRequest_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"HeliconeRequest","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_HeliconeRequest.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_HeliconeRequest_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HeliconeRequestAsset": {
        "dataType": "refObject",
        "properties": {
            "assetUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_HeliconeRequestAsset_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"HeliconeRequestAsset","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_HeliconeRequestAsset.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_HeliconeRequestAsset_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.number-or-boolean-or-undefined_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"boolean"}]},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Scores": {
        "dataType": "refAlias",
        "type": {"ref":"Record_string.number-or-boolean-or-undefined_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ScoreRequest": {
        "dataType": "refObject",
        "properties": {
            "scores": {"ref":"Scores","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__hasPrompts-boolean__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"hasPrompts":{"dataType":"boolean","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__hasPrompts-boolean_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__hasPrompts-boolean__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptsResult": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "user_defined_id": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "pretty_name": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
            "major_version": {"dataType":"double","required":true},
            "metadata": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_PromptsResult-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"PromptsResult"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_PromptsResult-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_PromptsResult-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_PromptToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"ref":"Partial_TextOperators_"},"user_defined_id":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.prompt_v2_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"prompt_v2":{"ref":"Partial_PromptToOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeafSubset_prompt_v2_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_FilterLeaf.prompt_v2_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptsFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_prompt_v2_"},{"ref":"PromptsFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptsFilterBranch": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"right":{"ref":"PromptsFilterNode","required":true},"operator":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["or"]},{"dataType":"enum","enums":["and"]}],"required":true},"left":{"ref":"PromptsFilterNode","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptsQueryParams": {
        "dataType": "refObject",
        "properties": {
            "filter": {"ref":"PromptsFilterNode","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptResult": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "user_defined_id": {"dataType":"string","required":true},
            "description": {"dataType":"string","required":true},
            "pretty_name": {"dataType":"string","required":true},
            "major_version": {"dataType":"double","required":true},
            "latest_version_id": {"dataType":"string","required":true},
            "latest_model_used": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
            "last_used": {"dataType":"string","required":true},
            "versions": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "metadata": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_PromptResult_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"PromptResult","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_PromptResult.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_PromptResult_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptQueryParams": {
        "dataType": "refObject",
        "properties": {
            "timeFilter": {"dataType":"nestedObjectLiteral","nestedProperties":{"end":{"dataType":"string","required":true},"start":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreatePromptResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "prompt_version_id": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_CreatePromptResponse_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"CreatePromptResponse","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_CreatePromptResponse.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_CreatePromptResponse_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__metadata-Record_string.any___": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"ref":"Record_string.any_","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__metadata-Record_string.any__.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__metadata-Record_string.any___"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptEditSubversionLabelParams": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptEditSubversionTemplateParams": {
        "dataType": "refObject",
        "properties": {
            "heliconeTemplate": {"dataType":"any","required":true},
            "experimentId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptVersionResult": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "minor_version": {"dataType":"double","required":true},
            "major_version": {"dataType":"double","required":true},
            "prompt_v2": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "helicone_template": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
            "metadata": {"ref":"Record_string.any_","required":true},
            "parent_prompt_version": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "experiment_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "updated_at": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_PromptVersionResult_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"PromptVersionResult","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_PromptVersionResult.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_PromptVersionResult_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptCreateSubversionParams": {
        "dataType": "refObject",
        "properties": {
            "newHeliconeTemplate": {"dataType":"any","required":true},
            "isMajorVersion": {"dataType":"boolean"},
            "metadata": {"ref":"Record_string.any_"},
            "experimentId": {"dataType":"string"},
            "bumpForMajorPromptVersionId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptInputRecord": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "inputs": {"ref":"Record_string.string_","required":true},
            "dataset_row_id": {"dataType":"string"},
            "source_request": {"dataType":"string","required":true},
            "prompt_version": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
            "response_body": {"dataType":"string"},
            "request_body": {"dataType":"string"},
            "auto_prompt_inputs": {"dataType":"array","array":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_PromptInputRecord-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"PromptInputRecord"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_PromptInputRecord-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_PromptInputRecord-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__id-string--created_at-string--num_hypotheses-number--dataset-string--meta-Record_string.any__-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"meta":{"ref":"Record_string.any_","required":true},"dataset":{"dataType":"string","required":true},"num_hypotheses":{"dataType":"double","required":true},"created_at":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__id-string--created_at-string--num_hypotheses-number--dataset-string--meta-Record_string.any__-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__id-string--created_at-string--num_hypotheses-number--dataset-string--meta-Record_string.any__-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_PromptVersionResult-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"PromptVersionResult"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_PromptVersionResult-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_PromptVersionResult-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_PromptVersionsToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"minor_version":{"ref":"Partial_NumberOperators_"},"major_version":{"ref":"Partial_NumberOperators_"},"id":{"ref":"Partial_TextOperators_"},"prompt_v2":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.prompts_versions_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"prompts_versions":{"ref":"Partial_PromptVersionsToOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeafSubset_prompts_versions_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_FilterLeaf.prompts_versions_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptVersionsFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_prompts_versions_"},{"ref":"PromptVersionsFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptVersionsFilterBranch": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"right":{"ref":"PromptVersionsFilterNode","required":true},"operator":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["or"]},{"dataType":"enum","enums":["and"]}],"required":true},"left":{"ref":"PromptVersionsFilterNode","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptVersionsQueryParams": {
        "dataType": "refObject",
        "properties": {
            "filter": {"ref":"PromptVersionsFilterNode"},
            "includeExperimentVersions": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptVersionResultCompiled": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "minor_version": {"dataType":"double","required":true},
            "major_version": {"dataType":"double","required":true},
            "prompt_v2": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "prompt_compiled": {"dataType":"any","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_PromptVersionResultCompiled_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"PromptVersionResultCompiled","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_PromptVersionResultCompiled.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_PromptVersionResultCompiled_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptVersiosQueryParamsCompiled": {
        "dataType": "refObject",
        "properties": {
            "filter": {"ref":"PromptVersionsFilterNode"},
            "includeExperimentVersions": {"dataType":"boolean"},
            "inputs": {"ref":"Record_string.string_","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PromptVersionResultFilled": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "minor_version": {"dataType":"double","required":true},
            "major_version": {"dataType":"double","required":true},
            "prompt_v2": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "filled_helicone_template": {"dataType":"any","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_PromptVersionResultFilled_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"PromptVersionResultFilled","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_PromptVersionResultFilled.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_PromptVersionResultFilled_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__experimentId-string__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"experimentId":{"dataType":"string","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__experimentId-string_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__experimentId-string__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentV2": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "original_prompt_version": {"dataType":"string","required":true},
            "copied_original_prompt_version": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "input_keys": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "created_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ExperimentV2-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ExperimentV2"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ExperimentV2-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ExperimentV2-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentV2Output": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "request_id": {"dataType":"string","required":true},
            "is_original": {"dataType":"boolean","required":true},
            "prompt_version_id": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
            "input_record_id": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentV2Row": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "inputs": {"ref":"Record_string.string_","required":true},
            "prompt_version": {"dataType":"string","required":true},
            "requests": {"dataType":"array","array":{"dataType":"refObject","ref":"ExperimentV2Output"},"required":true},
            "auto_prompt_inputs": {"dataType":"array","array":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExtendedExperimentData": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "original_prompt_version": {"dataType":"string","required":true},
            "copied_original_prompt_version": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "input_keys": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "created_at": {"dataType":"string","required":true},
            "rows": {"dataType":"array","array":{"dataType":"refObject","ref":"ExperimentV2Row"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ExtendedExperimentData_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"ExtendedExperimentData","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ExtendedExperimentData.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ExtendedExperimentData_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateNewPromptVersionForExperimentParams": {
        "dataType": "refObject",
        "properties": {
            "newHeliconeTemplate": {"dataType":"any","required":true},
            "isMajorVersion": {"dataType":"boolean"},
            "metadata": {"ref":"Record_string.any_"},
            "experimentId": {"dataType":"string"},
            "bumpForMajorPromptVersionId": {"dataType":"string"},
            "parentPromptVersionId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Json": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"dataType":"enum","enums":[null]},{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"union","subSchemas":[{"ref":"Json"},{"dataType":"undefined"}]}},{"dataType":"array","array":{"dataType":"refAlias","ref":"Json"}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentV2PromptVersion": {
        "dataType": "refObject",
        "properties": {
            "created_at": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "experiment_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "helicone_template": {"dataType":"union","subSchemas":[{"ref":"Json"},{"dataType":"enum","enums":[null]}],"required":true},
            "id": {"dataType":"string","required":true},
            "major_version": {"dataType":"double","required":true},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"Json"},{"dataType":"enum","enums":[null]}],"required":true},
            "minor_version": {"dataType":"double","required":true},
            "model": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "organization": {"dataType":"string","required":true},
            "prompt_v2": {"dataType":"string","required":true},
            "soft_delete": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ExperimentV2PromptVersion-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ExperimentV2PromptVersion"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ExperimentV2PromptVersion-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ExperimentV2PromptVersion-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_string_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"string","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_string.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_string_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_boolean_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"boolean","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_boolean.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_boolean_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ScoreV2": {
        "dataType": "refObject",
        "properties": {
            "valueType": {"dataType":"string","required":true},
            "value": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"datetime"},{"dataType":"string"}],"required":true},
            "max": {"dataType":"double","required":true},
            "min": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.ScoreV2_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"ScoreV2"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Record_string.ScoreV2__": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"Record_string.ScoreV2_","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Record_string.ScoreV2_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Record_string.ScoreV2__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ScoreV2-or-null_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"union","subSchemas":[{"ref":"ScoreV2"},{"dataType":"enum","enums":[null]}],"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ScoreV2-or-null.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ScoreV2-or-null_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpgradeToProRequest": {
        "dataType": "refObject",
        "properties": {
            "addons": {"dataType":"nestedObjectLiteral","nestedProperties":{"evals":{"dataType":"boolean"},"experiments":{"dataType":"boolean"},"prompts":{"dataType":"boolean"},"alerts":{"dataType":"boolean"}}},
            "seats": {"dataType":"double"},
            "ui_mode": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["embedded"]},{"dataType":"enum","enums":["hosted"]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpgradeToTeamBundleRequest": {
        "dataType": "refObject",
        "properties": {
            "ui_mode": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["embedded"]},{"dataType":"enum","enums":["hosted"]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LLMUsage": {
        "dataType": "refObject",
        "properties": {
            "model": {"dataType":"string","required":true},
            "provider": {"dataType":"string","required":true},
            "prompt_tokens": {"dataType":"double","required":true},
            "completion_tokens": {"dataType":"double","required":true},
            "total_count": {"dataType":"double","required":true},
            "amount": {"dataType":"double","required":true},
            "description": {"dataType":"string","required":true},
            "totalCost": {"dataType":"nestedObjectLiteral","nestedProperties":{"prompt_token":{"dataType":"double","required":true},"completion_token":{"dataType":"double","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidationError": {
        "dataType": "refObject",
        "properties": {
            "field": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidationResult": {
        "dataType": "refObject",
        "properties": {
            "isValid": {"dataType":"boolean","required":true},
            "errors": {"dataType":"array","array":{"dataType":"refObject","ref":"ValidationError"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.unknown_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TypedProviderRequest": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
            "json": {"ref":"Record_string.unknown_","required":true},
            "meta": {"ref":"Record_string.string_","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TypedProviderResponse": {
        "dataType": "refObject",
        "properties": {
            "json": {"ref":"Record_string.unknown_"},
            "textBody": {"dataType":"string"},
            "status": {"dataType":"double","required":true},
            "headers": {"ref":"Record_string.string_","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TypedTiming": {
        "dataType": "refObject",
        "properties": {
            "timeToFirstToken": {"dataType":"double"},
            "startTime": {"dataType":"string","required":true},
            "endTime": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TypedAsyncLogModel": {
        "dataType": "refObject",
        "properties": {
            "providerRequest": {"ref":"TypedProviderRequest","required":true},
            "providerResponse": {"ref":"TypedProviderResponse","required":true},
            "timing": {"ref":"TypedTiming"},
            "provider": {"ref":"Provider"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OTELTrace": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"resourceSpans":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"scopeSpans":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"spans":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"droppedLinksCount":{"dataType":"double","required":true},"links":{"dataType":"array","array":{"dataType":"any"},"required":true},"status":{"dataType":"nestedObjectLiteral","nestedProperties":{"code":{"dataType":"double","required":true}},"required":true},"droppedEventsCount":{"dataType":"double","required":true},"events":{"dataType":"array","array":{"dataType":"any"},"required":true},"droppedAttributesCount":{"dataType":"double","required":true},"attributes":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"nestedObjectLiteral","nestedProperties":{"intValue":{"dataType":"double"},"stringValue":{"dataType":"string"}},"required":true},"key":{"dataType":"string","required":true}}},"required":true},"endTimeUnixNano":{"dataType":"string","required":true},"startTimeUnixNano":{"dataType":"string","required":true},"kind":{"dataType":"double","required":true},"name":{"dataType":"string","required":true},"spanId":{"dataType":"string","required":true},"traceId":{"dataType":"string","required":true}}},"required":true},"scope":{"dataType":"nestedObjectLiteral","nestedProperties":{"version":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}},"required":true}}},"required":true},"resource":{"dataType":"nestedObjectLiteral","nestedProperties":{"droppedAttributesCount":{"dataType":"double","required":true},"attributes":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"nestedObjectLiteral","nestedProperties":{"arrayValue":{"dataType":"nestedObjectLiteral","nestedProperties":{"values":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"stringValue":{"dataType":"string","required":true}}},"required":true}}},"intValue":{"dataType":"double"},"stringValue":{"dataType":"string"}},"required":true},"key":{"dataType":"string","required":true}}},"required":true}},"required":true}}},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SessionResult": {
        "dataType": "refObject",
        "properties": {
            "created_at": {"dataType":"string","required":true},
            "latest_request_created_at": {"dataType":"string","required":true},
            "session_id": {"dataType":"string","required":true},
            "session_name": {"dataType":"string","required":true},
            "total_cost": {"dataType":"double","required":true},
            "total_requests": {"dataType":"double","required":true},
            "prompt_tokens": {"dataType":"double","required":true},
            "completion_tokens": {"dataType":"double","required":true},
            "total_tokens": {"dataType":"double","required":true},
            "avg_latency": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_SessionResult-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"SessionResult"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_SessionResult-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_SessionResult-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.request_response_rmt-or-sessions_request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"request_response_rmt":{"ref":"Partial_RequestResponseRMTToOperators_"},"sessions_request_response_rmt":{"ref":"Partial_SessionsRequestResponseRMTToOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeafSubset_request_response_rmt-or-sessions_request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_FilterLeaf.request_response_rmt-or-sessions_request_response_rmt_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SessionFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_request_response_rmt-or-sessions_request_response_rmt_"},{"ref":"SessionFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SessionFilterBranch": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"right":{"ref":"SessionFilterNode","required":true},"operator":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["or"]},{"dataType":"enum","enums":["and"]}],"required":true},"left":{"ref":"SessionFilterNode","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SessionQueryParams": {
        "dataType": "refObject",
        "properties": {
            "search": {"dataType":"string","required":true},
            "timeFilter": {"dataType":"nestedObjectLiteral","nestedProperties":{"endTimeUnixMs":{"dataType":"double","required":true},"startTimeUnixMs":{"dataType":"double","required":true}},"required":true},
            "nameEquals": {"dataType":"string"},
            "timezoneDifference": {"dataType":"double","required":true},
            "filter": {"ref":"SessionFilterNode","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SessionNameResult": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
            "last_used": {"dataType":"string","required":true},
            "first_used": {"dataType":"string","required":true},
            "session_count": {"dataType":"double","required":true},
            "avg_latency": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_SessionNameResult-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"SessionNameResult"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_SessionNameResult-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_SessionNameResult-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TimeFilterMs": {
        "dataType": "refObject",
        "properties": {
            "startTimeUnixMs": {"dataType":"double","required":true},
            "endTimeUnixMs": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SessionNameQueryParams": {
        "dataType": "refObject",
        "properties": {
            "nameContains": {"dataType":"string","required":true},
            "timezoneDifference": {"dataType":"double","required":true},
            "pSize": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["p50"]},{"dataType":"enum","enums":["p75"]},{"dataType":"enum","enums":["p95"]},{"dataType":"enum","enums":["p99"]},{"dataType":"enum","enums":["p99.9"]}]},
            "useInterquartile": {"dataType":"boolean"},
            "timeFilter": {"ref":"TimeFilterMs"},
            "filter": {"ref":"SessionFilterNode"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AverageRow": {
        "dataType": "refObject",
        "properties": {
            "average": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SessionMetrics": {
        "dataType": "refObject",
        "properties": {
            "session_count": {"dataType":"array","array":{"dataType":"refObject","ref":"HistogramRow"},"required":true},
            "session_duration": {"dataType":"array","array":{"dataType":"refObject","ref":"HistogramRow"},"required":true},
            "session_cost": {"dataType":"array","array":{"dataType":"refObject","ref":"HistogramRow"},"required":true},
            "average": {"dataType":"nestedObjectLiteral","nestedProperties":{"session_cost":{"dataType":"array","array":{"dataType":"refObject","ref":"AverageRow"},"required":true},"session_duration":{"dataType":"array","array":{"dataType":"refObject","ref":"AverageRow"},"required":true},"session_count":{"dataType":"array","array":{"dataType":"refObject","ref":"AverageRow"},"required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_SessionMetrics_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"SessionMetrics","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_SessionMetrics.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_SessionMetrics_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SessionMetricsQueryParams": {
        "dataType": "refObject",
        "properties": {
            "nameContains": {"dataType":"string","required":true},
            "timezoneDifference": {"dataType":"double","required":true},
            "pSize": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["p50"]},{"dataType":"enum","enums":["p75"]},{"dataType":"enum","enums":["p95"]},{"dataType":"enum","enums":["p99"]},{"dataType":"enum","enums":["p99.9"]}]},
            "useInterquartile": {"dataType":"boolean"},
            "timeFilter": {"ref":"TimeFilterMs"},
            "filter": {"ref":"SessionFilterNode"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_string-or-null_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_string-or-null.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_string-or-null_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricsData": {
        "dataType": "refObject",
        "properties": {
            "totalRequests": {"dataType":"double","required":true},
            "requestCountPrevious24h": {"dataType":"double","required":true},
            "requestVolumeChange": {"dataType":"double","required":true},
            "errorRate24h": {"dataType":"double","required":true},
            "errorRatePrevious24h": {"dataType":"double","required":true},
            "errorRateChange": {"dataType":"double","required":true},
            "averageLatency": {"dataType":"double","required":true},
            "averageLatencyPerToken": {"dataType":"double","required":true},
            "latencyChange": {"dataType":"double","required":true},
            "latencyPerTokenChange": {"dataType":"double","required":true},
            "recentRequestCount": {"dataType":"double","required":true},
            "recentErrorCount": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TimeSeriesDataPoint": {
        "dataType": "refObject",
        "properties": {
            "timestamp": {"dataType":"datetime","required":true},
            "errorCount": {"dataType":"double","required":true},
            "requestCount": {"dataType":"double","required":true},
            "averageLatency": {"dataType":"double","required":true},
            "averageLatencyPerCompletionToken": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProviderMetrics": {
        "dataType": "refObject",
        "properties": {
            "providerName": {"dataType":"string","required":true},
            "metrics": {"dataType":"intersection","subSchemas":[{"ref":"MetricsData"},{"dataType":"nestedObjectLiteral","nestedProperties":{"timeSeriesData":{"dataType":"array","array":{"dataType":"refObject","ref":"TimeSeriesDataPoint"},"required":true}}}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ProviderMetrics-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ProviderMetrics"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ProviderMetrics-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ProviderMetrics-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ProviderMetrics_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"ProviderMetrics","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ProviderMetrics.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ProviderMetrics_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TimeFrame": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["24h"]},{"dataType":"enum","enums":["7d"]},{"dataType":"enum","enums":["30d"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Property": {
        "dataType": "refObject",
        "properties": {
            "property": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Property-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"Property"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Property-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Property-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__value-string--cost-number_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"cost":{"dataType":"double","required":true},"value":{"dataType":"string","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__value-string--cost-number_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__value-string--cost-number_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TimeFilterRequest": {
        "dataType": "refObject",
        "properties": {
            "timeFilter": {"dataType":"nestedObjectLiteral","nestedProperties":{"end":{"dataType":"string","required":true},"start":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionTokenLogprob.TopLogprob": {
        "dataType": "refObject",
        "properties": {
            "token": {"dataType":"string","required":true},
            "bytes": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"double"}},{"dataType":"enum","enums":[null]}],"required":true},
            "logprob": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionTokenLogprob": {
        "dataType": "refObject",
        "properties": {
            "token": {"dataType":"string","required":true},
            "bytes": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"double"}},{"dataType":"enum","enums":[null]}],"required":true},
            "logprob": {"dataType":"double","required":true},
            "top_logprobs": {"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletionTokenLogprob.TopLogprob"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletion.Choice.Logprobs": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletionTokenLogprob"}},{"dataType":"enum","enums":[null]}],"required":true},
            "refusal": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletionTokenLogprob"}},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessage.Annotation.URLCitation": {
        "dataType": "refObject",
        "properties": {
            "end_index": {"dataType":"double","required":true},
            "start_index": {"dataType":"double","required":true},
            "title": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessage.Annotation": {
        "dataType": "refObject",
        "properties": {
            "type": {"dataType":"enum","enums":["url_citation"],"required":true},
            "url_citation": {"ref":"ChatCompletionMessage.Annotation.URLCitation","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionAudio": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "data": {"dataType":"string","required":true},
            "expires_at": {"dataType":"double","required":true},
            "transcript": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessage.FunctionCall": {
        "dataType": "refObject",
        "properties": {
            "arguments": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessageFunctionToolCall.Function": {
        "dataType": "refObject",
        "properties": {
            "arguments": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessageFunctionToolCall": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "function": {"ref":"ChatCompletionMessageFunctionToolCall.Function","required":true},
            "type": {"dataType":"enum","enums":["function"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessageCustomToolCall.Custom": {
        "dataType": "refObject",
        "properties": {
            "input": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessageCustomToolCall": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "custom": {"ref":"ChatCompletionMessageCustomToolCall.Custom","required":true},
            "type": {"dataType":"enum","enums":["custom"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessageToolCall": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionMessageFunctionToolCall"},{"ref":"ChatCompletionMessageCustomToolCall"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessage": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "refusal": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "role": {"dataType":"enum","enums":["assistant"],"required":true},
            "annotations": {"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletionMessage.Annotation"}},
            "audio": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionAudio"},{"dataType":"enum","enums":[null]}]},
            "function_call": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionMessage.FunctionCall"},{"dataType":"enum","enums":[null]}]},
            "tool_calls": {"dataType":"array","array":{"dataType":"refAlias","ref":"ChatCompletionMessageToolCall"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletion.Choice": {
        "dataType": "refObject",
        "properties": {
            "finish_reason": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["stop"]},{"dataType":"enum","enums":["length"]},{"dataType":"enum","enums":["tool_calls"]},{"dataType":"enum","enums":["content_filter"]},{"dataType":"enum","enums":["function_call"]}],"required":true},
            "index": {"dataType":"double","required":true},
            "logprobs": {"dataType":"union","subSchemas":[{"ref":"ChatCompletion.Choice.Logprobs"},{"dataType":"enum","enums":[null]}],"required":true},
            "message": {"ref":"ChatCompletionMessage","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompletionUsage.CompletionTokensDetails": {
        "dataType": "refObject",
        "properties": {
            "accepted_prediction_tokens": {"dataType":"double"},
            "audio_tokens": {"dataType":"double"},
            "reasoning_tokens": {"dataType":"double"},
            "rejected_prediction_tokens": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompletionUsage.PromptTokensDetails": {
        "dataType": "refObject",
        "properties": {
            "audio_tokens": {"dataType":"double"},
            "cached_tokens": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CompletionUsage": {
        "dataType": "refObject",
        "properties": {
            "completion_tokens": {"dataType":"double","required":true},
            "prompt_tokens": {"dataType":"double","required":true},
            "total_tokens": {"dataType":"double","required":true},
            "completion_tokens_details": {"ref":"CompletionUsage.CompletionTokensDetails"},
            "prompt_tokens_details": {"ref":"CompletionUsage.PromptTokensDetails"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletion": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "choices": {"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletion.Choice"},"required":true},
            "created": {"dataType":"double","required":true},
            "model": {"dataType":"string","required":true},
            "object": {"dataType":"enum","enums":["chat.completion"],"required":true},
            "service_tier": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["auto"]},{"dataType":"enum","enums":["default"]},{"dataType":"enum","enums":["flex"]},{"dataType":"enum","enums":["scale"]},{"dataType":"enum","enums":["priority"]},{"dataType":"enum","enums":[null]}]},
            "system_fingerprint": {"dataType":"string"},
            "usage": {"ref":"CompletionUsage"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ChatCompletion-or-_content-string--reasoning-string--calls-any__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"union","subSchemas":[{"ref":"ChatCompletion"},{"dataType":"nestedObjectLiteral","nestedProperties":{"calls":{"dataType":"any","required":true},"reasoning":{"dataType":"string","required":true},"content":{"dataType":"string","required":true}}}],"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ChatCompletion-or-_content-string--reasoning-string--calls-any_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ChatCompletion-or-_content-string--reasoning-string--calls-any__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__apiKey-string__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"apiKey":{"dataType":"string","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__apiKey-string_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__apiKey-string__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__cost-number--created_at_trunc-string_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"created_at_trunc":{"dataType":"string","required":true},"cost":{"dataType":"double","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__cost-number--created_at_trunc-string_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__cost-number--created_at_trunc-string_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"request_response_rmt":{"ref":"Partial_RequestResponseRMTToOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeafSubset_request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_FilterLeaf.request_response_rmt_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestClickhouseFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_request_response_rmt_"},{"ref":"RequestClickhouseFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestClickhouseFilterBranch": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"right":{"ref":"RequestClickhouseFilterNode","required":true},"operator":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["or"]},{"dataType":"enum","enums":["and"]}],"required":true},"left":{"ref":"RequestClickhouseFilterNode","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TimeIncrement": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["min"]},{"dataType":"enum","enums":["hour"]},{"dataType":"enum","enums":["day"]},{"dataType":"enum","enums":["week"]},{"dataType":"enum","enums":["month"]},{"dataType":"enum","enums":["year"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DataOverTimeRequest": {
        "dataType": "refObject",
        "properties": {
            "timeFilter": {"dataType":"nestedObjectLiteral","nestedProperties":{"end":{"dataType":"string","required":true},"start":{"dataType":"string","required":true}},"required":true},
            "userFilter": {"ref":"RequestClickhouseFilterNode","required":true},
            "dbIncrement": {"ref":"TimeIncrement","required":true},
            "timeZoneDifference": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelEndpoint": {
        "dataType": "refObject",
        "properties": {
            "provider": {"dataType":"string","required":true},
            "providerSlug": {"dataType":"string","required":true},
            "pricing": {"dataType":"nestedObjectLiteral","nestedProperties":{"cacheWrite":{"dataType":"double"},"cacheRead":{"dataType":"double"},"thinking":{"dataType":"double"},"image":{"dataType":"double"},"video":{"dataType":"double"},"web_search":{"dataType":"double"},"audio":{"dataType":"double"},"completion":{"dataType":"double","required":true},"prompt":{"dataType":"double","required":true}},"required":true},
            "supportsPtb": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InputModality": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["text"]},{"dataType":"enum","enums":["image"]},{"dataType":"enum","enums":["audio"]},{"dataType":"enum","enums":["video"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OutputModality": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["text"]},{"dataType":"enum","enums":["image"]},{"dataType":"enum","enums":["audio"]},{"dataType":"enum","enums":["video"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StandardParameter": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["max_tokens"]},{"dataType":"enum","enums":["temperature"]},{"dataType":"enum","enums":["top_p"]},{"dataType":"enum","enums":["top_k"]},{"dataType":"enum","enums":["stop"]},{"dataType":"enum","enums":["stream"]},{"dataType":"enum","enums":["frequency_penalty"]},{"dataType":"enum","enums":["presence_penalty"]},{"dataType":"enum","enums":["repetition_penalty"]},{"dataType":"enum","enums":["seed"]},{"dataType":"enum","enums":["tools"]},{"dataType":"enum","enums":["tool_choice"]},{"dataType":"enum","enums":["functions"]},{"dataType":"enum","enums":["function_call"]},{"dataType":"enum","enums":["reasoning"]},{"dataType":"enum","enums":["include_reasoning"]},{"dataType":"enum","enums":["thinking"]},{"dataType":"enum","enums":["response_format"]},{"dataType":"enum","enums":["json_mode"]},{"dataType":"enum","enums":["truncate"]},{"dataType":"enum","enums":["min_p"]},{"dataType":"enum","enums":["logit_bias"]},{"dataType":"enum","enums":["logprobs"]},{"dataType":"enum","enums":["top_logprobs"]},{"dataType":"enum","enums":["structured_outputs"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelRegistryItem": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "author": {"dataType":"string","required":true},
            "contextLength": {"dataType":"double","required":true},
            "endpoints": {"dataType":"array","array":{"dataType":"refObject","ref":"ModelEndpoint"},"required":true},
            "maxOutput": {"dataType":"double"},
            "trainingDate": {"dataType":"string"},
            "description": {"dataType":"string"},
            "inputModalities": {"dataType":"array","array":{"dataType":"refAlias","ref":"InputModality"},"required":true},
            "outputModalities": {"dataType":"array","array":{"dataType":"refAlias","ref":"OutputModality"},"required":true},
            "supportedParameters": {"dataType":"array","array":{"dataType":"refAlias","ref":"StandardParameter"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelCapability": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["audio"]},{"dataType":"enum","enums":["video"]},{"dataType":"enum","enums":["image"]},{"dataType":"enum","enums":["thinking"]},{"dataType":"enum","enums":["web_search"]},{"dataType":"enum","enums":["caching"]},{"dataType":"enum","enums":["reasoning"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelRegistryResponse": {
        "dataType": "refObject",
        "properties": {
            "models": {"dataType":"array","array":{"dataType":"refObject","ref":"ModelRegistryItem"},"required":true},
            "total": {"dataType":"double","required":true},
            "filters": {"dataType":"nestedObjectLiteral","nestedProperties":{"capabilities":{"dataType":"array","array":{"dataType":"refAlias","ref":"ModelCapability"},"required":true},"authors":{"dataType":"array","array":{"dataType":"string"},"required":true},"providers":{"dataType":"array","array":{"dataType":"string"},"required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ModelRegistryResponse_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"ModelRegistryResponse","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ModelRegistryResponse.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ModelRegistryResponse_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortOption": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["name"]},{"dataType":"enum","enums":["price-low"]},{"dataType":"enum","enums":["price-high"]},{"dataType":"enum","enums":["context"]},{"dataType":"enum","enums":["newest"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MetricStats": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"p99":{"dataType":"double","required":true},"p95":{"dataType":"double","required":true},"p90":{"dataType":"double","required":true},"max":{"dataType":"double","required":true},"min":{"dataType":"double","required":true},"median":{"dataType":"double","required":true},"average":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TokenMetricStats": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"MetricStats"},{"dataType":"nestedObjectLiteral","nestedProperties":{"medianPer1000Tokens":{"dataType":"double","required":true}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TimeSeriesMetric": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"double","required":true},"timestamp":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Model": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"timeSeriesData":{"dataType":"nestedObjectLiteral","nestedProperties":{"errorRate":{"dataType":"array","array":{"dataType":"refAlias","ref":"TimeSeriesMetric"},"required":true},"successRate":{"dataType":"array","array":{"dataType":"refAlias","ref":"TimeSeriesMetric"},"required":true},"ttft":{"dataType":"array","array":{"dataType":"refAlias","ref":"TimeSeriesMetric"},"required":true},"latency":{"dataType":"array","array":{"dataType":"refAlias","ref":"TimeSeriesMetric"},"required":true}},"required":true},"requestStatus":{"dataType":"nestedObjectLiteral","nestedProperties":{"errorRate":{"dataType":"double","required":true},"successRate":{"dataType":"double","required":true}},"required":true},"geographicTtft":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"median":{"dataType":"double","required":true},"countryCode":{"dataType":"string","required":true}}},"required":true},"geographicLatency":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"median":{"dataType":"double","required":true},"countryCode":{"dataType":"string","required":true}}},"required":true},"feedback":{"dataType":"nestedObjectLiteral","nestedProperties":{"negativePercentage":{"dataType":"double","required":true},"positivePercentage":{"dataType":"double","required":true}},"required":true},"costs":{"dataType":"nestedObjectLiteral","nestedProperties":{"completion_token":{"dataType":"double","required":true},"prompt_token":{"dataType":"double","required":true}},"required":true},"ttft":{"ref":"MetricStats","required":true},"latency":{"ref":"TokenMetricStats","required":true},"provider":{"dataType":"string","required":true},"model":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Model-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"Model"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Model-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Model-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelsToCompare": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"provider":{"dataType":"string","required":true},"names":{"dataType":"array","array":{"dataType":"string"},"required":true},"parent":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__model-string_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"model":{"dataType":"string","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__model-string_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__model-string_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__unsafe-boolean__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"unsafe":{"dataType":"boolean","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__unsafe-boolean_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__unsafe-boolean__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IntegrationCreateParams": {
        "dataType": "refObject",
        "properties": {
            "integration_name": {"dataType":"string","required":true},
            "settings": {"ref":"Json"},
            "active": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Integration": {
        "dataType": "refObject",
        "properties": {
            "integration_name": {"dataType":"string"},
            "settings": {"ref":"Json"},
            "active": {"dataType":"boolean"},
            "id": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Array_Integration__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"Integration"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Array_Integration_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Array_Integration__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IntegrationUpdateParams": {
        "dataType": "refObject",
        "properties": {
            "integration_name": {"dataType":"string"},
            "settings": {"ref":"Json"},
            "active": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Integration_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"Integration","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Integration.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Integration_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Array__id-string--name-string___": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Array__id-string--name-string__.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Array__id-string--name-string___"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ClickHouseTableColumn": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "type": {"dataType":"string","required":true},
            "default_type": {"dataType":"string"},
            "default_expression": {"dataType":"string"},
            "comment": {"dataType":"string"},
            "codec_expression": {"dataType":"string"},
            "ttl_expression": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ClickHouseTableSchema": {
        "dataType": "refObject",
        "properties": {
            "table_name": {"dataType":"string","required":true},
            "columns": {"dataType":"array","array":{"dataType":"refObject","ref":"ClickHouseTableColumn"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ClickHouseTableSchema-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ClickHouseTableSchema"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ClickHouseTableSchema-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ClickHouseTableSchema-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExecuteSqlResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"rowCount":{"dataType":"double","required":true},"size":{"dataType":"double","required":true},"elapsedMilliseconds":{"dataType":"double","required":true},"rows":{"dataType":"array","array":{"dataType":"refAlias","ref":"Record_string.any_"},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ExecuteSqlResponse_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"ExecuteSqlResponse","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ExecuteSqlResponse.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ExecuteSqlResponse_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExecuteSqlRequest": {
        "dataType": "refObject",
        "properties": {
            "sql": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HqlSavedQuery": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "organization_id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "sql": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
            "updated_at": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Array_HqlSavedQuery__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"HqlSavedQuery"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Array_HqlSavedQuery_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Array_HqlSavedQuery__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_HqlSavedQuery-or-null_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"union","subSchemas":[{"ref":"HqlSavedQuery"},{"dataType":"enum","enums":[null]}],"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_HqlSavedQuery-or-null.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_HqlSavedQuery-or-null_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_void_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"void","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_void.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_void_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_HqlSavedQuery-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"HqlSavedQuery"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_HqlSavedQuery-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_HqlSavedQuery-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateSavedQueryRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "sql": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_HqlSavedQuery_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"HqlSavedQuery","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_HqlSavedQuery.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_HqlSavedQuery_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateSavedQueryRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "sql": {"dataType":"string","required":true},
            "id": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__tableId-string--experimentId-string__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"experimentId":{"dataType":"string","required":true},"tableId":{"dataType":"string","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__tableId-string--experimentId-string_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__tableId-string--experimentId-string__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateExperimentTableParams": {
        "dataType": "refObject",
        "properties": {
            "datasetId": {"dataType":"string","required":true},
            "experimentMetadata": {"ref":"Record_string.any_","required":true},
            "promptVersionId": {"dataType":"string","required":true},
            "newHeliconeTemplate": {"dataType":"string","required":true},
            "isMajorVersion": {"dataType":"boolean","required":true},
            "promptSubversionMetadata": {"ref":"Record_string.any_","required":true},
            "experimentTableMetadata": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentTableColumn": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "columnName": {"dataType":"string","required":true},
            "columnType": {"dataType":"string","required":true},
            "hypothesisId": {"dataType":"string"},
            "cells": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"ref":"Record_string.any_"},"value":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"requestId":{"dataType":"string"},"rowIndex":{"dataType":"double","required":true},"id":{"dataType":"string","required":true}}},"required":true},
            "metadata": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentTable": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "experimentId": {"dataType":"string","required":true},
            "columns": {"dataType":"array","array":{"dataType":"refObject","ref":"ExperimentTableColumn"},"required":true},
            "metadata": {"ref":"Record_string.any_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ExperimentTable_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"ExperimentTable","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ExperimentTable.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ExperimentTable_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentTableSimplified": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "experimentId": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
            "metadata": {"dataType":"any"},
            "columns": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"columnType":{"dataType":"string","required":true},"columnName":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ExperimentTableSimplified_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"ExperimentTableSimplified","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ExperimentTableSimplified.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ExperimentTableSimplified_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ExperimentTableSimplified-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ExperimentTableSimplified"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ExperimentTableSimplified-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ExperimentTableSimplified-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NewExperimentParams": {
        "dataType": "refObject",
        "properties": {
            "datasetId": {"dataType":"string","required":true},
            "promptVersion": {"dataType":"string","required":true},
            "model": {"dataType":"string","required":true},
            "providerKeyId": {"dataType":"string","required":true},
            "meta": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__hypothesisId-string__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"hypothesisId":{"dataType":"string","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__hypothesisId-string_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__hypothesisId-string__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Score": {
        "dataType": "refObject",
        "properties": {
            "valueType": {"dataType":"string","required":true},
            "value": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"datetime"},{"dataType":"string"}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.Score_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Score"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__runsCount-number--scores-Record_string.Score___": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"scores":{"ref":"Record_string.Score_","required":true},"runsCount":{"dataType":"double","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__runsCount-number--scores-Record_string.Score__.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__runsCount-number--scores-Record_string.Score___"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResponseObj": {
        "dataType": "refObject",
        "properties": {
            "body": {"dataType":"any","required":true},
            "createdAt": {"dataType":"string","required":true},
            "completionTokens": {"dataType":"double","required":true},
            "promptTokens": {"dataType":"double","required":true},
            "promptCacheWriteTokens": {"dataType":"double","required":true},
            "promptCacheReadTokens": {"dataType":"double","required":true},
            "delayMs": {"dataType":"double","required":true},
            "model": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestObj": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "provider": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentDatasetRow": {
        "dataType": "refObject",
        "properties": {
            "rowId": {"dataType":"string","required":true},
            "inputRecord": {"dataType":"nestedObjectLiteral","nestedProperties":{"request":{"ref":"RequestObj","required":true},"response":{"ref":"ResponseObj","required":true},"autoInputs":{"dataType":"array","array":{"dataType":"refAlias","ref":"Record_string.string_"},"required":true},"inputs":{"ref":"Record_string.string_","required":true},"requestPath":{"dataType":"string","required":true},"requestId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"required":true},
            "rowIndex": {"dataType":"double","required":true},
            "columnId": {"dataType":"string","required":true},
            "scores": {"ref":"Record_string.Score_","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentScores": {
        "dataType": "refObject",
        "properties": {
            "dataset": {"dataType":"nestedObjectLiteral","nestedProperties":{"scores":{"ref":"Record_string.Score_","required":true}},"required":true},
            "hypothesis": {"dataType":"nestedObjectLiteral","nestedProperties":{"scores":{"ref":"Record_string.Score_","required":true},"runsCount":{"dataType":"double","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Experiment": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "organization": {"dataType":"string","required":true},
            "dataset": {"dataType":"nestedObjectLiteral","nestedProperties":{"rows":{"dataType":"array","array":{"dataType":"refObject","ref":"ExperimentDatasetRow"},"required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"required":true},
            "meta": {"dataType":"any","required":true},
            "createdAt": {"dataType":"string","required":true},
            "hypotheses": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"runs":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"request":{"ref":"RequestObj"},"scores":{"ref":"Record_string.Score_","required":true},"response":{"ref":"ResponseObj"},"resultRequestId":{"dataType":"string","required":true},"datasetRowId":{"dataType":"string","required":true}}},"required":true},"providerKey":{"dataType":"string","required":true},"createdAt":{"dataType":"string","required":true},"status":{"dataType":"string","required":true},"model":{"dataType":"string","required":true},"parentPromptVersion":{"dataType":"nestedObjectLiteral","nestedProperties":{"template":{"dataType":"any","required":true}}},"promptVersion":{"dataType":"nestedObjectLiteral","nestedProperties":{"template":{"dataType":"any","required":true}}},"promptVersionId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
            "scores": {"dataType":"union","subSchemas":[{"ref":"ExperimentScores"},{"dataType":"enum","enums":[null]}],"required":true},
            "tableId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Experiment-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"Experiment"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Experiment-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Experiment-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_ExperimentToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"ref":"Partial_TextOperators_"},"prompt_v2":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.experiment_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"experiment":{"ref":"Partial_ExperimentToOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeafSubset_experiment_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_FilterLeaf.experiment_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_experiment_"},{"ref":"ExperimentFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ExperimentFilterBranch": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"right":{"ref":"ExperimentFilterNode","required":true},"operator":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["or"]},{"dataType":"enum","enums":["and"]}],"required":true},"left":{"ref":"ExperimentFilterNode","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IncludeExperimentKeys": {
        "dataType": "refObject",
        "properties": {
            "inputs": {"dataType":"enum","enums":[true]},
            "promptVersion": {"dataType":"enum","enums":[true]},
            "responseBodies": {"dataType":"enum","enums":[true]},
            "score": {"dataType":"enum","enums":[true]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__datasetId-string__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"datasetId":{"dataType":"string","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__datasetId-string_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__datasetId-string__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasetMetadata": {
        "dataType": "refObject",
        "properties": {
            "promptVersionId": {"dataType":"string"},
            "inputRecordsIds": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NewDatasetParams": {
        "dataType": "refObject",
        "properties": {
            "datasetName": {"dataType":"string","required":true},
            "requestIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "datasetType": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["experiment"]},{"dataType":"enum","enums":["helicone"]}],"required":true},
            "meta": {"ref":"DatasetMetadata"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.request-or-prompts_versions_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"request":{"ref":"Partial_RequestTableToOperators_"},"prompts_versions":{"ref":"Partial_PromptVersionsToOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeafSubset_request-or-prompts_versions_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_FilterLeaf.request-or-prompts_versions_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasetFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_request-or-prompts_versions_"},{"ref":"DatasetFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasetFilterBranch": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"right":{"ref":"DatasetFilterNode","required":true},"operator":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["or"]},{"dataType":"enum","enums":["and"]}],"required":true},"left":{"ref":"DatasetFilterNode","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RandomDatasetParams": {
        "dataType": "refObject",
        "properties": {
            "datasetName": {"dataType":"string","required":true},
            "filter": {"ref":"DatasetFilterNode","required":true},
            "offset": {"dataType":"double"},
            "limit": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DatasetResult": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
            "meta": {"ref":"DatasetMetadata"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_DatasetResult-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"DatasetResult"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_DatasetResult-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_DatasetResult-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess___-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result___-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess___-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HeliconeDatasetMetadata": {
        "dataType": "refObject",
        "properties": {
            "promptVersionId": {"dataType":"string"},
            "inputRecordsIds": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NewHeliconeDatasetParams": {
        "dataType": "refObject",
        "properties": {
            "datasetName": {"dataType":"string","required":true},
            "requestIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "meta": {"ref":"HeliconeDatasetMetadata"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MutateParams": {
        "dataType": "refObject",
        "properties": {
            "addRequests": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "removeRequests": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HeliconeDatasetRow": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "origin_request_id": {"dataType":"string","required":true},
            "dataset_id": {"dataType":"string","required":true},
            "created_at": {"dataType":"string","required":true},
            "signed_url": {"ref":"Result_string.string_","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_HeliconeDatasetRow-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"HeliconeDatasetRow"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_HeliconeDatasetRow-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_HeliconeDatasetRow-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HeliconeDataset": {
        "dataType": "refObject",
        "properties": {
            "created_at": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "dataset_type": {"dataType":"string","required":true},
            "id": {"dataType":"string","required":true},
            "meta": {"dataType":"union","subSchemas":[{"ref":"Json"},{"dataType":"enum","enums":[null]}],"required":true},
            "name": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "organization": {"dataType":"string","required":true},
            "requests_count": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_HeliconeDataset-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"HeliconeDataset"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_HeliconeDataset-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_HeliconeDataset-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_any_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"any","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Router": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"lastUpdatedAt":{"dataType":"string","required":true},"latestVersion":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"hash":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__routers-Router-Array__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"routers":{"dataType":"array","array":{"dataType":"refAlias","ref":"Router"},"required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__routers-Router-Array_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__routers-Router-Array__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LatestRouterConfig": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"config":{"ref":"Json","required":true},"version":{"dataType":"string","required":true},"hash":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_LatestRouterConfig_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"LatestRouterConfig","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_LatestRouterConfig.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_LatestRouterConfig_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RouterRequestsOverTime": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"double","required":true},"count":{"dataType":"double","required":true},"time":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_RouterRequestsOverTime-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"RouterRequestsOverTime"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_RouterRequestsOverTime-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_RouterRequestsOverTime-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RouterCostOverTime": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"cost":{"dataType":"double","required":true},"time":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_RouterCostOverTime-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"RouterCostOverTime"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_RouterCostOverTime-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_RouterCostOverTime-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RouterLatencyOverTime": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"duration":{"dataType":"double","required":true},"time":{"dataType":"datetime","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_RouterLatencyOverTime-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"RouterLatencyOverTime"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_RouterLatencyOverTime-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_RouterLatencyOverTime-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateRouterResult": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"routerVersionId":{"dataType":"string","required":true},"routerHash":{"dataType":"string","required":true},"routerId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_CreateRouterResult_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"CreateRouterResult","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_CreateRouterResult.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_CreateRouterResult_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Eval": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "averageScore": {"dataType":"double","required":true},
            "minScore": {"dataType":"double","required":true},
            "maxScore": {"dataType":"double","required":true},
            "count": {"dataType":"double","required":true},
            "overTime": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"count":{"dataType":"double","required":true},"date":{"dataType":"string","required":true}}},"required":true},
            "averageOverTime": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"double","required":true},"date":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_Eval-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"Eval"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_Eval-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_Eval-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EvalFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_request_response_rmt_"},{"ref":"EvalFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EvalFilterBranch": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"right":{"ref":"EvalFilterNode","required":true},"operator":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["or"]},{"dataType":"enum","enums":["and"]}],"required":true},"left":{"ref":"EvalFilterNode","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EvalQueryParams": {
        "dataType": "refObject",
        "properties": {
            "filter": {"ref":"EvalFilterNode","required":true},
            "timeFilter": {"dataType":"nestedObjectLiteral","nestedProperties":{"end":{"dataType":"string","required":true},"start":{"dataType":"string","required":true}},"required":true},
            "offset": {"dataType":"double"},
            "limit": {"dataType":"double"},
            "timeZoneDifference": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ScoreDistribution": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "distribution": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"double","required":true},"upper":{"dataType":"double","required":true},"lower":{"dataType":"double","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ScoreDistribution-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ScoreDistribution"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ScoreDistribution-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ScoreDistribution-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TotalValuesForAllOfTime": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"total_cost":{"dataType":"double","required":true},"total_tokens":{"dataType":"double","required":true},"total_requests":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_TotalValuesForAllOfTime_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"TotalValuesForAllOfTime","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_TotalValuesForAllOfTime.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_TotalValuesForAllOfTime_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelUsageOverTime": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"tokens":{"dataType":"double","required":true},"date":{"dataType":"string","required":true},"model":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ModelUsageOverTime-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"ModelUsageOverTime"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ModelUsageOverTime-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ModelUsageOverTime-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProviderUsageOverTime": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"tokens":{"dataType":"double","required":true},"date":{"dataType":"string","required":true},"provider":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ProviderUsageOverTime-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"ProviderUsageOverTime"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ProviderUsageOverTime-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ProviderUsageOverTime-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TimeSpan": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["7d"]},{"dataType":"enum","enums":["1m"]},{"dataType":"enum","enums":["3m"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelName": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["gpt-3.5"]},{"dataType":"enum","enums":["gpt-4o"]},{"dataType":"enum","enums":["gpt-4o-mini"]},{"dataType":"enum","enums":["gpt-4"]},{"dataType":"enum","enums":["gpt-4-turbo"]},{"dataType":"enum","enums":["claude-3-opus"]},{"dataType":"enum","enums":["claude-3-sonnet"]},{"dataType":"enum","enums":["claude-3-haiku"]},{"dataType":"enum","enums":["claude-2"]},{"dataType":"enum","enums":["open-mixtral"]},{"dataType":"enum","enums":["dall-e"]},{"dataType":"enum","enums":["text-moderation"]},{"dataType":"enum","enums":["text-embedding"]},{"dataType":"enum","enums":["anthropic/claude-3.5-sonnet"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OpenStatsProviderName": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["OPENAI"]},{"dataType":"enum","enums":["ANTHROPIC"]},{"dataType":"enum","enums":["OPENROUTER"]},{"dataType":"enum","enums":["MISTRAL"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DataIsBeautifulRequestBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"provider":{"ref":"OpenStatsProviderName"},"models":{"dataType":"array","array":{"dataType":"refAlias","ref":"ModelName"}},"timespan":{"ref":"TimeSpan","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TTFTvsPromptLength": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"prompt_length":{"dataType":"double","required":true},"ttft_normalized_p75":{"dataType":"double","required":true},"ttft_normalized_p99":{"dataType":"double","required":true},"ttft_normalized":{"dataType":"double","required":true},"ttft_p75":{"dataType":"double","required":true},"ttft_p99":{"dataType":"double","required":true},"ttft":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_TTFTvsPromptLength-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"TTFTvsPromptLength"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_TTFTvsPromptLength-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_TTFTvsPromptLength-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelBreakdown": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"percent":{"dataType":"double","required":true},"matched_model":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ModelBreakdown-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"ModelBreakdown"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ModelBreakdown-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ModelBreakdown-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelCost": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"percent":{"dataType":"double","required":true},"matched_model":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ModelCost-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"ModelCost"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ModelCost-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ModelCost-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProviderBreakdown": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"percent":{"dataType":"double","required":true},"provider":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ProviderBreakdown-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"ProviderBreakdown"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ProviderBreakdown-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ProviderBreakdown-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ModelBreakdownOverTime": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"date":{"dataType":"string","required":true}}},{"ref":"ModelBreakdown"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ModelBreakdownOverTime-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"ModelBreakdownOverTime"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ModelBreakdownOverTime-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ModelBreakdownOverTime-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__score_key-string--score_sum-number--created_at_trunc-string_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"created_at_trunc":{"dataType":"string","required":true},"score_sum":{"dataType":"double","required":true},"score_key":{"dataType":"string","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__score_key-string--score_sum-number--created_at_trunc-string_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__score_key-string--score_sum-number--created_at_trunc-string_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CustomerUsage": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "cost": {"dataType":"double","required":true},
            "count": {"dataType":"double","required":true},
            "prompt_tokens": {"dataType":"double","required":true},
            "completion_tokens": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Customer": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__api_key_hash-string--api_key_name-string--created_at-string--governance-boolean--id-number--key_permissions-string--organization_id-string--soft_delete-boolean--temp_key-boolean--updated_at-string--user_id-string_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"user_id":{"dataType":"string","required":true},"updated_at":{"dataType":"string","required":true},"temp_key":{"dataType":"boolean","required":true},"soft_delete":{"dataType":"boolean","required":true},"organization_id":{"dataType":"string","required":true},"key_permissions":{"dataType":"string","required":true},"id":{"dataType":"double","required":true},"governance":{"dataType":"boolean","required":true},"created_at":{"dataType":"string","required":true},"api_key_name":{"dataType":"string","required":true},"api_key_hash":{"dataType":"string","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__api_key_hash-string--api_key_name-string--created_at-string--governance-boolean--id-number--key_permissions-string--organization_id-string--soft_delete-boolean--temp_key-boolean--updated_at-string--user_id-string_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__api_key_hash-string--api_key_name-string--created_at-string--governance-boolean--id-number--key_permissions-string--organization_id-string--soft_delete-boolean--temp_key-boolean--updated_at-string--user_id-string_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__id-number--active-boolean--title-string--message-string--created_at-string--updated_at-string_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"updated_at":{"dataType":"string","required":true},"created_at":{"dataType":"string","required":true},"message":{"dataType":"string","required":true},"title":{"dataType":"string","required":true},"active":{"dataType":"boolean","required":true},"id":{"dataType":"double","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__id-number--active-boolean--title-string--message-string--created_at-string--updated_at-string_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__id-number--active-boolean--title-string--message-string--created_at-string--updated_at-string_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InAppThread": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "chat": {"dataType":"any","required":true},
            "user_id": {"dataType":"string","required":true},
            "org_id": {"dataType":"string","required":true},
            "created_at": {"dataType":"datetime","required":true},
            "escalated": {"dataType":"boolean","required":true},
            "metadata": {"dataType":"any","required":true},
            "updated_at": {"dataType":"datetime","required":true},
            "soft_delete": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_InAppThread_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"InAppThread","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_InAppThread.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_InAppThread_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionContentPartText": {
        "dataType": "refObject",
        "properties": {
            "text": {"dataType":"string","required":true},
            "type": {"dataType":"enum","enums":["text"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionDeveloperMessageParam": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletionContentPartText"}}],"required":true},
            "role": {"dataType":"enum","enums":["developer"],"required":true},
            "name": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionSystemMessageParam": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletionContentPartText"}}],"required":true},
            "role": {"dataType":"enum","enums":["system"],"required":true},
            "name": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionContentPartImage.ImageURL": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
            "detail": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["auto"]},{"dataType":"enum","enums":["low"]},{"dataType":"enum","enums":["high"]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionContentPartImage": {
        "dataType": "refObject",
        "properties": {
            "image_url": {"ref":"ChatCompletionContentPartImage.ImageURL","required":true},
            "type": {"dataType":"enum","enums":["image_url"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionContentPartInputAudio.InputAudio": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"string","required":true},
            "format": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["wav"]},{"dataType":"enum","enums":["mp3"]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionContentPartInputAudio": {
        "dataType": "refObject",
        "properties": {
            "input_audio": {"ref":"ChatCompletionContentPartInputAudio.InputAudio","required":true},
            "type": {"dataType":"enum","enums":["input_audio"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionContentPart.File.File": {
        "dataType": "refObject",
        "properties": {
            "file_data": {"dataType":"string"},
            "file_id": {"dataType":"string"},
            "filename": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionContentPart.File": {
        "dataType": "refObject",
        "properties": {
            "file": {"ref":"ChatCompletionContentPart.File.File","required":true},
            "type": {"dataType":"enum","enums":["file"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionContentPart": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionContentPartText"},{"ref":"ChatCompletionContentPartImage"},{"ref":"ChatCompletionContentPartInputAudio"},{"ref":"ChatCompletionContentPart.File"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionUserMessageParam": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"array","array":{"dataType":"refAlias","ref":"ChatCompletionContentPart"}}],"required":true},
            "role": {"dataType":"enum","enums":["user"],"required":true},
            "name": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionAssistantMessageParam.Audio": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionContentPartRefusal": {
        "dataType": "refObject",
        "properties": {
            "refusal": {"dataType":"string","required":true},
            "type": {"dataType":"enum","enums":["refusal"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionAssistantMessageParam.FunctionCall": {
        "dataType": "refObject",
        "properties": {
            "arguments": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionAssistantMessageParam": {
        "dataType": "refObject",
        "properties": {
            "role": {"dataType":"enum","enums":["assistant"],"required":true},
            "audio": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionAssistantMessageParam.Audio"},{"dataType":"enum","enums":[null]}]},
            "content": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"array","array":{"dataType":"union","subSchemas":[{"ref":"ChatCompletionContentPartText"},{"ref":"ChatCompletionContentPartRefusal"}]}},{"dataType":"enum","enums":[null]}]},
            "function_call": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionAssistantMessageParam.FunctionCall"},{"dataType":"enum","enums":[null]}]},
            "name": {"dataType":"string"},
            "refusal": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "tool_calls": {"dataType":"array","array":{"dataType":"refAlias","ref":"ChatCompletionMessageToolCall"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionToolMessageParam": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletionContentPartText"}}],"required":true},
            "role": {"dataType":"enum","enums":["tool"],"required":true},
            "tool_call_id": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionFunctionMessageParam": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "name": {"dataType":"string","required":true},
            "role": {"dataType":"enum","enums":["function"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessageParam": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionDeveloperMessageParam"},{"ref":"ChatCompletionSystemMessageParam"},{"ref":"ChatCompletionUserMessageParam"},{"ref":"ChatCompletionAssistantMessageParam"},{"ref":"ChatCompletionToolMessageParam"},{"ref":"ChatCompletionFunctionMessageParam"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__success-boolean__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"success":{"dataType":"boolean","required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__success-boolean_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__success-boolean__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ThreadSummary": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "created_at": {"dataType":"datetime","required":true},
            "updated_at": {"dataType":"datetime","required":true},
            "escalated": {"dataType":"boolean","required":true},
            "message_count": {"dataType":"double","required":true},
            "first_message": {"dataType":"string"},
            "last_message": {"dataType":"string"},
            "soft_delete": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ThreadSummary-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ThreadSummary"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ThreadSummary-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ThreadSummary-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
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


    
        const argsWebhookController_newWebhook: Record<string, TsoaRoute.ParameterSchema> = {
                webhookData: {"in":"body","name":"webhookData","required":true,"ref":"WebhookData"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/webhooks',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WebhookController)),
            ...(fetchMiddlewares<RequestHandler>(WebhookController.prototype.newWebhook)),

            async function WebhookController_newWebhook(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWebhookController_newWebhook, request, response });

                const controller = new WebhookController();

              await templateService.apiHandler({
                methodName: 'newWebhook',
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
        const argsWebhookController_getWebhooks: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/webhooks',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WebhookController)),
            ...(fetchMiddlewares<RequestHandler>(WebhookController.prototype.getWebhooks)),

            async function WebhookController_getWebhooks(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWebhookController_getWebhooks, request, response });

                const controller = new WebhookController();

              await templateService.apiHandler({
                methodName: 'getWebhooks',
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
        const argsWebhookController_deleteWebhook: Record<string, TsoaRoute.ParameterSchema> = {
                webhookId: {"in":"path","name":"webhookId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v1/webhooks/:webhookId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WebhookController)),
            ...(fetchMiddlewares<RequestHandler>(WebhookController.prototype.deleteWebhook)),

            async function WebhookController_deleteWebhook(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWebhookController_deleteWebhook, request, response });

                const controller = new WebhookController();

              await templateService.apiHandler({
                methodName: 'deleteWebhook',
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
        const argsWaitlistController_addToWaitlist: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                reqBody: {"in":"body","name":"reqBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string","required":true}}},
        };
        app.post('/v1/public/waitlist/experiments',
            ...(fetchMiddlewares<RequestHandler>(WaitlistController)),
            ...(fetchMiddlewares<RequestHandler>(WaitlistController.prototype.addToWaitlist)),

            async function WaitlistController_addToWaitlist(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWaitlistController_addToWaitlist, request, response });

                const controller = new WaitlistController();

              await templateService.apiHandler({
                methodName: 'addToWaitlist',
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
        const argsVaultController_addKey: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"AddVaultKeyParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/vault/add',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VaultController)),
            ...(fetchMiddlewares<RequestHandler>(VaultController.prototype.addKey)),

            async function VaultController_addKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVaultController_addKey, request, response });

                const controller = new VaultController();

              await templateService.apiHandler({
                methodName: 'addKey',
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
        const argsVaultController_getKeys: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/vault/keys',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VaultController)),
            ...(fetchMiddlewares<RequestHandler>(VaultController.prototype.getKeys)),

            async function VaultController_getKeys(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVaultController_getKeys, request, response });

                const controller = new VaultController();

              await templateService.apiHandler({
                methodName: 'getKeys',
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
        const argsVaultController_getKeyById: Record<string, TsoaRoute.ParameterSchema> = {
                providerKeyId: {"in":"path","name":"providerKeyId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/vault/key/:providerKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VaultController)),
            ...(fetchMiddlewares<RequestHandler>(VaultController.prototype.getKeyById)),

            async function VaultController_getKeyById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVaultController_getKeyById, request, response });

                const controller = new VaultController();

              await templateService.apiHandler({
                methodName: 'getKeyById',
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
        const argsVaultController_updateKey: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"active":{"dataType":"boolean"},"name":{"dataType":"string"},"key":{"dataType":"string"}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/v1/vault/update/:id',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VaultController)),
            ...(fetchMiddlewares<RequestHandler>(VaultController.prototype.updateKey)),

            async function VaultController_updateKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVaultController_updateKey, request, response });

                const controller = new VaultController();

              await templateService.apiHandler({
                methodName: 'updateKey',
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
        const argsUserController_getUserMetricsOverview: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"useInterquartile":{"dataType":"boolean","required":true},"pSize":{"ref":"PSize","required":true},"filter":{"ref":"UserFilterNode","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/user/metrics-overview/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUserMetricsOverview)),

            async function UserController_getUserMetricsOverview(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUserMetricsOverview, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getUserMetricsOverview',
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
        const argsUserController_getUserMetrics: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UserMetricsQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/user/metrics/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUserMetrics)),

            async function UserController_getUserMetrics(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUserMetrics, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getUserMetrics',
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
        const argsUserController_getUsers: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UserQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/user/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUsers)),

            async function UserController_getUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUsers, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getUsers',
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
        const argsEvaluatorController_createEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateEvaluatorParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/evaluator',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.createEvaluator)),

            async function EvaluatorController_createEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_createEvaluator, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'createEvaluator',
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
        const argsEvaluatorController_getEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
        };
        app.get('/v1/evaluator/:evaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.getEvaluator)),

            async function EvaluatorController_getEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_getEvaluator, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'getEvaluator',
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
        const argsEvaluatorController_queryEvaluators: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/evaluator/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.queryEvaluators)),

            async function EvaluatorController_queryEvaluators(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_queryEvaluators, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'queryEvaluators',
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
        const argsEvaluatorController_updateEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateEvaluatorParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/v1/evaluator/:evaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.updateEvaluator)),

            async function EvaluatorController_updateEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_updateEvaluator, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'updateEvaluator',
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
        const argsEvaluatorController_deleteEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
        };
        app.delete('/v1/evaluator/:evaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.deleteEvaluator)),

            async function EvaluatorController_deleteEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_deleteEvaluator, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'deleteEvaluator',
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
        const argsEvaluatorController_getExperimentsForEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
        };
        app.get('/v1/evaluator/:evaluatorId/experiments',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.getExperimentsForEvaluator)),

            async function EvaluatorController_getExperimentsForEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_getExperimentsForEvaluator, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'getExperimentsForEvaluator',
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
        const argsEvaluatorController_getOnlineEvaluators: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
        };
        app.get('/v1/evaluator/:evaluatorId/onlineEvaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.getOnlineEvaluators)),

            async function EvaluatorController_getOnlineEvaluators(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_getOnlineEvaluators, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'getOnlineEvaluators',
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
        const argsEvaluatorController_createOnlineEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateOnlineEvaluatorParams"},
        };
        app.post('/v1/evaluator/:evaluatorId/onlineEvaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.createOnlineEvaluator)),

            async function EvaluatorController_createOnlineEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_createOnlineEvaluator, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'createOnlineEvaluator',
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
        const argsEvaluatorController_deleteOnlineEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
                onlineEvaluatorId: {"in":"path","name":"onlineEvaluatorId","required":true,"dataType":"string"},
        };
        app.delete('/v1/evaluator/:evaluatorId/onlineEvaluators/:onlineEvaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.deleteOnlineEvaluator)),

            async function EvaluatorController_deleteOnlineEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_deleteOnlineEvaluator, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'deleteOnlineEvaluator',
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
        const argsEvaluatorController_testPythonEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"testInput":{"ref":"TestInput","required":true},"code":{"dataType":"string","required":true}}},
        };
        app.post('/v1/evaluator/python/test',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.testPythonEvaluator)),

            async function EvaluatorController_testPythonEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_testPythonEvaluator, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'testPythonEvaluator',
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
        const argsEvaluatorController_testLLMEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"evaluatorName":{"dataType":"string","required":true},"testInput":{"ref":"TestInput","required":true},"evaluatorConfig":{"ref":"EvaluatorConfig","required":true}}},
        };
        app.post('/v1/evaluator/llm/test',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.testLLMEvaluator)),

            async function EvaluatorController_testLLMEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_testLLMEvaluator, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'testLLMEvaluator',
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
        const argsEvaluatorController_testLastMileEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"testInput":{"ref":"TestInput","required":true},"config":{"ref":"LastMileConfigForm","required":true}}},
        };
        app.post('/v1/evaluator/lastmile/test',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.testLastMileEvaluator)),

            async function EvaluatorController_testLastMileEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_testLastMileEvaluator, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'testLastMileEvaluator',
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
        const argsEvaluatorController_getEvaluatorStats: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
        };
        app.get('/v1/evaluator/:evaluatorId/stats',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.getEvaluatorStats)),

            async function EvaluatorController_getEvaluatorStats(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvaluatorController_getEvaluatorStats, request, response });

                const controller = new EvaluatorController();

              await templateService.apiHandler({
                methodName: 'getEvaluatorStats',
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
        const argsPrompt2025Controller_getPrompt2025: Record<string, TsoaRoute.ParameterSchema> = {
                promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/prompt-2025/id/:promptId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompt2025)),

            async function Prompt2025Controller_getPrompt2025(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompt2025, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompt2025',
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
        const argsPrompt2025Controller_renamePrompt2025: Record<string, TsoaRoute.ParameterSchema> = {
                promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt-2025/id/:promptId/rename',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.renamePrompt2025)),

            async function Prompt2025Controller_renamePrompt2025(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_renamePrompt2025, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'renamePrompt2025',
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
        const argsPrompt2025Controller_deletePrompt2025: Record<string, TsoaRoute.ParameterSchema> = {
                promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v1/prompt-2025/:promptId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.deletePrompt2025)),

            async function Prompt2025Controller_deletePrompt2025(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_deletePrompt2025, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'deletePrompt2025',
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
        const argsPrompt2025Controller_deletePrompt2025Version: Record<string, TsoaRoute.ParameterSchema> = {
                promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
                versionId: {"in":"path","name":"versionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v1/prompt-2025/:promptId/:versionId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.deletePrompt2025Version)),

            async function Prompt2025Controller_deletePrompt2025Version(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_deletePrompt2025Version, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'deletePrompt2025Version',
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
        const argsPrompt2025Controller_getPrompt2025Inputs: Record<string, TsoaRoute.ParameterSchema> = {
                promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
                versionId: {"in":"path","name":"versionId","required":true,"dataType":"string"},
                requestId: {"in":"query","name":"requestId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/prompt-2025/id/:promptId/:versionId/inputs',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompt2025Inputs)),

            async function Prompt2025Controller_getPrompt2025Inputs(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompt2025Inputs, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompt2025Inputs',
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
        const argsPrompt2025Controller_getPrompt2025Tags: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/prompt-2025/tags',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompt2025Tags)),

            async function Prompt2025Controller_getPrompt2025Tags(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompt2025Tags, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompt2025Tags',
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
        const argsPrompt2025Controller_getPrompt2025Environments: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/prompt-2025/environments',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompt2025Environments)),

            async function Prompt2025Controller_getPrompt2025Environments(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompt2025Environments, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompt2025Environments',
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
        const argsPrompt2025Controller_createPrompt2025: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"promptBody":{"ref":"OpenAIChatRequest","required":true},"tags":{"dataType":"array","array":{"dataType":"string"},"required":true},"name":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt-2025',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.createPrompt2025)),

            async function Prompt2025Controller_createPrompt2025(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_createPrompt2025, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'createPrompt2025',
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
        const argsPrompt2025Controller_updatePrompt2025: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"promptBody":{"ref":"OpenAIChatRequest","required":true},"commitMessage":{"dataType":"string","required":true},"environment":{"dataType":"string"},"newMajorVersion":{"dataType":"boolean","required":true},"promptVersionId":{"dataType":"string","required":true},"promptId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt-2025/update',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.updatePrompt2025)),

            async function Prompt2025Controller_updatePrompt2025(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_updatePrompt2025, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'updatePrompt2025',
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
        const argsPrompt2025Controller_setPromptVersionEnvironment: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"environment":{"dataType":"string","required":true},"promptVersionId":{"dataType":"string","required":true},"promptId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt-2025/update/environment',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.setPromptVersionEnvironment)),

            async function Prompt2025Controller_setPromptVersionEnvironment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_setPromptVersionEnvironment, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'setPromptVersionEnvironment',
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
        const argsPrompt2025Controller_getPrompt2025Count: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/prompt-2025/count',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompt2025Count)),

            async function Prompt2025Controller_getPrompt2025Count(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompt2025Count, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompt2025Count',
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
        const argsPrompt2025Controller_getPrompts2025: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"pageSize":{"dataType":"double","required":true},"page":{"dataType":"double","required":true},"tagsFilter":{"dataType":"array","array":{"dataType":"string"},"required":true},"search":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt-2025/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompts2025)),

            async function Prompt2025Controller_getPrompts2025(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompts2025, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompts2025',
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
        const argsPrompt2025Controller_getPrompt2025Version: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"promptVersionId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt-2025/query/version',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompt2025Version)),

            async function Prompt2025Controller_getPrompt2025Version(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompt2025Version, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompt2025Version',
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
        const argsPrompt2025Controller_getPrompt2025EnvironmentVersion: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"environment":{"dataType":"string","required":true},"promptId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt-2025/query/environment-version',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompt2025EnvironmentVersion)),

            async function Prompt2025Controller_getPrompt2025EnvironmentVersion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompt2025EnvironmentVersion, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompt2025EnvironmentVersion',
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
        const argsPrompt2025Controller_getPrompt2025Versions: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"majorVersion":{"dataType":"double"},"promptId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt-2025/query/versions',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompt2025Versions)),

            async function Prompt2025Controller_getPrompt2025Versions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompt2025Versions, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompt2025Versions',
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
        const argsPrompt2025Controller_getPrompt2025ProductionVersion: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"promptId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt-2025/query/production-version',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompt2025ProductionVersion)),

            async function Prompt2025Controller_getPrompt2025ProductionVersion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompt2025ProductionVersion, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompt2025ProductionVersion',
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
        const argsPrompt2025Controller_getPrompt2025TotalVersions: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"promptId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt-2025/query/total-versions',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller)),
            ...(fetchMiddlewares<RequestHandler>(Prompt2025Controller.prototype.getPrompt2025TotalVersions)),

            async function Prompt2025Controller_getPrompt2025TotalVersions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPrompt2025Controller_getPrompt2025TotalVersions, request, response });

                const controller = new Prompt2025Controller();

              await templateService.apiHandler({
                methodName: 'getPrompt2025TotalVersions',
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
        const argsRequestController_getRequestCount: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"RequestQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/request/count/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequestCount)),

            async function RequestController_getRequestCount(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRequestController_getRequestCount, request, response });

                const controller = new RequestController();

              await templateService.apiHandler({
                methodName: 'getRequestCount',
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
        const argsRequestController_getRequests: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"RequestQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/request/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequests)),

            async function RequestController_getRequests(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRequestController_getRequests, request, response });

                const controller = new RequestController();

              await templateService.apiHandler({
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
        const argsRequestController_getRequestsClickhouse: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"RequestQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/request/query-clickhouse',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequestsClickhouse)),

            async function RequestController_getRequestsClickhouse(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRequestController_getRequestsClickhouse, request, response });

                const controller = new RequestController();

              await templateService.apiHandler({
                methodName: 'getRequestsClickhouse',
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
        const argsRequestController_getRequestById: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                includeBody: {"default":false,"in":"query","name":"includeBody","dataType":"boolean"},
        };
        app.get('/v1/request/:requestId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequestById)),

            async function RequestController_getRequestById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRequestController_getRequestById, request, response });

                const controller = new RequestController();

              await templateService.apiHandler({
                methodName: 'getRequestById',
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
        const argsRequestController_getRequestsByIds: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"requestIds":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/request/query-ids',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequestsByIds)),

            async function RequestController_getRequestsByIds(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRequestController_getRequestsByIds, request, response });

                const controller = new RequestController();

              await templateService.apiHandler({
                methodName: 'getRequestsByIds',
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
        const argsRequestController_feedbackRequest: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"rating":{"dataType":"boolean","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
        };
        app.post('/v1/request/:requestId/feedback',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.feedbackRequest)),

            async function RequestController_feedbackRequest(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRequestController_feedbackRequest, request, response });

                const controller = new RequestController();

              await templateService.apiHandler({
                methodName: 'feedbackRequest',
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
        const argsRequestController_putProperty: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"string","required":true},"key":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
        };
        app.put('/v1/request/:requestId/property',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.putProperty)),

            async function RequestController_putProperty(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRequestController_putProperty, request, response });

                const controller = new RequestController();

              await templateService.apiHandler({
                methodName: 'putProperty',
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
        const argsRequestController_getRequestAssetById: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                assetId: {"in":"path","name":"assetId","required":true,"dataType":"string"},
        };
        app.post('/v1/request/:requestId/assets/:assetId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequestAssetById)),

            async function RequestController_getRequestAssetById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRequestController_getRequestAssetById, request, response });

                const controller = new RequestController();

              await templateService.apiHandler({
                methodName: 'getRequestAssetById',
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
        const argsRequestController_addScores: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"ScoreRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
        };
        app.post('/v1/request/:requestId/score',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.addScores)),

            async function RequestController_addScores(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsRequestController_addScores, request, response });

                const controller = new RequestController();

              await templateService.apiHandler({
                methodName: 'addScores',
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
        const argsPromptController_hasPrompts: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/prompt/has-prompts',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.hasPrompts)),

            async function PromptController_hasPrompts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_hasPrompts, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'hasPrompts',
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
        const argsPromptController_getPrompts: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptsQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPrompts)),

            async function PromptController_getPrompts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_getPrompts, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'getPrompts',
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
        const argsPromptController_getPrompt: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
        };
        app.post('/v1/prompt/:promptId/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPrompt)),

            async function PromptController_getPrompt(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_getPrompt, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'getPrompt',
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
        const argsPromptController_deletePrompt: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
        };
        app.delete('/v1/prompt/:promptId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.deletePrompt)),

            async function PromptController_deletePrompt(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_deletePrompt, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'deletePrompt',
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
        const argsPromptController_createPrompt: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"ref":"Record_string.any_","required":true},"prompt":{"dataType":"any","required":true},"userDefinedId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/prompt/create',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.createPrompt)),

            async function PromptController_createPrompt(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_createPrompt, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'createPrompt',
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
        const argsPromptController_updatePromptUserDefinedId: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"userDefinedId":{"dataType":"string","required":true}}},
        };
        app.patch('/v1/prompt/:promptId/user-defined-id',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.updatePromptUserDefinedId)),

            async function PromptController_updatePromptUserDefinedId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_updatePromptUserDefinedId, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'updatePromptUserDefinedId',
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
        const argsPromptController_editPromptVersionLabel: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptEditSubversionLabelParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
        };
        app.post('/v1/prompt/version/:promptVersionId/edit-label',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.editPromptVersionLabel)),

            async function PromptController_editPromptVersionLabel(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_editPromptVersionLabel, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'editPromptVersionLabel',
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
        const argsPromptController_editPromptVersionTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptEditSubversionTemplateParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
        };
        app.post('/v1/prompt/version/:promptVersionId/edit-template',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.editPromptVersionTemplate)),

            async function PromptController_editPromptVersionTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_editPromptVersionTemplate, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'editPromptVersionTemplate',
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
        const argsPromptController_createSubversionFromUi: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptCreateSubversionParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
        };
        app.post('/v1/prompt/version/:promptVersionId/subversion-from-ui',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.createSubversionFromUi)),

            async function PromptController_createSubversionFromUi(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_createSubversionFromUi, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'createSubversionFromUi',
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
        const argsPromptController_createSubversion: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptCreateSubversionParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
        };
        app.post('/v1/prompt/version/:promptVersionId/subversion',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.createSubversion)),

            async function PromptController_createSubversion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_createSubversion, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'createSubversion',
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
        const argsPromptController_promotePromptVersionToProduction: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"previousProductionVersionId":{"dataType":"string","required":true}}},
        };
        app.post('/v1/prompt/version/:promptVersionId/promote',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.promotePromptVersionToProduction)),

            async function PromptController_promotePromptVersionToProduction(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_promotePromptVersionToProduction, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'promotePromptVersionToProduction',
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
        const argsPromptController_getInputs: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"random":{"dataType":"boolean"},"limit":{"dataType":"double","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
        };
        app.post('/v1/prompt/version/:promptVersionId/inputs/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getInputs)),

            async function PromptController_getInputs(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_getInputs, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'getInputs',
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
        const argsPromptController_getPromptExperiments: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
        };
        app.get('/v1/prompt/:promptId/experiments',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPromptExperiments)),

            async function PromptController_getPromptExperiments(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_getPromptExperiments, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'getPromptExperiments',
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
        const argsPromptController_getPromptVersions: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptVersionsQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
        };
        app.post('/v1/prompt/:promptId/versions/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPromptVersions)),

            async function PromptController_getPromptVersions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_getPromptVersions, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'getPromptVersions',
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
        const argsPromptController_getPromptVersion: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
        };
        app.get('/v1/prompt/version/:promptVersionId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPromptVersion)),

            async function PromptController_getPromptVersion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_getPromptVersion, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'getPromptVersion',
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
        const argsPromptController_deletePromptVersion: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
        };
        app.delete('/v1/prompt/version/:promptVersionId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.deletePromptVersion)),

            async function PromptController_deletePromptVersion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_deletePromptVersion, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'deletePromptVersion',
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
        const argsPromptController_getPromptVersionsCompiled: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptVersiosQueryParamsCompiled"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                user_defined_id: {"in":"path","name":"user_defined_id","required":true,"dataType":"string"},
        };
        app.post('/v1/prompt/:user_defined_id/compile',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPromptVersionsCompiled)),

            async function PromptController_getPromptVersionsCompiled(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_getPromptVersionsCompiled, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'getPromptVersionsCompiled',
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
        const argsPromptController_getPromptVersionTemplates: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptVersiosQueryParamsCompiled"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                user_defined_id: {"in":"path","name":"user_defined_id","required":true,"dataType":"string"},
        };
        app.post('/v1/prompt/:user_defined_id/template',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPromptVersionTemplates)),

            async function PromptController_getPromptVersionTemplates(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPromptController_getPromptVersionTemplates, request, response });

                const controller = new PromptController();

              await templateService.apiHandler({
                methodName: 'getPromptVersionTemplates',
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
        const argsExperimentV2Controller_createEmptyExperiment: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/create/empty',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createEmptyExperiment)),

            async function ExperimentV2Controller_createEmptyExperiment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_createEmptyExperiment, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'createEmptyExperiment',
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
        const argsExperimentV2Controller_createExperimentFromRequest: Record<string, TsoaRoute.ParameterSchema> = {
                requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/create/from-request/:requestId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createExperimentFromRequest)),

            async function ExperimentV2Controller_createExperimentFromRequest(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_createExperimentFromRequest, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'createExperimentFromRequest',
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
        const argsExperimentV2Controller_createNewExperiment: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"originalPromptVersion":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/new',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createNewExperiment)),

            async function ExperimentV2Controller_createNewExperiment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_createNewExperiment, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'createNewExperiment',
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
        const argsExperimentV2Controller_getExperiments: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v2/experiment',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getExperiments)),

            async function ExperimentV2Controller_getExperiments(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_getExperiments, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'getExperiments',
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
        const argsExperimentV2Controller_deleteExperiment: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v2/experiment/:experimentId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.deleteExperiment)),

            async function ExperimentV2Controller_deleteExperiment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_deleteExperiment, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'deleteExperiment',
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
        const argsExperimentV2Controller_getExperimentById: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v2/experiment/:experimentId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getExperimentById)),

            async function ExperimentV2Controller_getExperimentById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_getExperimentById, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'getExperimentById',
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
        const argsExperimentV2Controller_createNewPromptVersionForExperiment: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateNewPromptVersionForExperimentParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/:experimentId/prompt-version',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createNewPromptVersionForExperiment)),

            async function ExperimentV2Controller_createNewPromptVersionForExperiment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_createNewPromptVersionForExperiment, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'createNewPromptVersionForExperiment',
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
        const argsExperimentV2Controller_deletePromptVersion: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v2/experiment/:experimentId/prompt-version/:promptVersionId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.deletePromptVersion)),

            async function ExperimentV2Controller_deletePromptVersion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_deletePromptVersion, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'deletePromptVersion',
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
        const argsExperimentV2Controller_getPromptVersionsForExperiment: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v2/experiment/:experimentId/prompt-versions',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getPromptVersionsForExperiment)),

            async function ExperimentV2Controller_getPromptVersionsForExperiment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_getPromptVersionsForExperiment, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'getPromptVersionsForExperiment',
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
        const argsExperimentV2Controller_getInputKeysForExperiment: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v2/experiment/:experimentId/input-keys',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getInputKeysForExperiment)),

            async function ExperimentV2Controller_getInputKeysForExperiment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_getInputKeysForExperiment, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'getInputKeysForExperiment',
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
        const argsExperimentV2Controller_addManualRowToExperiment: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputs":{"ref":"Record_string.string_","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/:experimentId/add-manual-row',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.addManualRowToExperiment)),

            async function ExperimentV2Controller_addManualRowToExperiment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_addManualRowToExperiment, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'addManualRowToExperiment',
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
        const argsExperimentV2Controller_addManualRowsToExperimentBatch: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputs":{"dataType":"array","array":{"dataType":"refAlias","ref":"Record_string.string_"},"required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/:experimentId/add-manual-rows-batch',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.addManualRowsToExperimentBatch)),

            async function ExperimentV2Controller_addManualRowsToExperimentBatch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_addManualRowsToExperimentBatch, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'addManualRowsToExperimentBatch',
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
        const argsExperimentV2Controller_deleteExperimentTableRows: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputRecordIds":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v2/experiment/:experimentId/rows',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.deleteExperimentTableRows)),

            async function ExperimentV2Controller_deleteExperimentTableRows(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_deleteExperimentTableRows, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'deleteExperimentTableRows',
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
        const argsExperimentV2Controller_createExperimentTableRowBatch: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"rows":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"autoInputs":{"dataType":"array","array":{"dataType":"any"},"required":true},"inputs":{"ref":"Record_string.string_","required":true},"inputRecordId":{"dataType":"string","required":true}}},"required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/:experimentId/row/insert/batch',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createExperimentTableRowBatch)),

            async function ExperimentV2Controller_createExperimentTableRowBatch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_createExperimentTableRowBatch, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'createExperimentTableRowBatch',
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
        const argsExperimentV2Controller_createExperimentTableRowFromDataset: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/:experimentId/row/insert/dataset/:datasetId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createExperimentTableRowFromDataset)),

            async function ExperimentV2Controller_createExperimentTableRowFromDataset(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_createExperimentTableRowFromDataset, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'createExperimentTableRowFromDataset',
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
        const argsExperimentV2Controller_updateExperimentTableRow: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputs":{"ref":"Record_string.string_","required":true},"inputRecordId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/:experimentId/row/update',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.updateExperimentTableRow)),

            async function ExperimentV2Controller_updateExperimentTableRow(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_updateExperimentTableRow, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'updateExperimentTableRow',
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
        const argsExperimentV2Controller_runHypothesis: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputRecordId":{"dataType":"string","required":true},"promptVersionId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/:experimentId/run-hypothesis',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.runHypothesis)),

            async function ExperimentV2Controller_runHypothesis(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_runHypothesis, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'runHypothesis',
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
        const argsExperimentV2Controller_getExperimentEvaluators: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v2/experiment/:experimentId/evaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getExperimentEvaluators)),

            async function ExperimentV2Controller_getExperimentEvaluators(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_getExperimentEvaluators, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'getExperimentEvaluators',
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
        const argsExperimentV2Controller_createExperimentEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"evaluatorId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/:experimentId/evaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createExperimentEvaluator)),

            async function ExperimentV2Controller_createExperimentEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_createExperimentEvaluator, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'createExperimentEvaluator',
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
        const argsExperimentV2Controller_deleteExperimentEvaluator: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v2/experiment/:experimentId/evaluators/:evaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.deleteExperimentEvaluator)),

            async function ExperimentV2Controller_deleteExperimentEvaluator(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_deleteExperimentEvaluator, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'deleteExperimentEvaluator',
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
        const argsExperimentV2Controller_runExperimentEvaluators: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v2/experiment/:experimentId/evaluators/run',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.runExperimentEvaluators)),

            async function ExperimentV2Controller_runExperimentEvaluators(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_runExperimentEvaluators, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'runExperimentEvaluators',
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
        const argsExperimentV2Controller_shouldRunEvaluators: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v2/experiment/:experimentId/should-run-evaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.shouldRunEvaluators)),

            async function ExperimentV2Controller_shouldRunEvaluators(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_shouldRunEvaluators, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'shouldRunEvaluators',
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
        const argsExperimentV2Controller_getExperimentPromptVersionScores: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v2/experiment/:experimentId/:promptVersionId/scores',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getExperimentPromptVersionScores)),

            async function ExperimentV2Controller_getExperimentPromptVersionScores(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_getExperimentPromptVersionScores, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'getExperimentPromptVersionScores',
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
        const argsExperimentV2Controller_getExperimentScore: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                scoreKey: {"in":"path","name":"scoreKey","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v2/experiment/:experimentId/:requestId/:scoreKey',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getExperimentScore)),

            async function ExperimentV2Controller_getExperimentScore(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentV2Controller_getExperimentScore, request, response });

                const controller = new ExperimentV2Controller();

              await templateService.apiHandler({
                methodName: 'getExperimentScore',
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
        const argsStripeController_getCostForPrompts: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/stripe/subscription/cost-for-prompts',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.getCostForPrompts)),

            async function StripeController_getCostForPrompts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_getCostForPrompts, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'getCostForPrompts',
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
        const argsStripeController_getCostForEvals: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/stripe/subscription/cost-for-evals',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.getCostForEvals)),

            async function StripeController_getCostForEvals(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_getCostForEvals, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'getCostForEvals',
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
        const argsStripeController_getCostForExperiments: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/stripe/subscription/cost-for-experiments',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.getCostForExperiments)),

            async function StripeController_getCostForExperiments(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_getCostForExperiments, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'getCostForExperiments',
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
        const argsStripeController_getFreeUsage: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/stripe/subscription/free/usage',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.getFreeUsage)),

            async function StripeController_getFreeUsage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_getFreeUsage, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'getFreeUsage',
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
        const argsStripeController_upgradeToPro: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"UpgradeToProRequest"},
        };
        app.post('/v1/stripe/subscription/new-customer/upgrade-to-pro',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.upgradeToPro)),

            async function StripeController_upgradeToPro(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_upgradeToPro, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'upgradeToPro',
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
        const argsStripeController_upgradeExistingCustomer: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"UpgradeToProRequest"},
        };
        app.post('/v1/stripe/subscription/existing-customer/upgrade-to-pro',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.upgradeExistingCustomer)),

            async function StripeController_upgradeExistingCustomer(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_upgradeExistingCustomer, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'upgradeExistingCustomer',
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
        const argsStripeController_upgradeToTeamBundle: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","ref":"UpgradeToTeamBundleRequest"},
        };
        app.post('/v1/stripe/subscription/new-customer/upgrade-to-team-bundle',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.upgradeToTeamBundle)),

            async function StripeController_upgradeToTeamBundle(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_upgradeToTeamBundle, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'upgradeToTeamBundle',
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
        const argsStripeController_upgradeExistingCustomerToTeamBundle: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","ref":"UpgradeToTeamBundleRequest"},
        };
        app.post('/v1/stripe/subscription/existing-customer/upgrade-to-team-bundle',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.upgradeExistingCustomerToTeamBundle)),

            async function StripeController_upgradeExistingCustomerToTeamBundle(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_upgradeExistingCustomerToTeamBundle, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'upgradeExistingCustomerToTeamBundle',
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
        const argsStripeController_manageSubscription: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/stripe/subscription/manage-subscription',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.manageSubscription)),

            async function StripeController_manageSubscription(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_manageSubscription, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'manageSubscription',
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
        const argsStripeController_undoCancelSubscription: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/stripe/subscription/undo-cancel-subscription',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.undoCancelSubscription)),

            async function StripeController_undoCancelSubscription(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_undoCancelSubscription, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'undoCancelSubscription',
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
        const argsStripeController_addOns: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                productType: {"in":"path","name":"productType","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["alerts"]},{"dataType":"enum","enums":["prompts"]},{"dataType":"enum","enums":["experiments"]},{"dataType":"enum","enums":["evals"]}]},
        };
        app.post('/v1/stripe/subscription/add-ons/:productType',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.addOns)),

            async function StripeController_addOns(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_addOns, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'addOns',
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
        const argsStripeController_deleteAddOns: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                productType: {"in":"path","name":"productType","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["alerts"]},{"dataType":"enum","enums":["prompts"]},{"dataType":"enum","enums":["experiments"]},{"dataType":"enum","enums":["evals"]}]},
        };
        app.delete('/v1/stripe/subscription/add-ons/:productType',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.deleteAddOns)),

            async function StripeController_deleteAddOns(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_deleteAddOns, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'deleteAddOns',
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
        const argsStripeController_previewInvoice: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/stripe/subscription/preview-invoice',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.previewInvoice)),

            async function StripeController_previewInvoice(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_previewInvoice, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'previewInvoice',
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
        const argsStripeController_cancelSubscription: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/stripe/subscription/cancel-subscription',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.cancelSubscription)),

            async function StripeController_cancelSubscription(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_cancelSubscription, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'cancelSubscription',
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
        const argsStripeController_migrateToPro: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/stripe/subscription/migrate-to-pro',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.migrateToPro)),

            async function StripeController_migrateToPro(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_migrateToPro, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'migrateToPro',
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
        const argsStripeController_getSubscription: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/stripe/subscription',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.getSubscription)),

            async function StripeController_getSubscription(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_getSubscription, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'getSubscription',
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
        const argsStripeController_handleStripeWebhook: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"any"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/stripe/webhook',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.handleStripeWebhook)),

            async function StripeController_handleStripeWebhook(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStripeController_handleStripeWebhook, request, response });

                const controller = new StripeController();

              await templateService.apiHandler({
                methodName: 'handleStripeWebhook',
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
        const argsTraceController_logCustomTraceLegacy: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                traceBody: {"in":"body","name":"traceBody","required":true,"dataType":"any"},
        };
        app.post('/v1/trace/custom/v1/log',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TraceController)),
            ...(fetchMiddlewares<RequestHandler>(TraceController.prototype.logCustomTraceLegacy)),

            async function TraceController_logCustomTraceLegacy(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTraceController_logCustomTraceLegacy, request, response });

                const controller = new TraceController();

              await templateService.apiHandler({
                methodName: 'logCustomTraceLegacy',
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
        const argsTraceController_logCustomTrace: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                traceBody: {"in":"body","name":"traceBody","required":true,"dataType":"any"},
        };
        app.post('/v1/trace/custom/log',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TraceController)),
            ...(fetchMiddlewares<RequestHandler>(TraceController.prototype.logCustomTrace)),

            async function TraceController_logCustomTrace(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTraceController_logCustomTrace, request, response });

                const controller = new TraceController();

              await templateService.apiHandler({
                methodName: 'logCustomTrace',
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
        const argsTraceController_logCustomTraceTyped: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                traceBody: {"in":"body","name":"traceBody","required":true,"ref":"TypedAsyncLogModel"},
        };
        app.post('/v1/trace/custom/log/typed',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TraceController)),
            ...(fetchMiddlewares<RequestHandler>(TraceController.prototype.logCustomTraceTyped)),

            async function TraceController_logCustomTraceTyped(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTraceController_logCustomTraceTyped, request, response });

                const controller = new TraceController();

              await templateService.apiHandler({
                methodName: 'logCustomTraceTyped',
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
        const argsTraceController_logTrace: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                traceBody: {"in":"body","name":"traceBody","required":true,"ref":"OTELTrace"},
        };
        app.post('/v1/trace/log',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TraceController)),
            ...(fetchMiddlewares<RequestHandler>(TraceController.prototype.logTrace)),

            async function TraceController_logTrace(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTraceController_logTrace, request, response });

                const controller = new TraceController();

              await templateService.apiHandler({
                methodName: 'logTrace',
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
        const argsTraceController_logPythonTrace: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                traceBody: {"in":"body","name":"traceBody","required":true,"dataType":"any"},
        };
        app.post('/v1/trace/log-python',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TraceController)),
            ...(fetchMiddlewares<RequestHandler>(TraceController.prototype.logPythonTrace)),

            async function TraceController_logPythonTrace(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTraceController_logPythonTrace, request, response });

                const controller = new TraceController();

              await templateService.apiHandler({
                methodName: 'logPythonTrace',
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
        const argsSessionController_hasSession: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/session/has-session',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.hasSession)),

            async function SessionController_hasSession(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_hasSession, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'hasSession',
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
        const argsSessionController_getSessions: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"SessionQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/session/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.getSessions)),

            async function SessionController_getSessions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_getSessions, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'getSessions',
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
        const argsSessionController_getNames: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"SessionNameQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/session/name/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.getNames)),

            async function SessionController_getNames(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_getNames, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'getNames',
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
        const argsSessionController_getMetrics: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"SessionMetricsQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/session/metrics/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.getMetrics)),

            async function SessionController_getMetrics(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_getMetrics, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'getMetrics',
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
        const argsSessionController_updateSessionFeedback: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"rating":{"dataType":"boolean","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/session/:sessionId/feedback',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.updateSessionFeedback)),

            async function SessionController_updateSessionFeedback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_updateSessionFeedback, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'updateSessionFeedback',
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
        const argsSessionController_getSessionTag: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/session/:sessionId/tag',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.getSessionTag)),

            async function SessionController_getSessionTag(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_getSessionTag, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'getSessionTag',
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
        const argsSessionController_updateSessionTag: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"tag":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/session/:sessionId/tag',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.updateSessionTag)),

            async function SessionController_updateSessionTag(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_updateSessionTag, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'updateSessionTag',
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
        const argsStatusController_getAllProviderStatus: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/public/status/provider',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StatusController)),
            ...(fetchMiddlewares<RequestHandler>(StatusController.prototype.getAllProviderStatus)),

            async function StatusController_getAllProviderStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStatusController_getAllProviderStatus, request, response });

                const controller = new StatusController();

              await templateService.apiHandler({
                methodName: 'getAllProviderStatus',
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
        const argsStatusController_getProviderStatus: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                provider: {"in":"path","name":"provider","required":true,"dataType":"string"},
                timeFrame: {"in":"query","name":"timeFrame","required":true,"ref":"TimeFrame"},
        };
        app.get('/v1/public/status/provider/:provider',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StatusController)),
            ...(fetchMiddlewares<RequestHandler>(StatusController.prototype.getProviderStatus)),

            async function StatusController_getProviderStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsStatusController_getProviderStatus, request, response });

                const controller = new StatusController();

              await templateService.apiHandler({
                methodName: 'getProviderStatus',
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
        const argsPropertyController_getProperties: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/property/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PropertyController)),
            ...(fetchMiddlewares<RequestHandler>(PropertyController.prototype.getProperties)),

            async function PropertyController_getProperties(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPropertyController_getProperties, request, response });

                const controller = new PropertyController();

              await templateService.apiHandler({
                methodName: 'getProperties',
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
        const argsPropertyController_searchProperties: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                propertyKey: {"in":"path","name":"propertyKey","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"searchTerm":{"dataType":"string","required":true}}},
        };
        app.post('/v1/property/:propertyKey/search',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PropertyController)),
            ...(fetchMiddlewares<RequestHandler>(PropertyController.prototype.searchProperties)),

            async function PropertyController_searchProperties(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPropertyController_searchProperties, request, response });

                const controller = new PropertyController();

              await templateService.apiHandler({
                methodName: 'searchProperties',
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
        const argsPropertyController_getTopCosts: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                propertyKey: {"in":"path","name":"propertyKey","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"TimeFilterRequest"},
        };
        app.post('/v1/property/:propertyKey/top-costs/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PropertyController)),
            ...(fetchMiddlewares<RequestHandler>(PropertyController.prototype.getTopCosts)),

            async function PropertyController_getTopCosts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPropertyController_getTopCosts, request, response });

                const controller = new PropertyController();

              await templateService.apiHandler({
                methodName: 'getTopCosts',
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
        const argsPlaygroundController_generate: Record<string, TsoaRoute.ParameterSchema> = {
                bodyParams: {"in":"body","name":"bodyParams","required":true,"dataType":"intersection","subSchemas":[{"ref":"OpenAIChatRequest"},{"dataType":"nestedObjectLiteral","nestedProperties":{"logRequest":{"dataType":"boolean"},"useAIGateway":{"dataType":"boolean"}}}]},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/playground/generate',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlaygroundController)),
            ...(fetchMiddlewares<RequestHandler>(PlaygroundController.prototype.generate)),

            async function PlaygroundController_generate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlaygroundController_generate, request, response });

                const controller = new PlaygroundController();

              await templateService.apiHandler({
                methodName: 'generate',
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
        const argsPlaygroundController_requestsThroughHelicone: Record<string, TsoaRoute.ParameterSchema> = {
                params: {"in":"body","name":"params","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"requestsThroughHelicone":{"dataType":"boolean","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/playground/requests-through-helicone',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlaygroundController)),
            ...(fetchMiddlewares<RequestHandler>(PlaygroundController.prototype.requestsThroughHelicone)),

            async function PlaygroundController_requestsThroughHelicone(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlaygroundController_requestsThroughHelicone, request, response });

                const controller = new PlaygroundController();

              await templateService.apiHandler({
                methodName: 'requestsThroughHelicone',
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
        const argsPlaygroundController_getRequestsThroughHelicone: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/playground/requests-through-helicone',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PlaygroundController)),
            ...(fetchMiddlewares<RequestHandler>(PlaygroundController.prototype.getRequestsThroughHelicone)),

            async function PlaygroundController_getRequestsThroughHelicone(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPlaygroundController_getRequestsThroughHelicone, request, response });

                const controller = new PlaygroundController();

              await templateService.apiHandler({
                methodName: 'getRequestsThroughHelicone',
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
        const argsPiPublicController_getApiKey: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"sessionUUID":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/pi/get-api-key',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiPublicController)),
            ...(fetchMiddlewares<RequestHandler>(PiPublicController.prototype.getApiKey)),

            async function PiPublicController_getApiKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPiPublicController_getApiKey, request, response });

                const controller = new PiPublicController();

              await templateService.apiHandler({
                methodName: 'getApiKey',
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
        const argsPiController_addSession: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"sessionUUID":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/pi/session',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiController)),
            ...(fetchMiddlewares<RequestHandler>(PiController.prototype.addSession)),

            async function PiController_addSession(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPiController_addSession, request, response });

                const controller = new PiController();

              await templateService.apiHandler({
                methodName: 'addSession',
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
        const argsPiController_getOrgName: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/pi/org-name/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiController)),
            ...(fetchMiddlewares<RequestHandler>(PiController.prototype.getOrgName)),

            async function PiController_getOrgName(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPiController_getOrgName, request, response });

                const controller = new PiController();

              await templateService.apiHandler({
                methodName: 'getOrgName',
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
        const argsPiController_getTotalCosts: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/pi/total-costs',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiController)),
            ...(fetchMiddlewares<RequestHandler>(PiController.prototype.getTotalCosts)),

            async function PiController_getTotalCosts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPiController_getTotalCosts, request, response });

                const controller = new PiController();

              await templateService.apiHandler({
                methodName: 'getTotalCosts',
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
        const argsPiController_piGetTotalRequests: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/pi/total_requests',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiController)),
            ...(fetchMiddlewares<RequestHandler>(PiController.prototype.piGetTotalRequests)),

            async function PiController_piGetTotalRequests(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPiController_piGetTotalRequests, request, response });

                const controller = new PiController();

              await templateService.apiHandler({
                methodName: 'piGetTotalRequests',
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
        const argsPiController_getCostsOverTime: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataOverTimeRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/pi/costs-over-time/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiController)),
            ...(fetchMiddlewares<RequestHandler>(PiController.prototype.getCostsOverTime)),

            async function PiController_getCostsOverTime(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPiController_getCostsOverTime, request, response });

                const controller = new PiController();

              await templateService.apiHandler({
                methodName: 'getCostsOverTime',
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
        const argsModelRegistryController_getModelRegistry: Record<string, TsoaRoute.ParameterSchema> = {
                providers: {"in":"query","name":"providers","dataType":"string"},
                authors: {"in":"query","name":"authors","dataType":"string"},
                inputModalities: {"in":"query","name":"inputModalities","dataType":"string"},
                outputModalities: {"in":"query","name":"outputModalities","dataType":"string"},
                parameters: {"in":"query","name":"parameters","dataType":"string"},
                capabilities: {"in":"query","name":"capabilities","dataType":"string"},
                priceMin: {"in":"query","name":"priceMin","dataType":"double"},
                priceMax: {"in":"query","name":"priceMax","dataType":"double"},
                contextMin: {"in":"query","name":"contextMin","dataType":"double"},
                search: {"in":"query","name":"search","dataType":"string"},
                sort: {"in":"query","name":"sort","ref":"SortOption"},
                limit: {"in":"query","name":"limit","dataType":"double"},
                offset: {"in":"query","name":"offset","dataType":"double"},
        };
        app.get('/v1/public/model-registry/models',
            ...(fetchMiddlewares<RequestHandler>(ModelRegistryController)),
            ...(fetchMiddlewares<RequestHandler>(ModelRegistryController.prototype.getModelRegistry)),

            async function ModelRegistryController_getModelRegistry(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelRegistryController_getModelRegistry, request, response });

                const controller = new ModelRegistryController();

              await templateService.apiHandler({
                methodName: 'getModelRegistry',
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
        const argsModelComparisonController_getModelComparison: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                modelsToCompare: {"in":"body","name":"modelsToCompare","required":true,"dataType":"array","array":{"dataType":"refAlias","ref":"ModelsToCompare"}},
        };
        app.post('/v1/public/compare/models',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ModelComparisonController)),
            ...(fetchMiddlewares<RequestHandler>(ModelComparisonController.prototype.getModelComparison)),

            async function ModelComparisonController_getModelComparison(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelComparisonController_getModelComparison, request, response });

                const controller = new ModelComparisonController();

              await templateService.apiHandler({
                methodName: 'getModelComparison',
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
        const argsModelController_getModels: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/models',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.getModels)),

            async function ModelController_getModels(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsModelController_getModels, request, response });

                const controller = new ModelController();

              await templateService.apiHandler({
                methodName: 'getModels',
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
        const argsLLMSecurityController_getSecurity: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"text":{"dataType":"string","required":true},"advanced":{"dataType":"boolean","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/security',
            ...(fetchMiddlewares<RequestHandler>(LLMSecurityController)),
            ...(fetchMiddlewares<RequestHandler>(LLMSecurityController.prototype.getSecurity)),

            async function LLMSecurityController_getSecurity(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLLMSecurityController_getSecurity, request, response });

                const controller = new LLMSecurityController();

              await templateService.apiHandler({
                methodName: 'getSecurity',
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
        const argsIntegrationController_createIntegration: Record<string, TsoaRoute.ParameterSchema> = {
                params: {"in":"body","name":"params","required":true,"ref":"IntegrationCreateParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/integration',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.createIntegration)),

            async function IntegrationController_createIntegration(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationController_createIntegration, request, response });

                const controller = new IntegrationController();

              await templateService.apiHandler({
                methodName: 'createIntegration',
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
        const argsIntegrationController_getIntegrations: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/integration',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getIntegrations)),

            async function IntegrationController_getIntegrations(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationController_getIntegrations, request, response });

                const controller = new IntegrationController();

              await templateService.apiHandler({
                methodName: 'getIntegrations',
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
        const argsIntegrationController_updateIntegration: Record<string, TsoaRoute.ParameterSchema> = {
                integrationId: {"in":"path","name":"integrationId","required":true,"dataType":"string"},
                params: {"in":"body","name":"params","required":true,"ref":"IntegrationUpdateParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/integration/:integrationId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.updateIntegration)),

            async function IntegrationController_updateIntegration(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationController_updateIntegration, request, response });

                const controller = new IntegrationController();

              await templateService.apiHandler({
                methodName: 'updateIntegration',
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
        const argsIntegrationController_getIntegration: Record<string, TsoaRoute.ParameterSchema> = {
                integrationId: {"in":"path","name":"integrationId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/integration/:integrationId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getIntegration)),

            async function IntegrationController_getIntegration(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationController_getIntegration, request, response });

                const controller = new IntegrationController();

              await templateService.apiHandler({
                methodName: 'getIntegration',
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
        const argsIntegrationController_getIntegrationByType: Record<string, TsoaRoute.ParameterSchema> = {
                type: {"in":"path","name":"type","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/integration/type/:type',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getIntegrationByType)),

            async function IntegrationController_getIntegrationByType(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationController_getIntegrationByType, request, response });

                const controller = new IntegrationController();

              await templateService.apiHandler({
                methodName: 'getIntegrationByType',
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
        const argsIntegrationController_getSlackSettings: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/integration/slack/settings',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getSlackSettings)),

            async function IntegrationController_getSlackSettings(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationController_getSlackSettings, request, response });

                const controller = new IntegrationController();

              await templateService.apiHandler({
                methodName: 'getSlackSettings',
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
        const argsIntegrationController_getSlackChannels: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/integration/slack/channels',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getSlackChannels)),

            async function IntegrationController_getSlackChannels(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationController_getSlackChannels, request, response });

                const controller = new IntegrationController();

              await templateService.apiHandler({
                methodName: 'getSlackChannels',
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
        const argsHeliconeSqlController_getClickHouseSchema: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/helicone-sql/schema',
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController.prototype.getClickHouseSchema)),

            async function HeliconeSqlController_getClickHouseSchema(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeSqlController_getClickHouseSchema, request, response });

                const controller = new HeliconeSqlController();

              await templateService.apiHandler({
                methodName: 'getClickHouseSchema',
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
        const argsHeliconeSqlController_executeSql: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"ExecuteSqlRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/helicone-sql/execute',
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController.prototype.executeSql)),

            async function HeliconeSqlController_executeSql(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeSqlController_executeSql, request, response });

                const controller = new HeliconeSqlController();

              await templateService.apiHandler({
                methodName: 'executeSql',
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
        const argsHeliconeSqlController_downloadCsv: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"ExecuteSqlRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/helicone-sql/download',
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController.prototype.downloadCsv)),

            async function HeliconeSqlController_downloadCsv(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeSqlController_downloadCsv, request, response });

                const controller = new HeliconeSqlController();

              await templateService.apiHandler({
                methodName: 'downloadCsv',
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
        const argsHeliconeSqlController_getSavedQueries: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/helicone-sql/saved-queries',
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController.prototype.getSavedQueries)),

            async function HeliconeSqlController_getSavedQueries(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeSqlController_getSavedQueries, request, response });

                const controller = new HeliconeSqlController();

              await templateService.apiHandler({
                methodName: 'getSavedQueries',
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
        const argsHeliconeSqlController_getSavedQuery: Record<string, TsoaRoute.ParameterSchema> = {
                queryId: {"in":"path","name":"queryId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/helicone-sql/saved-query/:queryId',
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController.prototype.getSavedQuery)),

            async function HeliconeSqlController_getSavedQuery(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeSqlController_getSavedQuery, request, response });

                const controller = new HeliconeSqlController();

              await templateService.apiHandler({
                methodName: 'getSavedQuery',
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
        const argsHeliconeSqlController_deleteSavedQuery: Record<string, TsoaRoute.ParameterSchema> = {
                queryId: {"in":"path","name":"queryId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v1/helicone-sql/saved-query/:queryId',
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController.prototype.deleteSavedQuery)),

            async function HeliconeSqlController_deleteSavedQuery(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeSqlController_deleteSavedQuery, request, response });

                const controller = new HeliconeSqlController();

              await templateService.apiHandler({
                methodName: 'deleteSavedQuery',
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
        const argsHeliconeSqlController_createSavedQuery: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateSavedQueryRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/helicone-sql/saved-query',
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController.prototype.createSavedQuery)),

            async function HeliconeSqlController_createSavedQuery(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeSqlController_createSavedQuery, request, response });

                const controller = new HeliconeSqlController();

              await templateService.apiHandler({
                methodName: 'createSavedQuery',
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
        const argsHeliconeSqlController_updateSavedQuery: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateSavedQueryRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/v1/helicone-sql/saved-query',
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeSqlController.prototype.updateSavedQuery)),

            async function HeliconeSqlController_updateSavedQuery(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeSqlController_updateSavedQuery, request, response });

                const controller = new HeliconeSqlController();

              await templateService.apiHandler({
                methodName: 'updateSavedQuery',
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
        const argsExperimentController_createNewEmptyExperiment: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"datasetId":{"dataType":"string","required":true},"metadata":{"ref":"Record_string.string_","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/new-empty',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createNewEmptyExperiment)),

            async function ExperimentController_createNewEmptyExperiment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_createNewEmptyExperiment, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'createNewEmptyExperiment',
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
        const argsExperimentController_createNewExperimentTable: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateExperimentTableParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/table/new',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createNewExperimentTable)),

            async function ExperimentController_createNewExperimentTable(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_createNewExperimentTable, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'createNewExperimentTable',
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
        const argsExperimentController_getExperimentTableById: Record<string, TsoaRoute.ParameterSchema> = {
                experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/table/:experimentTableId/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentTableById)),

            async function ExperimentController_getExperimentTableById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_getExperimentTableById, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'getExperimentTableById',
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
        const argsExperimentController_getExperimentTableMetadata: Record<string, TsoaRoute.ParameterSchema> = {
                experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/table/:experimentTableId/metadata/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentTableMetadata)),

            async function ExperimentController_getExperimentTableMetadata(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_getExperimentTableMetadata, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'getExperimentTableMetadata',
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
        const argsExperimentController_getExperimentTables: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/tables/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentTables)),

            async function ExperimentController_getExperimentTables(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_getExperimentTables, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'getExperimentTables',
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
        const argsExperimentController_createExperimentCell: Record<string, TsoaRoute.ParameterSchema> = {
                experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"rowIndex":{"dataType":"double","required":true},"columnId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/table/:experimentTableId/cell',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createExperimentCell)),

            async function ExperimentController_createExperimentCell(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_createExperimentCell, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'createExperimentCell',
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
        const argsExperimentController_updateExperimentCell: Record<string, TsoaRoute.ParameterSchema> = {
                experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"updateInputs":{"dataType":"boolean"},"metadata":{"dataType":"string"},"value":{"dataType":"string"},"status":{"dataType":"string"},"cellId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/v1/experiment/table/:experimentTableId/cell',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.updateExperimentCell)),

            async function ExperimentController_updateExperimentCell(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_updateExperimentCell, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'updateExperimentCell',
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
        const argsExperimentController_createExperimentColumn: Record<string, TsoaRoute.ParameterSchema> = {
                experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputKeys":{"dataType":"array","array":{"dataType":"string"}},"promptVersionId":{"dataType":"string"},"hypothesisId":{"dataType":"string"},"columnType":{"dataType":"string","required":true},"columnName":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/table/:experimentTableId/column',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createExperimentColumn)),

            async function ExperimentController_createExperimentColumn(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_createExperimentColumn, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'createExperimentColumn',
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
        const argsExperimentController_createExperimentTableRow: Record<string, TsoaRoute.ParameterSchema> = {
                experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputs":{"ref":"Record_string.string_"},"sourceRequest":{"dataType":"string"},"promptVersionId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/table/:experimentTableId/row/new',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createExperimentTableRow)),

            async function ExperimentController_createExperimentTableRow(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_createExperimentTableRow, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'createExperimentTableRow',
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
        const argsExperimentController_deleteExperimentTableRow: Record<string, TsoaRoute.ParameterSchema> = {
                experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                rowIndex: {"in":"path","name":"rowIndex","required":true,"dataType":"double"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v1/experiment/table/:experimentTableId/row/:rowIndex',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.deleteExperimentTableRow)),

            async function ExperimentController_deleteExperimentTableRow(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_deleteExperimentTableRow, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'deleteExperimentTableRow',
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
        const argsExperimentController_createExperimentTableRowWithCellsBatch: Record<string, TsoaRoute.ParameterSchema> = {
                experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"rows":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"sourceRequest":{"dataType":"string"},"cells":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"dataType":"any"},"value":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"columnId":{"dataType":"string","required":true}}},"required":true},"datasetId":{"dataType":"string","required":true},"inputs":{"ref":"Record_string.string_","required":true},"inputRecordId":{"dataType":"string","required":true}}},"required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/table/:experimentTableId/row/insert/batch',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createExperimentTableRowWithCellsBatch)),

            async function ExperimentController_createExperimentTableRowWithCellsBatch(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_createExperimentTableRowWithCellsBatch, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'createExperimentTableRowWithCellsBatch',
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
        const argsExperimentController_updateExperimentMeta: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"meta":{"ref":"Record_string.string_","required":true},"experimentId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/update-meta',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.updateExperimentMeta)),

            async function ExperimentController_updateExperimentMeta(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_updateExperimentMeta, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'updateExperimentMeta',
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
        const argsExperimentController_createNewExperimentOld: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"NewExperimentParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createNewExperimentOld)),

            async function ExperimentController_createNewExperimentOld(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_createNewExperimentOld, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'createNewExperimentOld',
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
        const argsExperimentController_createNewExperimentHypothesis: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["PENDING"]},{"dataType":"enum","enums":["RUNNING"]},{"dataType":"enum","enums":["COMPLETED"]},{"dataType":"enum","enums":["FAILED"]}],"required":true},"providerKeyId":{"dataType":"string","required":true},"promptVersion":{"dataType":"string","required":true},"model":{"dataType":"string","required":true},"experimentId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/hypothesis',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createNewExperimentHypothesis)),

            async function ExperimentController_createNewExperimentHypothesis(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_createNewExperimentHypothesis, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'createNewExperimentHypothesis',
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
        const argsExperimentController_getExperimentHypothesisScores: Record<string, TsoaRoute.ParameterSchema> = {
                hypothesisId: {"in":"path","name":"hypothesisId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/hypothesis/:hypothesisId/scores/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentHypothesisScores)),

            async function ExperimentController_getExperimentHypothesisScores(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_getExperimentHypothesisScores, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'getExperimentHypothesisScores',
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
        const argsExperimentController_getExperimentEvaluators: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/experiment/:experimentId/evaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentEvaluators)),

            async function ExperimentController_getExperimentEvaluators(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_getExperimentEvaluators, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'getExperimentEvaluators',
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
        const argsExperimentController_runExperimentEvaluatorsOld: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/:experimentId/evaluators/run',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.runExperimentEvaluatorsOld)),

            async function ExperimentController_runExperimentEvaluatorsOld(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_runExperimentEvaluatorsOld, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'runExperimentEvaluatorsOld',
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
        const argsExperimentController_createExperimentEvaluatorOld: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"evaluatorId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/:experimentId/evaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createExperimentEvaluatorOld)),

            async function ExperimentController_createExperimentEvaluatorOld(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_createExperimentEvaluatorOld, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'createExperimentEvaluatorOld',
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
        const argsExperimentController_deleteExperimentEvaluatorOld: Record<string, TsoaRoute.ParameterSchema> = {
                experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v1/experiment/:experimentId/evaluators/:evaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.deleteExperimentEvaluatorOld)),

            async function ExperimentController_deleteExperimentEvaluatorOld(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_deleteExperimentEvaluatorOld, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'deleteExperimentEvaluatorOld',
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
        const argsExperimentController_getExperimentsOld: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"include":{"ref":"IncludeExperimentKeys"},"filter":{"ref":"ExperimentFilterNode","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentsOld)),

            async function ExperimentController_getExperimentsOld(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentController_getExperimentsOld, request, response });

                const controller = new ExperimentController();

              await templateService.apiHandler({
                methodName: 'getExperimentsOld',
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
        const argsExperimentDatasetController_addDataset: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"NewDatasetParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/dataset',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.addDataset)),

            async function ExperimentDatasetController_addDataset(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentDatasetController_addDataset, request, response });

                const controller = new ExperimentDatasetController();

              await templateService.apiHandler({
                methodName: 'addDataset',
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
        const argsExperimentDatasetController_addRandomDataset: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"RandomDatasetParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/dataset/random',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.addRandomDataset)),

            async function ExperimentDatasetController_addRandomDataset(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentDatasetController_addRandomDataset, request, response });

                const controller = new ExperimentDatasetController();

              await templateService.apiHandler({
                methodName: 'addRandomDataset',
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
        const argsExperimentDatasetController_getDatasets: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"promptVersionId":{"dataType":"string"}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/dataset/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.getDatasets)),

            async function ExperimentDatasetController_getDatasets(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentDatasetController_getDatasets, request, response });

                const controller = new ExperimentDatasetController();

              await templateService.apiHandler({
                methodName: 'getDatasets',
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
        const argsExperimentDatasetController_insertDatasetRow: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"originalColumnId":{"dataType":"string"},"inputs":{"ref":"Record_string.string_","required":true},"inputRecordId":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
        };
        app.post('/v1/experiment/dataset/:datasetId/row/insert',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.insertDatasetRow)),

            async function ExperimentDatasetController_insertDatasetRow(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentDatasetController_insertDatasetRow, request, response });

                const controller = new ExperimentDatasetController();

              await templateService.apiHandler({
                methodName: 'insertDatasetRow',
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
        const argsExperimentDatasetController_createDatasetRow: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"sourceRequest":{"dataType":"string"},"inputs":{"ref":"Record_string.string_","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
        };
        app.post('/v1/experiment/dataset/:datasetId/version/:promptVersionId/row/new',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.createDatasetRow)),

            async function ExperimentDatasetController_createDatasetRow(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentDatasetController_createDatasetRow, request, response });

                const controller = new ExperimentDatasetController();

              await templateService.apiHandler({
                methodName: 'createDatasetRow',
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
        const argsExperimentDatasetController_getDataset: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
        };
        app.post('/v1/experiment/dataset/:datasetId/inputs/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.getDataset)),

            async function ExperimentDatasetController_getDataset(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentDatasetController_getDataset, request, response });

                const controller = new ExperimentDatasetController();

              await templateService.apiHandler({
                methodName: 'getDataset',
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
        const argsExperimentDatasetController_mutateDataset: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"removeRequests":{"dataType":"array","array":{"dataType":"string"},"required":true},"addRequests":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/experiment/dataset/:datasetId/mutate',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.mutateDataset)),

            async function ExperimentDatasetController_mutateDataset(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsExperimentDatasetController_mutateDataset, request, response });

                const controller = new ExperimentDatasetController();

              await templateService.apiHandler({
                methodName: 'mutateDataset',
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
        const argsHeliconeDatasetController_addHeliconeDataset: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"NewHeliconeDatasetParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/helicone-dataset',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.addHeliconeDataset)),

            async function HeliconeDatasetController_addHeliconeDataset(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeDatasetController_addHeliconeDataset, request, response });

                const controller = new HeliconeDatasetController();

              await templateService.apiHandler({
                methodName: 'addHeliconeDataset',
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
        const argsHeliconeDatasetController_mutateHeliconeDataset: Record<string, TsoaRoute.ParameterSchema> = {
                datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"MutateParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/helicone-dataset/:datasetId/mutate',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.mutateHeliconeDataset)),

            async function HeliconeDatasetController_mutateHeliconeDataset(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeDatasetController_mutateHeliconeDataset, request, response });

                const controller = new HeliconeDatasetController();

              await templateService.apiHandler({
                methodName: 'mutateHeliconeDataset',
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
        const argsHeliconeDatasetController_queryHeliconeDatasetRows: Record<string, TsoaRoute.ParameterSchema> = {
                datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double","required":true},"offset":{"dataType":"double","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/helicone-dataset/:datasetId/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.queryHeliconeDatasetRows)),

            async function HeliconeDatasetController_queryHeliconeDatasetRows(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeDatasetController_queryHeliconeDatasetRows, request, response });

                const controller = new HeliconeDatasetController();

              await templateService.apiHandler({
                methodName: 'queryHeliconeDatasetRows',
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
        const argsHeliconeDatasetController_countHeliconeDatasetRows: Record<string, TsoaRoute.ParameterSchema> = {
                datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/helicone-dataset/:datasetId/count',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.countHeliconeDatasetRows)),

            async function HeliconeDatasetController_countHeliconeDatasetRows(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeDatasetController_countHeliconeDatasetRows, request, response });

                const controller = new HeliconeDatasetController();

              await templateService.apiHandler({
                methodName: 'countHeliconeDatasetRows',
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
        const argsHeliconeDatasetController_queryHeliconeDataset: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"datasetIds":{"dataType":"array","array":{"dataType":"string"}}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/helicone-dataset/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.queryHeliconeDataset)),

            async function HeliconeDatasetController_queryHeliconeDataset(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeDatasetController_queryHeliconeDataset, request, response });

                const controller = new HeliconeDatasetController();

              await templateService.apiHandler({
                methodName: 'queryHeliconeDataset',
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
        const argsHeliconeDatasetController_updateHeliconeDatasetRequest: Record<string, TsoaRoute.ParameterSchema> = {
                datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"responseBody":{"ref":"Json","required":true},"requestBody":{"ref":"Json","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/helicone-dataset/:datasetId/request/:requestId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.updateHeliconeDatasetRequest)),

            async function HeliconeDatasetController_updateHeliconeDatasetRequest(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeDatasetController_updateHeliconeDatasetRequest, request, response });

                const controller = new HeliconeDatasetController();

              await templateService.apiHandler({
                methodName: 'updateHeliconeDatasetRequest',
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
        const argsHeliconeDatasetController_deleteHeliconeDataset: Record<string, TsoaRoute.ParameterSchema> = {
                datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/helicone-dataset/:datasetId/delete',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.deleteHeliconeDataset)),

            async function HeliconeDatasetController_deleteHeliconeDataset(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHeliconeDatasetController_deleteHeliconeDataset, request, response });

                const controller = new HeliconeDatasetController();

              await templateService.apiHandler({
                methodName: 'deleteHeliconeDataset',
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
        const argsGatewayController_getRouters: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/gateway',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GatewayController)),
            ...(fetchMiddlewares<RequestHandler>(GatewayController.prototype.getRouters)),

            async function GatewayController_getRouters(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGatewayController_getRouters, request, response });

                const controller = new GatewayController();

              await templateService.apiHandler({
                methodName: 'getRouters',
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
        const argsGatewayController_getLatestRouterConfig: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                routerHash: {"in":"path","name":"routerHash","required":true,"dataType":"string"},
        };
        app.get('/v1/gateway/:routerHash',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GatewayController)),
            ...(fetchMiddlewares<RequestHandler>(GatewayController.prototype.getLatestRouterConfig)),

            async function GatewayController_getLatestRouterConfig(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGatewayController_getLatestRouterConfig, request, response });

                const controller = new GatewayController();

              await templateService.apiHandler({
                methodName: 'getLatestRouterConfig',
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
        const argsGatewayController_getRouterRequestsOverTime: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                routerHash: {"in":"path","name":"routerHash","required":true,"dataType":"string"},
        };
        app.get('/v1/gateway/:routerHash/requests-over-time',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GatewayController)),
            ...(fetchMiddlewares<RequestHandler>(GatewayController.prototype.getRouterRequestsOverTime)),

            async function GatewayController_getRouterRequestsOverTime(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGatewayController_getRouterRequestsOverTime, request, response });

                const controller = new GatewayController();

              await templateService.apiHandler({
                methodName: 'getRouterRequestsOverTime',
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
        const argsGatewayController_getRouterCostOverTime: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                routerHash: {"in":"path","name":"routerHash","required":true,"dataType":"string"},
        };
        app.get('/v1/gateway/:routerHash/cost-over-time',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GatewayController)),
            ...(fetchMiddlewares<RequestHandler>(GatewayController.prototype.getRouterCostOverTime)),

            async function GatewayController_getRouterCostOverTime(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGatewayController_getRouterCostOverTime, request, response });

                const controller = new GatewayController();

              await templateService.apiHandler({
                methodName: 'getRouterCostOverTime',
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
        const argsGatewayController_getRouterLatencyOverTime: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                routerHash: {"in":"path","name":"routerHash","required":true,"dataType":"string"},
        };
        app.get('/v1/gateway/:routerHash/latency-over-time',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GatewayController)),
            ...(fetchMiddlewares<RequestHandler>(GatewayController.prototype.getRouterLatencyOverTime)),

            async function GatewayController_getRouterLatencyOverTime(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGatewayController_getRouterLatencyOverTime, request, response });

                const controller = new GatewayController();

              await templateService.apiHandler({
                methodName: 'getRouterLatencyOverTime',
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
        const argsGatewayController_createRouter: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"config":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}}},
        };
        app.post('/v1/gateway',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GatewayController)),
            ...(fetchMiddlewares<RequestHandler>(GatewayController.prototype.createRouter)),

            async function GatewayController_createRouter(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGatewayController_createRouter, request, response });

                const controller = new GatewayController();

              await templateService.apiHandler({
                methodName: 'createRouter',
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
        const argsGatewayController_updateRouter: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                routerHash: {"in":"path","name":"routerHash","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"config":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}}},
        };
        app.put('/v1/gateway/:routerHash',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GatewayController)),
            ...(fetchMiddlewares<RequestHandler>(GatewayController.prototype.updateRouter)),

            async function GatewayController_updateRouter(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGatewayController_updateRouter, request, response });

                const controller = new GatewayController();

              await templateService.apiHandler({
                methodName: 'updateRouter',
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
        const argsEvalController_queryEvals: Record<string, TsoaRoute.ParameterSchema> = {
                evalQueryParams: {"in":"body","name":"evalQueryParams","required":true,"ref":"EvalQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/evals/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvalController)),
            ...(fetchMiddlewares<RequestHandler>(EvalController.prototype.queryEvals)),

            async function EvalController_queryEvals(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvalController_queryEvals, request, response });

                const controller = new EvalController();

              await templateService.apiHandler({
                methodName: 'queryEvals',
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
        const argsEvalController_getEvalScores: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/evals/scores',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvalController)),
            ...(fetchMiddlewares<RequestHandler>(EvalController.prototype.getEvalScores)),

            async function EvalController_getEvalScores(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvalController_getEvalScores, request, response });

                const controller = new EvalController();

              await templateService.apiHandler({
                methodName: 'getEvalScores',
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
        const argsEvalController_addEval: Record<string, TsoaRoute.ParameterSchema> = {
                requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                evalData: {"in":"body","name":"evalData","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"score":{"dataType":"double","required":true},"name":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/evals/:requestId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvalController)),
            ...(fetchMiddlewares<RequestHandler>(EvalController.prototype.addEval)),

            async function EvalController_addEval(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvalController_addEval, request, response });

                const controller = new EvalController();

              await templateService.apiHandler({
                methodName: 'addEval',
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
        const argsEvalController_queryScoreDistributions: Record<string, TsoaRoute.ParameterSchema> = {
                evalQueryParams: {"in":"body","name":"evalQueryParams","required":true,"ref":"EvalQueryParams"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/evals/score-distributions/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvalController)),
            ...(fetchMiddlewares<RequestHandler>(EvalController.prototype.queryScoreDistributions)),

            async function EvalController_queryScoreDistributions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEvalController_queryScoreDistributions, request, response });

                const controller = new EvalController();

              await templateService.apiHandler({
                methodName: 'queryScoreDistributions',
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
        const argsDataIsBeautifulRouter_getTotalValues: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/dataisbeautiful/total-values',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getTotalValues)),

            async function DataIsBeautifulRouter_getTotalValues(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDataIsBeautifulRouter_getTotalValues, request, response });

                const controller = new DataIsBeautifulRouter();

              await templateService.apiHandler({
                methodName: 'getTotalValues',
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
        const argsDataIsBeautifulRouter_getModelUsageOverTime: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/dataisbeautiful/model/usage/overtime',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getModelUsageOverTime)),

            async function DataIsBeautifulRouter_getModelUsageOverTime(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDataIsBeautifulRouter_getModelUsageOverTime, request, response });

                const controller = new DataIsBeautifulRouter();

              await templateService.apiHandler({
                methodName: 'getModelUsageOverTime',
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
        const argsDataIsBeautifulRouter_getProviderUsageOverTime: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/dataisbeautiful/provider/usage/overtime',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getProviderUsageOverTime)),

            async function DataIsBeautifulRouter_getProviderUsageOverTime(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDataIsBeautifulRouter_getProviderUsageOverTime, request, response });

                const controller = new DataIsBeautifulRouter();

              await templateService.apiHandler({
                methodName: 'getProviderUsageOverTime',
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
        const argsDataIsBeautifulRouter_getTotalRequests: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/dataisbeautiful/total-requests',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getTotalRequests)),

            async function DataIsBeautifulRouter_getTotalRequests(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDataIsBeautifulRouter_getTotalRequests, request, response });

                const controller = new DataIsBeautifulRouter();

              await templateService.apiHandler({
                methodName: 'getTotalRequests',
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
        const argsDataIsBeautifulRouter_getTTFTvsPromptInputLength: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/dataisbeautiful/ttft-vs-prompt-length',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getTTFTvsPromptInputLength)),

            async function DataIsBeautifulRouter_getTTFTvsPromptInputLength(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDataIsBeautifulRouter_getTTFTvsPromptInputLength, request, response });

                const controller = new DataIsBeautifulRouter();

              await templateService.apiHandler({
                methodName: 'getTTFTvsPromptInputLength',
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
        const argsDataIsBeautifulRouter_getModelPercentage: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/dataisbeautiful/model/percentage',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getModelPercentage)),

            async function DataIsBeautifulRouter_getModelPercentage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDataIsBeautifulRouter_getModelPercentage, request, response });

                const controller = new DataIsBeautifulRouter();

              await templateService.apiHandler({
                methodName: 'getModelPercentage',
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
        const argsDataIsBeautifulRouter_getModelCost: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/dataisbeautiful/model/cost',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getModelCost)),

            async function DataIsBeautifulRouter_getModelCost(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDataIsBeautifulRouter_getModelCost, request, response });

                const controller = new DataIsBeautifulRouter();

              await templateService.apiHandler({
                methodName: 'getModelCost',
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
        const argsDataIsBeautifulRouter_getProviderPercentage: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/dataisbeautiful/provider/percentage',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getProviderPercentage)),

            async function DataIsBeautifulRouter_getProviderPercentage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDataIsBeautifulRouter_getProviderPercentage, request, response });

                const controller = new DataIsBeautifulRouter();

              await templateService.apiHandler({
                methodName: 'getProviderPercentage',
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
        const argsDataIsBeautifulRouter_getModelPercentageOverTime: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/public/dataisbeautiful/model/percentage/overtime',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getModelPercentageOverTime)),

            async function DataIsBeautifulRouter_getModelPercentageOverTime(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDataIsBeautifulRouter_getModelPercentageOverTime, request, response });

                const controller = new DataIsBeautifulRouter();

              await templateService.apiHandler({
                methodName: 'getModelPercentageOverTime',
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
        const argsDashboardController_getScoresOverTime: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataOverTimeRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/dashboard/scores/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DashboardController)),
            ...(fetchMiddlewares<RequestHandler>(DashboardController.prototype.getScoresOverTime)),

            async function DashboardController_getScoresOverTime(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDashboardController_getScoresOverTime, request, response });

                const controller = new DashboardController();

              await templateService.apiHandler({
                methodName: 'getScoresOverTime',
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
        const argsCustomerController_getCustomerUsage: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                customerId: {"in":"path","name":"customerId","required":true,"dataType":"string"},
        };
        app.post('/v1/customer/:customerId/usage/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CustomerController)),
            ...(fetchMiddlewares<RequestHandler>(CustomerController.prototype.getCustomerUsage)),

            async function CustomerController_getCustomerUsage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCustomerController_getCustomerUsage, request, response });

                const controller = new CustomerController();

              await templateService.apiHandler({
                methodName: 'getCustomerUsage',
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
        const argsCustomerController_getCustomers: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/customer/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CustomerController)),
            ...(fetchMiddlewares<RequestHandler>(CustomerController.prototype.getCustomers)),

            async function CustomerController_getCustomers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCustomerController_getCustomers, request, response });

                const controller = new CustomerController();

              await templateService.apiHandler({
                methodName: 'getCustomers',
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
        const argsApiKeyController_deleteProviderKey: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                providerKeyId: {"in":"path","name":"providerKeyId","required":true,"dataType":"string"},
        };
        app.delete('/v1/api-keys/provider-key/:providerKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.deleteProviderKey)),

            async function ApiKeyController_deleteProviderKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApiKeyController_deleteProviderKey, request, response });

                const controller = new ApiKeyController();

              await templateService.apiHandler({
                methodName: 'deleteProviderKey',
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
        const argsApiKeyController_createProviderKey: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"providerKeyName":{"dataType":"string","required":true},"config":{"ref":"Record_string.string_","required":true},"providerSecretKey":{"dataType":"string"},"providerKey":{"dataType":"string","required":true},"providerName":{"dataType":"string","required":true}}},
        };
        app.post('/v1/api-keys/provider-key',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.createProviderKey)),

            async function ApiKeyController_createProviderKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApiKeyController_createProviderKey, request, response });

                const controller = new ApiKeyController();

              await templateService.apiHandler({
                methodName: 'createProviderKey',
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
        const argsApiKeyController_getProviderKey: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                providerKeyId: {"in":"path","name":"providerKeyId","required":true,"dataType":"string"},
        };
        app.get('/v1/api-keys/provider-key/:providerKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.getProviderKey)),

            async function ApiKeyController_getProviderKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApiKeyController_getProviderKey, request, response });

                const controller = new ApiKeyController();

              await templateService.apiHandler({
                methodName: 'getProviderKey',
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
        const argsApiKeyController_getProviderKeys: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/api-keys/provider-keys',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.getProviderKeys)),

            async function ApiKeyController_getProviderKeys(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApiKeyController_getProviderKeys, request, response });

                const controller = new ApiKeyController();

              await templateService.apiHandler({
                methodName: 'getProviderKeys',
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
        const argsApiKeyController_updateProviderKey: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                providerKeyId: {"in":"path","name":"providerKeyId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"config":{"ref":"Record_string.string_"},"providerSecretKey":{"dataType":"string"},"providerKey":{"dataType":"string"}}},
        };
        app.patch('/v1/api-keys/provider-key/:providerKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.updateProviderKey)),

            async function ApiKeyController_updateProviderKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApiKeyController_updateProviderKey, request, response });

                const controller = new ApiKeyController();

              await templateService.apiHandler({
                methodName: 'updateProviderKey',
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
        const argsApiKeyController_getAPIKeys: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/api-keys',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.getAPIKeys)),

            async function ApiKeyController_getAPIKeys(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApiKeyController_getAPIKeys, request, response });

                const controller = new ApiKeyController();

              await templateService.apiHandler({
                methodName: 'getAPIKeys',
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
        const argsApiKeyController_createAPIKey: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"key_permissions":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["rw"]},{"dataType":"enum","enums":["r"]},{"dataType":"enum","enums":["w"]}]},"api_key_name":{"dataType":"string","required":true}}},
        };
        app.post('/v1/api-keys',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.createAPIKey)),

            async function ApiKeyController_createAPIKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApiKeyController_createAPIKey, request, response });

                const controller = new ApiKeyController();

              await templateService.apiHandler({
                methodName: 'createAPIKey',
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
        const argsApiKeyController_createProxyKey: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"proxyKeyName":{"dataType":"string","required":true},"providerKeyId":{"dataType":"string","required":true}}},
        };
        app.post('/v1/api-keys/proxy-key',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.createProxyKey)),

            async function ApiKeyController_createProxyKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApiKeyController_createProxyKey, request, response });

                const controller = new ApiKeyController();

              await templateService.apiHandler({
                methodName: 'createProxyKey',
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
        const argsApiKeyController_deleteAPIKey: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                apiKeyId: {"in":"path","name":"apiKeyId","required":true,"dataType":"double"},
        };
        app.delete('/v1/api-keys/:apiKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.deleteAPIKey)),

            async function ApiKeyController_deleteAPIKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApiKeyController_deleteAPIKey, request, response });

                const controller = new ApiKeyController();

              await templateService.apiHandler({
                methodName: 'deleteAPIKey',
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
        const argsApiKeyController_updateAPIKey: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                apiKeyId: {"in":"path","name":"apiKeyId","required":true,"dataType":"double"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"api_key_name":{"dataType":"string","required":true}}},
        };
        app.patch('/v1/api-keys/:apiKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.updateAPIKey)),

            async function ApiKeyController_updateAPIKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsApiKeyController_updateAPIKey, request, response });

                const controller = new ApiKeyController();

              await templateService.apiHandler({
                methodName: 'updateAPIKey',
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
        const argsAlertBannerController_updateAlertBannerActive: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"active":{"dataType":"boolean","required":true},"id":{"dataType":"double","required":true}}},
        };
        app.patch('/v1/public/alert-banner',
            ...(fetchMiddlewares<RequestHandler>(AlertBannerController)),
            ...(fetchMiddlewares<RequestHandler>(AlertBannerController.prototype.updateAlertBannerActive)),

            async function AlertBannerController_updateAlertBannerActive(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAlertBannerController_updateAlertBannerActive, request, response });

                const controller = new AlertBannerController();

              await templateService.apiHandler({
                methodName: 'updateAlertBannerActive',
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
        const argsAlertBannerController_getAlertBanners: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/public/alert-banner',
            ...(fetchMiddlewares<RequestHandler>(AlertBannerController)),
            ...(fetchMiddlewares<RequestHandler>(AlertBannerController.prototype.getAlertBanners)),

            async function AlertBannerController_getAlertBanners(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAlertBannerController_getAlertBanners, request, response });

                const controller = new AlertBannerController();

              await templateService.apiHandler({
                methodName: 'getAlertBanners',
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
        const argsAgentController_generate: Record<string, TsoaRoute.ParameterSchema> = {
                bodyParams: {"in":"body","name":"bodyParams","required":true,"dataType":"intersection","subSchemas":[{"ref":"OpenAIChatRequest"},{"dataType":"nestedObjectLiteral","nestedProperties":{"inputs":{"dataType":"any"},"environment":{"dataType":"string"},"prompt_id":{"dataType":"string"},"logRequest":{"dataType":"boolean"},"useAIGateway":{"dataType":"boolean"}}}]},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/agent/generate',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AgentController)),
            ...(fetchMiddlewares<RequestHandler>(AgentController.prototype.generate)),

            async function AgentController_generate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAgentController_generate, request, response });

                const controller = new AgentController();

              await templateService.apiHandler({
                methodName: 'generate',
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
        const argsAgentController_upsertThreadMessage: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                bodyParams: {"in":"body","name":"bodyParams","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"dataType":"nestedObjectLiteral","nestedProperties":{"posthogSession":{"dataType":"string"}},"additionalProperties":{"dataType":"any"},"required":true},"messages":{"dataType":"array","array":{"dataType":"refAlias","ref":"ChatCompletionMessageParam"},"required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/agent/thread/:sessionId/message',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AgentController)),
            ...(fetchMiddlewares<RequestHandler>(AgentController.prototype.upsertThreadMessage)),

            async function AgentController_upsertThreadMessage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAgentController_upsertThreadMessage, request, response });

                const controller = new AgentController();

              await templateService.apiHandler({
                methodName: 'upsertThreadMessage',
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
        const argsAgentController_deleteThread: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/v1/agent/thread/:sessionId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AgentController)),
            ...(fetchMiddlewares<RequestHandler>(AgentController.prototype.deleteThread)),

            async function AgentController_deleteThread(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAgentController_deleteThread, request, response });

                const controller = new AgentController();

              await templateService.apiHandler({
                methodName: 'deleteThread',
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
        const argsAgentController_escalateThread: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/agent/thread/:sessionId/escalate',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AgentController)),
            ...(fetchMiddlewares<RequestHandler>(AgentController.prototype.escalateThread)),

            async function AgentController_escalateThread(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAgentController_escalateThread, request, response });

                const controller = new AgentController();

              await templateService.apiHandler({
                methodName: 'escalateThread',
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
        const argsAgentController_getAllThreads: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/agent/threads',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AgentController)),
            ...(fetchMiddlewares<RequestHandler>(AgentController.prototype.getAllThreads)),

            async function AgentController_getAllThreads(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAgentController_getAllThreads, request, response });

                const controller = new AgentController();

              await templateService.apiHandler({
                methodName: 'getAllThreads',
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
        const argsAgentController_getThread: Record<string, TsoaRoute.ParameterSchema> = {
                sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/v1/agent/thread/:sessionId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AgentController)),
            ...(fetchMiddlewares<RequestHandler>(AgentController.prototype.getThread)),

            async function AgentController_getThread(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAgentController_getThread, request, response });

                const controller = new AgentController();

              await templateService.apiHandler({
                methodName: 'getThread',
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
        const argsAgentController_searchDocs: Record<string, TsoaRoute.ParameterSchema> = {
                bodyParams: {"in":"body","name":"bodyParams","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"query":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/v1/agent/mcp/search',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AgentController)),
            ...(fetchMiddlewares<RequestHandler>(AgentController.prototype.searchDocs)),

            async function AgentController_searchDocs(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAgentController_searchDocs, request, response });

                const controller = new AgentController();

              await templateService.apiHandler({
                methodName: 'searchDocs',
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
