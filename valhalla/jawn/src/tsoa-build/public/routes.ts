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
import { RequestController } from './../../controllers/public/requestController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PromptController } from './../../controllers/public/promptController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EvaluatorController } from './../../controllers/public/evaluatorController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ExperimentV2Controller } from './../../controllers/public/experimentV2Controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TraceController } from './../../controllers/public/traceloopController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { StripeController } from './../../controllers/public/stripeController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SessionController } from './../../controllers/public/sessionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { StatusController } from './../../controllers/public/providerStatusController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PropertyController } from './../../controllers/public/propertyController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PiPublicController } from './../../controllers/public/piPublicController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PiController } from './../../controllers/public/piController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ModelComparisonController } from './../../controllers/public/modelComparisonController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ModelController } from './../../controllers/public/modelController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LLMSecurityController } from './../../controllers/public/llmSecurityController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { IntegrationController } from './../../controllers/public/integrationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ExperimentController } from './../../controllers/public/experimentController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ExperimentDatasetController } from './../../controllers/public/experimentDatasetController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HeliconeDatasetController } from './../../controllers/public/heliconeDatasetController';
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
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"provider_key_name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"provider_name":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"provider_key":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"org_id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}},"validators":{}},
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
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"user_id":{"ref":"Partial_TextOperators_"},"last_active":{"ref":"Partial_TimestampOperators_"},"total_requests":{"ref":"Partial_NumberOperators_"},"active_for":{"ref":"Partial_NumberOperators_"},"average_requests_per_day_active":{"ref":"Partial_NumberOperators_"},"average_tokens_per_request":{"ref":"Partial_NumberOperators_"},"total_completion_tokens":{"ref":"Partial_NumberOperators_"},"total_prompt_tokens":{"ref":"Partial_NumberOperators_"},"cost":{"ref":"Partial_NumberOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TimestampOperatorsTyped_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"gte":{"dataType":"datetime"},"lte":{"dataType":"datetime"},"lt":{"dataType":"datetime"},"gt":{"dataType":"datetime"}},"validators":{}},
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
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"latency":{"ref":"Partial_NumberOperators_"},"status":{"ref":"Partial_NumberOperators_"},"request_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"response_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"model":{"ref":"Partial_TextOperators_"},"user_id":{"ref":"Partial_TextOperators_"},"organization_id":{"ref":"Partial_TextOperators_"},"node_id":{"ref":"Partial_TextOperators_"},"job_id":{"ref":"Partial_TextOperators_"},"threat":{"ref":"Partial_BooleanOperators_"},"request_id":{"ref":"Partial_TextOperators_"},"prompt_tokens":{"ref":"Partial_NumberOperators_"},"completion_tokens":{"ref":"Partial_NumberOperators_"},"total_tokens":{"ref":"Partial_NumberOperators_"},"target_url":{"ref":"Partial_TextOperators_"},"properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"search_properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"scores":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"scores_column":{"ref":"Partial_TextOperators_"},"request_body":{"ref":"Partial_VectorOperators_"},"response_body":{"ref":"Partial_VectorOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.user_metrics-or-request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"user_metrics":{"ref":"Partial_UserMetricsToOperators_"},"request_response_rmt":{"ref":"Partial_RequestResponseRMTToOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeafSubset_user_metrics-or-request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_FilterLeaf.user_metrics-or-request_response_rmt_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_user_metrics-or-request_response_rmt_"},{"ref":"UserFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
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
    "ResultSuccess__users-UserMetricsResult-Array--count-number__": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"count":{"dataType":"double","required":true},"users":{"dataType":"array","array":{"dataType":"refObject","ref":"UserMetricsResult"},"required":true}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__users-UserMetricsResult-Array--count-number_.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__users-UserMetricsResult-Array--count-number__"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortDirection": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortLeafUsers": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"ref":"SortDirection"},"user_id":{"ref":"SortDirection"},"active_for":{"ref":"SortDirection"},"first_active":{"ref":"SortDirection"},"last_active":{"ref":"SortDirection"},"total_requests":{"ref":"SortDirection"},"average_requests_per_day_active":{"ref":"SortDirection"},"average_tokens_per_request":{"ref":"SortDirection"},"cost":{"ref":"SortDirection"},"rate_limited_count":{"ref":"SortDirection"}},"validators":{}},
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
    "ResultSuccess__count-number--prompt_tokens-number--completion_tokens-number--user_id-string--cost_usd-number_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"cost_usd":{"dataType":"double","required":true},"user_id":{"dataType":"string","required":true},"completion_tokens":{"dataType":"double","required":true},"prompt_tokens":{"dataType":"double","required":true},"count":{"dataType":"double","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__count-number--prompt_tokens-number--completion_tokens-number--user_id-string--cost_usd-number_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__count-number--prompt_tokens-number--completion_tokens-number--user_id-string--cost_usd-number_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
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
    "Record_string.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"string"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProviderName": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["OPENAI"]},{"dataType":"enum","enums":["ANTHROPIC"]},{"dataType":"enum","enums":["AZURE"]},{"dataType":"enum","enums":["LOCAL"]},{"dataType":"enum","enums":["HELICONE"]},{"dataType":"enum","enums":["AMDBARTEK"]},{"dataType":"enum","enums":["ANYSCALE"]},{"dataType":"enum","enums":["CLOUDFLARE"]},{"dataType":"enum","enums":["2YFV"]},{"dataType":"enum","enums":["TOGETHER"]},{"dataType":"enum","enums":["LEMONFOX"]},{"dataType":"enum","enums":["FIREWORKS"]},{"dataType":"enum","enums":["PERPLEXITY"]},{"dataType":"enum","enums":["GOOGLE"]},{"dataType":"enum","enums":["OPENROUTER"]},{"dataType":"enum","enums":["WISDOMINANUTSHELL"]},{"dataType":"enum","enums":["GROQ"]},{"dataType":"enum","enums":["COHERE"]},{"dataType":"enum","enums":["MISTRAL"]},{"dataType":"enum","enums":["DEEPINFRA"]},{"dataType":"enum","enums":["QSTASH"]},{"dataType":"enum","enums":["FIRECRAWL"]},{"dataType":"enum","enums":["AWS"]},{"dataType":"enum","enums":["DEEPSEEK"]},{"dataType":"enum","enums":["X"]},{"dataType":"enum","enums":["AVIAN"]},{"dataType":"enum","enums":["NEBIUS"]},{"dataType":"enum","enums":["NOVITA"]}],"validators":{}},
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
            "name": {"dataType":"string","required":true},
            "arguments": {"ref":"Record_string.any_","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Message": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"contentArray":{"dataType":"array","array":{"dataType":"refAlias","ref":"Message"}},"idx":{"dataType":"double"},"audio_data":{"dataType":"string"},"image_url":{"dataType":"string"},"timestamp":{"dataType":"string"},"tool_call_id":{"dataType":"string"},"tool_calls":{"dataType":"array","array":{"dataType":"refObject","ref":"FunctionCall"}},"content":{"dataType":"string"},"name":{"dataType":"string"},"role":{"dataType":"string"},"id":{"dataType":"string"},"_type":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["functionCall"]},{"dataType":"enum","enums":["function"]},{"dataType":"enum","enums":["image"]},{"dataType":"enum","enums":["message"]},{"dataType":"enum","enums":["autoInput"]},{"dataType":"enum","enums":["contentArray"]},{"dataType":"enum","enums":["audio"]}],"required":true}},"validators":{}},
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
            "max_tokens": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "temperature": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "top_p": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "seed": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "stream": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}]},
            "presence_penalty": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "frequency_penalty": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "stop": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "reasoning_effort": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["low"]},{"dataType":"enum","enums":["medium"]},{"dataType":"enum","enums":["high"]},{"dataType":"enum","enums":[null]}]},
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
    "LLMResponseBody": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"vectorDBDetailsResponse":{"dataType":"nestedObjectLiteral","nestedProperties":{"_type":{"dataType":"enum","enums":["vector_db"],"required":true},"metadata":{"dataType":"nestedObjectLiteral","nestedProperties":{"timestamp":{"dataType":"string","required":true},"destination_parsed":{"dataType":"boolean"},"destination":{"dataType":"string"}},"required":true},"actualSimilarity":{"dataType":"double"},"similarityThreshold":{"dataType":"double"},"message":{"dataType":"string","required":true},"status":{"dataType":"string","required":true}}},"toolDetailsResponse":{"dataType":"nestedObjectLiteral","nestedProperties":{"toolName":{"dataType":"string","required":true},"_type":{"dataType":"enum","enums":["tool"],"required":true},"metadata":{"dataType":"nestedObjectLiteral","nestedProperties":{"timestamp":{"dataType":"string","required":true}},"required":true},"tips":{"dataType":"array","array":{"dataType":"string"},"required":true},"message":{"dataType":"string","required":true},"status":{"dataType":"string","required":true}}},"error":{"dataType":"nestedObjectLiteral","nestedProperties":{"heliconeMessage":{"dataType":"any","required":true}}},"model":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"messages":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refAlias","ref":"Message"}},{"dataType":"enum","enums":[null]}]}},"validators":{}},
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
    "Record_string.number_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"double"},"validators":{}},
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
            "prompt_id": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
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
    "Partial_CacheHitsTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"organization_id":{"ref":"Partial_TextOperators_"},"request_id":{"ref":"Partial_TextOperators_"},"latency":{"ref":"Partial_NumberOperators_"},"completion_tokens":{"ref":"Partial_NumberOperators_"},"prompt_tokens":{"ref":"Partial_NumberOperators_"},"created_at":{"ref":"Partial_TimestampOperatorsTyped_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_FeedbackTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"id":{"ref":"Partial_NumberOperators_"},"created_at":{"ref":"Partial_TimestampOperators_"},"rating":{"ref":"Partial_BooleanOperators_"},"response_id":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_RequestTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"prompt":{"ref":"Partial_TextOperators_"},"created_at":{"ref":"Partial_TimestampOperators_"},"user_id":{"ref":"Partial_TextOperators_"},"auth_hash":{"ref":"Partial_TextOperators_"},"org_id":{"ref":"Partial_TextOperators_"},"id":{"ref":"Partial_TextOperators_"},"node_id":{"ref":"Partial_TextOperators_"},"model":{"ref":"Partial_TextOperators_"},"modelOverride":{"ref":"Partial_TextOperators_"},"path":{"ref":"Partial_TextOperators_"},"prompt_id":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_RequestResponseSearchToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"request_body_vector":{"ref":"Partial_VectorOperators_"},"response_body_vector":{"ref":"Partial_VectorOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_ResponseTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"body_tokens":{"ref":"Partial_NumberOperators_"},"body_model":{"ref":"Partial_TextOperators_"},"body_completion":{"ref":"Partial_TextOperators_"},"status":{"ref":"Partial_NumberOperators_"},"model":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_SessionsRequestResponseRMTToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"session_session_id":{"ref":"Partial_TextOperators_"},"session_session_name":{"ref":"Partial_TextOperators_"},"session_total_cost":{"ref":"Partial_NumberOperators_"},"session_total_tokens":{"ref":"Partial_NumberOperators_"},"session_prompt_tokens":{"ref":"Partial_NumberOperators_"},"session_completion_tokens":{"ref":"Partial_NumberOperators_"},"session_total_requests":{"ref":"Partial_NumberOperators_"},"session_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"session_latest_request_created_at":{"ref":"Partial_TimestampOperatorsTyped_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.feedback-or-request-or-response-or-properties-or-values-or-request_response_search-or-cache_hits-or-request_response_rmt-or-sessions_request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"cache_hits":{"ref":"Partial_CacheHitsTableToOperators_"},"feedback":{"ref":"Partial_FeedbackTableToOperators_"},"properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"request":{"ref":"Partial_RequestTableToOperators_"},"request_response_search":{"ref":"Partial_RequestResponseSearchToOperators_"},"response":{"ref":"Partial_ResponseTableToOperators_"},"request_response_rmt":{"ref":"Partial_RequestResponseRMTToOperators_"},"sessions_request_response_rmt":{"ref":"Partial_SessionsRequestResponseRMTToOperators_"},"values":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterLeafSubset_feedback-or-request-or-response-or-properties-or-values-or-request_response_search-or-cache_hits-or-request_response_rmt-or-sessions_request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_FilterLeaf.feedback-or-request-or-response-or-properties-or-values-or-request_response_search-or-cache_hits-or-request_response_rmt-or-sessions_request_response_rmt_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RequestFilterNode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"FilterLeafSubset_feedback-or-request-or-response-or-properties-or-values-or-request_response_search-or-cache_hits-or-request_response_rmt-or-sessions_request_response_rmt_"},{"ref":"RequestFilterBranch"},{"dataType":"enum","enums":["all"]}],"validators":{}},
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
            "cost_usd": {"ref":"SortDirection"},
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
    "OTELTrace": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"resourceSpans":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"scopeSpans":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"spans":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"droppedLinksCount":{"dataType":"double","required":true},"links":{"dataType":"array","array":{"dataType":"any"},"required":true},"status":{"dataType":"nestedObjectLiteral","nestedProperties":{"code":{"dataType":"double","required":true}},"required":true},"droppedEventsCount":{"dataType":"double","required":true},"events":{"dataType":"array","array":{"dataType":"any"},"required":true},"droppedAttributesCount":{"dataType":"double","required":true},"attributes":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"nestedObjectLiteral","nestedProperties":{"intValue":{"dataType":"double"},"stringValue":{"dataType":"string"}},"required":true},"key":{"dataType":"string","required":true}}},"required":true},"endTimeUnixNano":{"dataType":"string","required":true},"startTimeUnixNano":{"dataType":"string","required":true},"kind":{"dataType":"double","required":true},"name":{"dataType":"string","required":true},"spanId":{"dataType":"string","required":true},"traceId":{"dataType":"string","required":true}}},"required":true},"scope":{"dataType":"nestedObjectLiteral","nestedProperties":{"version":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}},"required":true}}},"required":true},"resource":{"dataType":"nestedObjectLiteral","nestedProperties":{"droppedAttributesCount":{"dataType":"double","required":true},"attributes":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"nestedObjectLiteral","nestedProperties":{"arrayValue":{"dataType":"nestedObjectLiteral","nestedProperties":{"values":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"stringValue":{"dataType":"string","required":true}}},"required":true}}},"intValue":{"dataType":"double"},"stringValue":{"dataType":"string"}},"required":true},"key":{"dataType":"string","required":true}}},"required":true}},"required":true}}},"required":true}},"validators":{}},
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
            "total_cost": {"dataType":"double","required":true},
            "last_used": {"dataType":"string","required":true},
            "first_used": {"dataType":"string","required":true},
            "session_count": {"dataType":"double","required":true},
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
    "SessionNameQueryParams": {
        "dataType": "refObject",
        "properties": {
            "nameContains": {"dataType":"string","required":true},
            "timezoneDifference": {"dataType":"double","required":true},
            "pSize": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["p50"]},{"dataType":"enum","enums":["p75"]},{"dataType":"enum","enums":["p95"]},{"dataType":"enum","enums":["p99"]},{"dataType":"enum","enums":["p99.9"]}]},
            "useInterquartile": {"dataType":"boolean"},
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
    "PostgrestError": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "stack": {"dataType":"string"},
            "details": {"dataType":"string","required":true},
            "hint": {"dataType":"string","required":true},
            "code": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultError_PostgrestError_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"enum","enums":[null],"required":true},
            "error": {"ref":"PostgrestError","required":true},
        },
        "additionalProperties": false,
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
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"prompts_versions":{"ref":"Partial_PromptVersionsToOperators_"},"request":{"ref":"Partial_RequestTableToOperators_"}},"validators":{}},
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
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["gpt-3.5"]},{"dataType":"enum","enums":["gpt-4o"]},{"dataType":"enum","enums":["gpt-4o-mini"]},{"dataType":"enum","enums":["gpt-4"]},{"dataType":"enum","enums":["gpt-4-turbo"]},{"dataType":"enum","enums":["claude-3-opus"]},{"dataType":"enum","enums":["claude-3-sonnet"]},{"dataType":"enum","enums":["claude-3-haiku"]},{"dataType":"enum","enums":["claude-2"]},{"dataType":"enum","enums":["open-mixtral"]},{"dataType":"enum","enums":["Llama"]},{"dataType":"enum","enums":["dall-e"]},{"dataType":"enum","enums":["text-moderation"]},{"dataType":"enum","enums":["text-embedding"]},{"dataType":"enum","enums":["anthropic/claude-3.5-sonnet"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OpenStatsProviderName": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["OPENAI"]},{"dataType":"enum","enums":["ANTHROPIC"]},{"dataType":"enum","enums":["OPENROUTER"]},{"dataType":"enum","enums":["MISTRAL"]},{"dataType":"enum","enums":["META"]}],"validators":{}},
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
    "ResultSuccess__api_key_hash-string--api_key_name-string--created_at-string--governance-boolean--id-number--key_permissions-string--organization_id-string--soft_delete-boolean--temp_key-boolean--user_id-string_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"user_id":{"dataType":"string","required":true},"temp_key":{"dataType":"boolean","required":true},"soft_delete":{"dataType":"boolean","required":true},"organization_id":{"dataType":"string","required":true},"key_permissions":{"dataType":"string","required":true},"id":{"dataType":"double","required":true},"governance":{"dataType":"boolean","required":true},"created_at":{"dataType":"string","required":true},"api_key_name":{"dataType":"string","required":true},"api_key_hash":{"dataType":"string","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__api_key_hash-string--api_key_name-string--created_at-string--governance-boolean--id-number--key_permissions-string--organization_id-string--soft_delete-boolean--temp_key-boolean--user_id-string_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__api_key_hash-string--api_key_name-string--created_at-string--governance-boolean--id-number--key_permissions-string--organization_id-string--soft_delete-boolean--temp_key-boolean--user_id-string_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
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


    
        app.post('/v1/webhooks',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WebhookController)),
            ...(fetchMiddlewares<RequestHandler>(WebhookController.prototype.newWebhook)),

            async function WebhookController_newWebhook(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    webhookData: {"in":"body","name":"webhookData","required":true,"ref":"WebhookData"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/webhooks',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WebhookController)),
            ...(fetchMiddlewares<RequestHandler>(WebhookController.prototype.getWebhooks)),

            async function WebhookController_getWebhooks(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v1/webhooks/:webhookId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WebhookController)),
            ...(fetchMiddlewares<RequestHandler>(WebhookController.prototype.deleteWebhook)),

            async function WebhookController_deleteWebhook(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    webhookId: {"in":"path","name":"webhookId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/waitlist/experiments',
            ...(fetchMiddlewares<RequestHandler>(WaitlistController)),
            ...(fetchMiddlewares<RequestHandler>(WaitlistController.prototype.addToWaitlist)),

            async function WaitlistController_addToWaitlist(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    reqBody: {"in":"body","name":"reqBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/vault/add',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VaultController)),
            ...(fetchMiddlewares<RequestHandler>(VaultController.prototype.addKey)),

            async function VaultController_addKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"AddVaultKeyParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/vault/keys',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VaultController)),
            ...(fetchMiddlewares<RequestHandler>(VaultController.prototype.getKeys)),

            async function VaultController_getKeys(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/vault/key/:providerKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VaultController)),
            ...(fetchMiddlewares<RequestHandler>(VaultController.prototype.getKeyById)),

            async function VaultController_getKeyById(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    providerKeyId: {"in":"path","name":"providerKeyId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.patch('/v1/vault/update/:id',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(VaultController)),
            ...(fetchMiddlewares<RequestHandler>(VaultController.prototype.updateKey)),

            async function VaultController_updateKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    id: {"in":"path","name":"id","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"active":{"dataType":"boolean"},"name":{"dataType":"string"},"key":{"dataType":"string"}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/user/metrics-overview/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUserMetricsOverview)),

            async function UserController_getUserMetricsOverview(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"useInterquartile":{"dataType":"boolean","required":true},"pSize":{"ref":"PSize","required":true},"filter":{"ref":"UserFilterNode","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/user/metrics/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUserMetrics)),

            async function UserController_getUserMetrics(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UserMetricsQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/user/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUsers)),

            async function UserController_getUsers(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UserQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/request/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequests)),

            async function RequestController_getRequests(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"RequestQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/request/query-clickhouse',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequestsClickhouse)),

            async function RequestController_getRequestsClickhouse(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"RequestQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/request/:requestId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequestById)),

            async function RequestController_getRequestById(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                    includeBody: {"default":false,"in":"query","name":"includeBody","dataType":"boolean"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/request/query-ids',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequestsByIds)),

            async function RequestController_getRequestsByIds(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"requestIds":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/request/:requestId/feedback',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.feedbackRequest)),

            async function RequestController_feedbackRequest(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"rating":{"dataType":"boolean","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.put('/v1/request/:requestId/property',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.putProperty)),

            async function RequestController_putProperty(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"string","required":true},"key":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/request/:requestId/assets/:assetId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.getRequestAssetById)),

            async function RequestController_getRequestAssetById(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                    assetId: {"in":"path","name":"assetId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/request/:requestId/score',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(RequestController)),
            ...(fetchMiddlewares<RequestHandler>(RequestController.prototype.addScores)),

            async function RequestController_addScores(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"ScoreRequest"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPrompts)),

            async function PromptController_getPrompts(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptsQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/:promptId/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPrompt)),

            async function PromptController_getPrompt(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v1/prompt/:promptId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.deletePrompt)),

            async function PromptController_deletePrompt(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/create',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.createPrompt)),

            async function PromptController_createPrompt(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"ref":"Record_string.any_","required":true},"prompt":{"dataType":"any","required":true},"userDefinedId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.patch('/v1/prompt/:promptId/user-defined-id',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.updatePromptUserDefinedId)),

            async function PromptController_updatePromptUserDefinedId(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"userDefinedId":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/version/:promptVersionId/edit-label',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.editPromptVersionLabel)),

            async function PromptController_editPromptVersionLabel(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptEditSubversionLabelParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/version/:promptVersionId/edit-template',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.editPromptVersionTemplate)),

            async function PromptController_editPromptVersionTemplate(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptEditSubversionTemplateParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/version/:promptVersionId/subversion-from-ui',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.createSubversionFromUi)),

            async function PromptController_createSubversionFromUi(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptCreateSubversionParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/version/:promptVersionId/subversion',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.createSubversion)),

            async function PromptController_createSubversion(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptCreateSubversionParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/version/:promptVersionId/promote',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.promotePromptVersionToProduction)),

            async function PromptController_promotePromptVersionToProduction(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"previousProductionVersionId":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/version/:promptVersionId/inputs/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getInputs)),

            async function PromptController_getInputs(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"random":{"dataType":"boolean"},"limit":{"dataType":"double","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/prompt/:promptId/experiments',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPromptExperiments)),

            async function PromptController_getPromptExperiments(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/:promptId/versions/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPromptVersions)),

            async function PromptController_getPromptVersions(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptVersionsQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptId: {"in":"path","name":"promptId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/prompt/version/:promptVersionId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPromptVersion)),

            async function PromptController_getPromptVersion(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v1/prompt/version/:promptVersionId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.deletePromptVersion)),

            async function PromptController_deletePromptVersion(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/:user_defined_id/compile',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPromptVersionsCompiled)),

            async function PromptController_getPromptVersionsCompiled(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptVersiosQueryParamsCompiled"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    user_defined_id: {"in":"path","name":"user_defined_id","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/prompt/:user_defined_id/template',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PromptController)),
            ...(fetchMiddlewares<RequestHandler>(PromptController.prototype.getPromptVersionTemplates)),

            async function PromptController_getPromptVersionTemplates(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"PromptVersiosQueryParamsCompiled"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    user_defined_id: {"in":"path","name":"user_defined_id","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/evaluator',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.createEvaluator)),

            async function EvaluatorController_createEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateEvaluatorParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/evaluator/:evaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.getEvaluator)),

            async function EvaluatorController_getEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/evaluator/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.queryEvaluators)),

            async function EvaluatorController_queryEvaluators(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.put('/v1/evaluator/:evaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.updateEvaluator)),

            async function EvaluatorController_updateEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateEvaluatorParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v1/evaluator/:evaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.deleteEvaluator)),

            async function EvaluatorController_deleteEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/evaluator/:evaluatorId/experiments',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.getExperimentsForEvaluator)),

            async function EvaluatorController_getExperimentsForEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/evaluator/:evaluatorId/onlineEvaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.getOnlineEvaluators)),

            async function EvaluatorController_getOnlineEvaluators(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/evaluator/:evaluatorId/onlineEvaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.createOnlineEvaluator)),

            async function EvaluatorController_createOnlineEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateOnlineEvaluatorParams"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v1/evaluator/:evaluatorId/onlineEvaluators/:onlineEvaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.deleteOnlineEvaluator)),

            async function EvaluatorController_deleteOnlineEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
                    onlineEvaluatorId: {"in":"path","name":"onlineEvaluatorId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/evaluator/python/test',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.testPythonEvaluator)),

            async function EvaluatorController_testPythonEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"testInput":{"ref":"TestInput","required":true},"code":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/evaluator/llm/test',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.testLLMEvaluator)),

            async function EvaluatorController_testLLMEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"evaluatorName":{"dataType":"string","required":true},"testInput":{"ref":"TestInput","required":true},"evaluatorConfig":{"ref":"EvaluatorConfig","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/evaluator/lastmile/test',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.testLastMileEvaluator)),

            async function EvaluatorController_testLastMileEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"testInput":{"ref":"TestInput","required":true},"config":{"ref":"LastMileConfigForm","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/evaluator/:evaluatorId/stats',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController)),
            ...(fetchMiddlewares<RequestHandler>(EvaluatorController.prototype.getEvaluatorStats)),

            async function EvaluatorController_getEvaluatorStats(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/create/empty',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createEmptyExperiment)),

            async function ExperimentV2Controller_createEmptyExperiment(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/create/from-request/:requestId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createExperimentFromRequest)),

            async function ExperimentV2Controller_createExperimentFromRequest(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/new',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createNewExperiment)),

            async function ExperimentV2Controller_createNewExperiment(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"originalPromptVersion":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v2/experiment',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getExperiments)),

            async function ExperimentV2Controller_getExperiments(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v2/experiment/:experimentId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.deleteExperiment)),

            async function ExperimentV2Controller_deleteExperiment(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v2/experiment/:experimentId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getExperimentById)),

            async function ExperimentV2Controller_getExperimentById(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/:experimentId/prompt-version',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createNewPromptVersionForExperiment)),

            async function ExperimentV2Controller_createNewPromptVersionForExperiment(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateNewPromptVersionForExperimentParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v2/experiment/:experimentId/prompt-version/:promptVersionId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.deletePromptVersion)),

            async function ExperimentV2Controller_deletePromptVersion(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v2/experiment/:experimentId/prompt-versions',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getPromptVersionsForExperiment)),

            async function ExperimentV2Controller_getPromptVersionsForExperiment(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v2/experiment/:experimentId/input-keys',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getInputKeysForExperiment)),

            async function ExperimentV2Controller_getInputKeysForExperiment(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/:experimentId/add-manual-row',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.addManualRowToExperiment)),

            async function ExperimentV2Controller_addManualRowToExperiment(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputs":{"ref":"Record_string.string_","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/:experimentId/add-manual-rows-batch',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.addManualRowsToExperimentBatch)),

            async function ExperimentV2Controller_addManualRowsToExperimentBatch(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputs":{"dataType":"array","array":{"dataType":"refAlias","ref":"Record_string.string_"},"required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v2/experiment/:experimentId/rows',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.deleteExperimentTableRows)),

            async function ExperimentV2Controller_deleteExperimentTableRows(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputRecordIds":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/:experimentId/row/insert/batch',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createExperimentTableRowBatch)),

            async function ExperimentV2Controller_createExperimentTableRowBatch(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"rows":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"autoInputs":{"dataType":"array","array":{"dataType":"any"},"required":true},"inputs":{"ref":"Record_string.string_","required":true},"inputRecordId":{"dataType":"string","required":true}}},"required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/:experimentId/row/insert/dataset/:datasetId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createExperimentTableRowFromDataset)),

            async function ExperimentV2Controller_createExperimentTableRowFromDataset(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/:experimentId/row/update',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.updateExperimentTableRow)),

            async function ExperimentV2Controller_updateExperimentTableRow(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputs":{"ref":"Record_string.string_","required":true},"inputRecordId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/:experimentId/run-hypothesis',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.runHypothesis)),

            async function ExperimentV2Controller_runHypothesis(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputRecordId":{"dataType":"string","required":true},"promptVersionId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v2/experiment/:experimentId/evaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getExperimentEvaluators)),

            async function ExperimentV2Controller_getExperimentEvaluators(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/:experimentId/evaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.createExperimentEvaluator)),

            async function ExperimentV2Controller_createExperimentEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"evaluatorId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v2/experiment/:experimentId/evaluators/:evaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.deleteExperimentEvaluator)),

            async function ExperimentV2Controller_deleteExperimentEvaluator(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v2/experiment/:experimentId/evaluators/run',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.runExperimentEvaluators)),

            async function ExperimentV2Controller_runExperimentEvaluators(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v2/experiment/:experimentId/should-run-evaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.shouldRunEvaluators)),

            async function ExperimentV2Controller_shouldRunEvaluators(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v2/experiment/:experimentId/:promptVersionId/scores',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getExperimentPromptVersionScores)),

            async function ExperimentV2Controller_getExperimentPromptVersionScores(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v2/experiment/:experimentId/:requestId/:scoreKey',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentV2Controller.prototype.getExperimentScore)),

            async function ExperimentV2Controller_getExperimentScore(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                    scoreKey: {"in":"path","name":"scoreKey","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/trace/log',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TraceController)),
            ...(fetchMiddlewares<RequestHandler>(TraceController.prototype.logTrace)),

            async function TraceController_logTrace(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    traceBody: {"in":"body","name":"traceBody","required":true,"ref":"OTELTrace"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/trace/log-python',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TraceController)),
            ...(fetchMiddlewares<RequestHandler>(TraceController.prototype.logPythonTrace)),

            async function TraceController_logPythonTrace(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    traceBody: {"in":"body","name":"traceBody","required":true,"dataType":"any"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/stripe/subscription/cost-for-prompts',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.getCostForPrompts)),

            async function StripeController_getCostForPrompts(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/stripe/subscription/cost-for-evals',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.getCostForEvals)),

            async function StripeController_getCostForEvals(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/stripe/subscription/cost-for-experiments',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.getCostForExperiments)),

            async function StripeController_getCostForExperiments(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/stripe/subscription/free/usage',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.getFreeUsage)),

            async function StripeController_getFreeUsage(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/stripe/subscription/new-customer/upgrade-to-pro',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.upgradeToPro)),

            async function StripeController_upgradeToPro(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"ref":"UpgradeToProRequest"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/stripe/subscription/existing-customer/upgrade-to-pro',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.upgradeExistingCustomer)),

            async function StripeController_upgradeExistingCustomer(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"ref":"UpgradeToProRequest"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/stripe/subscription/new-customer/upgrade-to-team-bundle',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.upgradeToTeamBundle)),

            async function StripeController_upgradeToTeamBundle(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","ref":"UpgradeToTeamBundleRequest"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/stripe/subscription/existing-customer/upgrade-to-team-bundle',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.upgradeExistingCustomerToTeamBundle)),

            async function StripeController_upgradeExistingCustomerToTeamBundle(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","ref":"UpgradeToTeamBundleRequest"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/stripe/subscription/manage-subscription',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.manageSubscription)),

            async function StripeController_manageSubscription(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/stripe/subscription/undo-cancel-subscription',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.undoCancelSubscription)),

            async function StripeController_undoCancelSubscription(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/stripe/subscription/add-ons/:productType',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.addOns)),

            async function StripeController_addOns(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    productType: {"in":"path","name":"productType","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["alerts"]},{"dataType":"enum","enums":["prompts"]},{"dataType":"enum","enums":["experiments"]},{"dataType":"enum","enums":["evals"]}]},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v1/stripe/subscription/add-ons/:productType',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.deleteAddOns)),

            async function StripeController_deleteAddOns(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    productType: {"in":"path","name":"productType","required":true,"dataType":"union","subSchemas":[{"dataType":"enum","enums":["alerts"]},{"dataType":"enum","enums":["prompts"]},{"dataType":"enum","enums":["experiments"]},{"dataType":"enum","enums":["evals"]}]},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/stripe/subscription/preview-invoice',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.previewInvoice)),

            async function StripeController_previewInvoice(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/stripe/subscription/cancel-subscription',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.cancelSubscription)),

            async function StripeController_cancelSubscription(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/stripe/subscription/migrate-to-pro',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.migrateToPro)),

            async function StripeController_migrateToPro(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/stripe/subscription',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.getSubscription)),

            async function StripeController_getSubscription(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/stripe/webhook',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StripeController)),
            ...(fetchMiddlewares<RequestHandler>(StripeController.prototype.handleStripeWebhook)),

            async function StripeController_handleStripeWebhook(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    body: {"in":"body","name":"body","required":true,"dataType":"any"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/session/has-session',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.hasSession)),

            async function SessionController_hasSession(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/session/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.getSessions)),

            async function SessionController_getSessions(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"SessionQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/session/name/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.getNames)),

            async function SessionController_getNames(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"SessionNameQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/session/metrics/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.getMetrics)),

            async function SessionController_getMetrics(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"SessionNameQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/session/:sessionId/feedback',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.updateSessionFeedback)),

            async function SessionController_updateSessionFeedback(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    sessionId: {"in":"path","name":"sessionId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"rating":{"dataType":"boolean","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/public/status/provider',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StatusController)),
            ...(fetchMiddlewares<RequestHandler>(StatusController.prototype.getAllProviderStatus)),

            async function StatusController_getAllProviderStatus(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/public/status/provider/:provider',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(StatusController)),
            ...(fetchMiddlewares<RequestHandler>(StatusController.prototype.getProviderStatus)),

            async function StatusController_getProviderStatus(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    provider: {"in":"path","name":"provider","required":true,"dataType":"string"},
                    timeFrame: {"in":"query","name":"timeFrame","required":true,"ref":"TimeFrame"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/property/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PropertyController)),
            ...(fetchMiddlewares<RequestHandler>(PropertyController.prototype.getProperties)),

            async function PropertyController_getProperties(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/property/:propertyKey/search',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PropertyController)),
            ...(fetchMiddlewares<RequestHandler>(PropertyController.prototype.searchProperties)),

            async function PropertyController_searchProperties(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    propertyKey: {"in":"path","name":"propertyKey","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"searchTerm":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/property/:propertyKey/top-costs/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PropertyController)),
            ...(fetchMiddlewares<RequestHandler>(PropertyController.prototype.getTopCosts)),

            async function PropertyController_getTopCosts(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    propertyKey: {"in":"path","name":"propertyKey","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"TimeFilterRequest"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/pi/get-api-key',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiPublicController)),
            ...(fetchMiddlewares<RequestHandler>(PiPublicController.prototype.getApiKey)),

            async function PiPublicController_getApiKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"sessionUUID":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/pi/session',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiController)),
            ...(fetchMiddlewares<RequestHandler>(PiController.prototype.addSession)),

            async function PiController_addSession(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"sessionUUID":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/pi/org-name/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiController)),
            ...(fetchMiddlewares<RequestHandler>(PiController.prototype.getOrgName)),

            async function PiController_getOrgName(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/pi/total-costs',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiController)),
            ...(fetchMiddlewares<RequestHandler>(PiController.prototype.getTotalCosts)),

            async function PiController_getTotalCosts(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/pi/total_requests',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiController)),
            ...(fetchMiddlewares<RequestHandler>(PiController.prototype.piGetTotalRequests)),

            async function PiController_piGetTotalRequests(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/pi/costs-over-time/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PiController)),
            ...(fetchMiddlewares<RequestHandler>(PiController.prototype.getCostsOverTime)),

            async function PiController_getCostsOverTime(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataOverTimeRequest"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/compare/models',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ModelComparisonController)),
            ...(fetchMiddlewares<RequestHandler>(ModelComparisonController.prototype.getModelComparison)),

            async function ModelComparisonController_getModelComparison(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    modelsToCompare: {"in":"body","name":"modelsToCompare","required":true,"dataType":"array","array":{"dataType":"refAlias","ref":"ModelsToCompare"}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/models',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ModelController)),
            ...(fetchMiddlewares<RequestHandler>(ModelController.prototype.getModels)),

            async function ModelController_getModels(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/security',
            ...(fetchMiddlewares<RequestHandler>(LLMSecurityController)),
            ...(fetchMiddlewares<RequestHandler>(LLMSecurityController.prototype.getSecurity)),

            async function LLMSecurityController_getSecurity(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"text":{"dataType":"string","required":true},"advanced":{"dataType":"boolean","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/integration',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.createIntegration)),

            async function IntegrationController_createIntegration(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    params: {"in":"body","name":"params","required":true,"ref":"IntegrationCreateParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/integration',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getIntegrations)),

            async function IntegrationController_getIntegrations(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/integration/:integrationId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.updateIntegration)),

            async function IntegrationController_updateIntegration(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    integrationId: {"in":"path","name":"integrationId","required":true,"dataType":"string"},
                    params: {"in":"body","name":"params","required":true,"ref":"IntegrationUpdateParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/integration/:integrationId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getIntegration)),

            async function IntegrationController_getIntegration(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    integrationId: {"in":"path","name":"integrationId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/integration/type/:type',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getIntegrationByType)),

            async function IntegrationController_getIntegrationByType(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    type: {"in":"path","name":"type","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/integration/slack/settings',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getSlackSettings)),

            async function IntegrationController_getSlackSettings(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/integration/slack/channels',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getSlackChannels)),

            async function IntegrationController_getSlackChannels(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/new-empty',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createNewEmptyExperiment)),

            async function ExperimentController_createNewEmptyExperiment(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"datasetId":{"dataType":"string","required":true},"metadata":{"ref":"Record_string.string_","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/table/new',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createNewExperimentTable)),

            async function ExperimentController_createNewExperimentTable(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreateExperimentTableParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/table/:experimentTableId/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentTableById)),

            async function ExperimentController_getExperimentTableById(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/table/:experimentTableId/metadata/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentTableMetadata)),

            async function ExperimentController_getExperimentTableMetadata(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/tables/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentTables)),

            async function ExperimentController_getExperimentTables(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/table/:experimentTableId/cell',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createExperimentCell)),

            async function ExperimentController_createExperimentCell(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"rowIndex":{"dataType":"double","required":true},"columnId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.patch('/v1/experiment/table/:experimentTableId/cell',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.updateExperimentCell)),

            async function ExperimentController_updateExperimentCell(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"updateInputs":{"dataType":"boolean"},"metadata":{"dataType":"string"},"value":{"dataType":"string"},"status":{"dataType":"string"},"cellId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/table/:experimentTableId/column',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createExperimentColumn)),

            async function ExperimentController_createExperimentColumn(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputKeys":{"dataType":"array","array":{"dataType":"string"}},"promptVersionId":{"dataType":"string"},"hypothesisId":{"dataType":"string"},"columnType":{"dataType":"string","required":true},"columnName":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/table/:experimentTableId/row/new',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createExperimentTableRow)),

            async function ExperimentController_createExperimentTableRow(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"inputs":{"ref":"Record_string.string_"},"sourceRequest":{"dataType":"string"},"promptVersionId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v1/experiment/table/:experimentTableId/row/:rowIndex',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.deleteExperimentTableRow)),

            async function ExperimentController_deleteExperimentTableRow(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                    rowIndex: {"in":"path","name":"rowIndex","required":true,"dataType":"double"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/table/:experimentTableId/row/insert/batch',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createExperimentTableRowWithCellsBatch)),

            async function ExperimentController_createExperimentTableRowWithCellsBatch(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentTableId: {"in":"path","name":"experimentTableId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"rows":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"sourceRequest":{"dataType":"string"},"cells":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"dataType":"any"},"value":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"columnId":{"dataType":"string","required":true}}},"required":true},"datasetId":{"dataType":"string","required":true},"inputs":{"ref":"Record_string.string_","required":true},"inputRecordId":{"dataType":"string","required":true}}},"required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/update-meta',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.updateExperimentMeta)),

            async function ExperimentController_updateExperimentMeta(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"meta":{"ref":"Record_string.string_","required":true},"experimentId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createNewExperimentOld)),

            async function ExperimentController_createNewExperimentOld(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"NewExperimentParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/hypothesis',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createNewExperimentHypothesis)),

            async function ExperimentController_createNewExperimentHypothesis(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["PENDING"]},{"dataType":"enum","enums":["RUNNING"]},{"dataType":"enum","enums":["COMPLETED"]},{"dataType":"enum","enums":["FAILED"]}],"required":true},"providerKeyId":{"dataType":"string","required":true},"promptVersion":{"dataType":"string","required":true},"model":{"dataType":"string","required":true},"experimentId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/hypothesis/:hypothesisId/scores/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentHypothesisScores)),

            async function ExperimentController_getExperimentHypothesisScores(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    hypothesisId: {"in":"path","name":"hypothesisId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/experiment/:experimentId/evaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentEvaluators)),

            async function ExperimentController_getExperimentEvaluators(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/:experimentId/evaluators/run',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.runExperimentEvaluatorsOld)),

            async function ExperimentController_runExperimentEvaluatorsOld(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/:experimentId/evaluators',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.createExperimentEvaluatorOld)),

            async function ExperimentController_createExperimentEvaluatorOld(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"evaluatorId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v1/experiment/:experimentId/evaluators/:evaluatorId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.deleteExperimentEvaluatorOld)),

            async function ExperimentController_deleteExperimentEvaluatorOld(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    experimentId: {"in":"path","name":"experimentId","required":true,"dataType":"string"},
                    evaluatorId: {"in":"path","name":"evaluatorId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentController.prototype.getExperimentsOld)),

            async function ExperimentController_getExperimentsOld(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"include":{"ref":"IncludeExperimentKeys"},"filter":{"ref":"ExperimentFilterNode","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/dataset',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.addDataset)),

            async function ExperimentDatasetController_addDataset(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"NewDatasetParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/dataset/random',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.addRandomDataset)),

            async function ExperimentDatasetController_addRandomDataset(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"RandomDatasetParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/dataset/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.getDatasets)),

            async function ExperimentDatasetController_getDatasets(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"promptVersionId":{"dataType":"string"}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/dataset/:datasetId/row/insert',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.insertDatasetRow)),

            async function ExperimentDatasetController_insertDatasetRow(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"originalColumnId":{"dataType":"string"},"inputs":{"ref":"Record_string.string_","required":true},"inputRecordId":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/dataset/:datasetId/version/:promptVersionId/row/new',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.createDatasetRow)),

            async function ExperimentDatasetController_createDatasetRow(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"sourceRequest":{"dataType":"string"},"inputs":{"ref":"Record_string.string_","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                    promptVersionId: {"in":"path","name":"promptVersionId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/dataset/:datasetId/inputs/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.getDataset)),

            async function ExperimentDatasetController_getDataset(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/experiment/dataset/:datasetId/mutate',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(ExperimentDatasetController.prototype.mutateDataset)),

            async function ExperimentDatasetController_mutateDataset(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"removeRequests":{"dataType":"array","array":{"dataType":"string"},"required":true},"addRequests":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/helicone-dataset',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.addHeliconeDataset)),

            async function HeliconeDatasetController_addHeliconeDataset(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"NewHeliconeDatasetParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/helicone-dataset/:datasetId/mutate',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.mutateHeliconeDataset)),

            async function HeliconeDatasetController_mutateHeliconeDataset(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"MutateParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/helicone-dataset/:datasetId/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.queryHeliconeDatasetRows)),

            async function HeliconeDatasetController_queryHeliconeDatasetRows(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"limit":{"dataType":"double","required":true},"offset":{"dataType":"double","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/helicone-dataset/:datasetId/count',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.countHeliconeDatasetRows)),

            async function HeliconeDatasetController_countHeliconeDatasetRows(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/helicone-dataset/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.queryHeliconeDataset)),

            async function HeliconeDatasetController_queryHeliconeDataset(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"datasetIds":{"dataType":"array","array":{"dataType":"string"}}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/helicone-dataset/:datasetId/request/:requestId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController)),
            ...(fetchMiddlewares<RequestHandler>(HeliconeDatasetController.prototype.updateHeliconeDatasetRequest)),

            async function HeliconeDatasetController_updateHeliconeDatasetRequest(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    datasetId: {"in":"path","name":"datasetId","required":true,"dataType":"string"},
                    requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"responseBody":{"ref":"Json","required":true},"requestBody":{"ref":"Json","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/evals/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvalController)),
            ...(fetchMiddlewares<RequestHandler>(EvalController.prototype.queryEvals)),

            async function EvalController_queryEvals(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    evalQueryParams: {"in":"body","name":"evalQueryParams","required":true,"ref":"EvalQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/evals/scores',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvalController)),
            ...(fetchMiddlewares<RequestHandler>(EvalController.prototype.getEvalScores)),

            async function EvalController_getEvalScores(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/evals/:requestId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvalController)),
            ...(fetchMiddlewares<RequestHandler>(EvalController.prototype.addEval)),

            async function EvalController_addEval(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestId: {"in":"path","name":"requestId","required":true,"dataType":"string"},
                    evalData: {"in":"body","name":"evalData","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"score":{"dataType":"double","required":true},"name":{"dataType":"string","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/evals/score-distributions/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(EvalController)),
            ...(fetchMiddlewares<RequestHandler>(EvalController.prototype.queryScoreDistributions)),

            async function EvalController_queryScoreDistributions(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    evalQueryParams: {"in":"body","name":"evalQueryParams","required":true,"ref":"EvalQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/dataisbeautiful/total-values',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getTotalValues)),

            async function DataIsBeautifulRouter_getTotalValues(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/dataisbeautiful/model/usage/overtime',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getModelUsageOverTime)),

            async function DataIsBeautifulRouter_getModelUsageOverTime(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/dataisbeautiful/provider/usage/overtime',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getProviderUsageOverTime)),

            async function DataIsBeautifulRouter_getProviderUsageOverTime(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/dataisbeautiful/total-requests',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getTotalRequests)),

            async function DataIsBeautifulRouter_getTotalRequests(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/dataisbeautiful/ttft-vs-prompt-length',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getTTFTvsPromptInputLength)),

            async function DataIsBeautifulRouter_getTTFTvsPromptInputLength(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/dataisbeautiful/model/percentage',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getModelPercentage)),

            async function DataIsBeautifulRouter_getModelPercentage(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/dataisbeautiful/model/cost',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getModelCost)),

            async function DataIsBeautifulRouter_getModelCost(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/dataisbeautiful/provider/percentage',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getProviderPercentage)),

            async function DataIsBeautifulRouter_getProviderPercentage(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/public/dataisbeautiful/model/percentage/overtime',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter)),
            ...(fetchMiddlewares<RequestHandler>(DataIsBeautifulRouter.prototype.getModelPercentageOverTime)),

            async function DataIsBeautifulRouter_getModelPercentageOverTime(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataIsBeautifulRequestBody"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/dashboard/scores/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DashboardController)),
            ...(fetchMiddlewares<RequestHandler>(DashboardController.prototype.getScoresOverTime)),

            async function DashboardController_getScoresOverTime(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"DataOverTimeRequest"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/customer/:customerId/usage/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CustomerController)),
            ...(fetchMiddlewares<RequestHandler>(CustomerController.prototype.getCustomerUsage)),

            async function CustomerController_getCustomerUsage(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    customerId: {"in":"path","name":"customerId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/customer/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CustomerController)),
            ...(fetchMiddlewares<RequestHandler>(CustomerController.prototype.getCustomers)),

            async function CustomerController_getCustomers(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v1/api-keys/provider-key/:providerKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.deleteProviderKey)),

            async function ApiKeyController_deleteProviderKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    providerKeyId: {"in":"path","name":"providerKeyId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/api-keys/provider-key',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.createProviderKey)),

            async function ApiKeyController_createProviderKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"providerKeyName":{"dataType":"string","required":true},"config":{"ref":"Record_string.string_","required":true},"providerKey":{"dataType":"string","required":true},"providerName":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/api-keys/provider-key/:providerKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.getProviderKey)),

            async function ApiKeyController_getProviderKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    providerKeyId: {"in":"path","name":"providerKeyId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/api-keys/provider-keys',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.getProviderKeys)),

            async function ApiKeyController_getProviderKeys(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.patch('/v1/api-keys/provider-key/:providerKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.updateProviderKey)),

            async function ApiKeyController_updateProviderKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    providerKeyId: {"in":"path","name":"providerKeyId","required":true,"dataType":"string"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"config":{"ref":"Record_string.string_"},"providerKey":{"dataType":"string"}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.get('/v1/api-keys',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.getAPIKeys)),

            async function ApiKeyController_getAPIKeys(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/api-keys',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.createAPIKey)),

            async function ApiKeyController_createAPIKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"key_permissions":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["rw"]},{"dataType":"enum","enums":["r"]},{"dataType":"enum","enums":["w"]}]},"api_key_name":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.post('/v1/api-keys/proxy-key',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.createProxyKey)),

            async function ApiKeyController_createProxyKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"proxyKeyName":{"dataType":"string","required":true},"providerKeyId":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.delete('/v1/api-keys/:apiKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.deleteAPIKey)),

            async function ApiKeyController_deleteAPIKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    apiKeyId: {"in":"path","name":"apiKeyId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
        app.patch('/v1/api-keys/:apiKeyId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController)),
            ...(fetchMiddlewares<RequestHandler>(ApiKeyController.prototype.updateAPIKey)),

            async function ApiKeyController_updateAPIKey(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    apiKeyId: {"in":"path","name":"apiKeyId","required":true,"dataType":"string"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"api_key_name":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

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
