/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EvaluatorController } from './../../controllers/public/evaluatorController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ExperimentV2Controller } from './../../controllers/public/experimentV2Controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { RequestController } from './../../controllers/public/requestController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PromptController } from './../../controllers/public/promptController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SettingController } from './../../controllers/private/settingsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { StripeController } from './../../controllers/public/stripeController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OrganizationController } from './../../controllers/private/organizationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LogController } from './../../controllers/private/logController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GovOrganizationController } from './../../controllers/private/govOrganizationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GenerateHashController } from './../../controllers/private/generateHashController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DatasetController } from './../../controllers/private/datasetController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { FineTuneMainController } from './../../controllers/private/fineTuneController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { FilterController } from './../../controllers/private/filterController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DemoController } from './../../controllers/private/demoController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AlertController } from './../../controllers/private/alertController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AdminController } from './../../controllers/private/adminController';
import { expressAuthentication } from './../../authentication';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
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
    "ResultError_string_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"enum","enums":[null],"required":true},
            "error": {"dataType":"string","required":true},
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
    "Record_string.any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
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
    "Partial_NumberOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"not-equals":{"dataType":"double"},"equals":{"dataType":"double"},"gte":{"dataType":"double"},"lte":{"dataType":"double"},"lt":{"dataType":"double"},"gt":{"dataType":"double"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TimestampOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"gte":{"dataType":"string"},"lte":{"dataType":"string"},"lt":{"dataType":"string"},"gt":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_BooleanOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"equals":{"dataType":"boolean"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TextOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"not-equals":{"dataType":"string"},"equals":{"dataType":"string"},"like":{"dataType":"string"},"ilike":{"dataType":"string"},"contains":{"dataType":"string"},"not-contains":{"dataType":"string"}},"validators":{}},
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
    "Partial_ResponseTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"body_tokens":{"ref":"Partial_NumberOperators_"},"body_model":{"ref":"Partial_TextOperators_"},"body_completion":{"ref":"Partial_TextOperators_"},"status":{"ref":"Partial_NumberOperators_"},"model":{"ref":"Partial_TextOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_VectorOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"contains":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_RequestResponseSearchToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"request_body_vector":{"ref":"Partial_VectorOperators_"},"response_body_vector":{"ref":"Partial_VectorOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_TimestampOperatorsTyped_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"gte":{"dataType":"datetime"},"lte":{"dataType":"datetime"},"lt":{"dataType":"datetime"},"gt":{"dataType":"datetime"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_CacheHitsTableToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"organization_id":{"ref":"Partial_TextOperators_"},"request_id":{"ref":"Partial_TextOperators_"},"latency":{"ref":"Partial_NumberOperators_"},"completion_tokens":{"ref":"Partial_NumberOperators_"},"prompt_tokens":{"ref":"Partial_NumberOperators_"},"created_at":{"ref":"Partial_TimestampOperatorsTyped_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_RequestResponseRMTToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"latency":{"ref":"Partial_NumberOperators_"},"status":{"ref":"Partial_NumberOperators_"},"request_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"response_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"model":{"ref":"Partial_TextOperators_"},"user_id":{"ref":"Partial_TextOperators_"},"organization_id":{"ref":"Partial_TextOperators_"},"node_id":{"ref":"Partial_TextOperators_"},"job_id":{"ref":"Partial_TextOperators_"},"threat":{"ref":"Partial_BooleanOperators_"},"request_id":{"ref":"Partial_TextOperators_"},"prompt_tokens":{"ref":"Partial_NumberOperators_"},"completion_tokens":{"ref":"Partial_NumberOperators_"},"total_tokens":{"ref":"Partial_NumberOperators_"},"target_url":{"ref":"Partial_TextOperators_"},"properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"search_properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"scores":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"scores_column":{"ref":"Partial_TextOperators_"},"request_body":{"ref":"Partial_VectorOperators_"},"response_body":{"ref":"Partial_VectorOperators_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_SessionsRequestResponseRMTToOperators_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"session_session_id":{"ref":"Partial_TextOperators_"},"session_session_name":{"ref":"Partial_TextOperators_"},"session_total_cost":{"ref":"Partial_NumberOperators_"},"session_total_tokens":{"ref":"Partial_NumberOperators_"},"session_prompt_tokens":{"ref":"Partial_NumberOperators_"},"session_completion_tokens":{"ref":"Partial_NumberOperators_"},"session_total_requests":{"ref":"Partial_NumberOperators_"},"session_created_at":{"ref":"Partial_TimestampOperatorsTyped_"},"session_latest_request_created_at":{"ref":"Partial_TimestampOperatorsTyped_"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_FilterLeaf.feedback-or-request-or-response-or-properties-or-values-or-request_response_search-or-cache_hits-or-request_response_rmt-or-sessions_request_response_rmt_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"feedback":{"ref":"Partial_FeedbackTableToOperators_"},"request":{"ref":"Partial_RequestTableToOperators_"},"response":{"ref":"Partial_ResponseTableToOperators_"},"properties":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"values":{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"ref":"Partial_TextOperators_"}},"request_response_search":{"ref":"Partial_RequestResponseSearchToOperators_"},"cache_hits":{"ref":"Partial_CacheHitsTableToOperators_"},"request_response_rmt":{"ref":"Partial_RequestResponseRMTToOperators_"},"sessions_request_response_rmt":{"ref":"Partial_SessionsRequestResponseRMTToOperators_"}},"validators":{}},
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
    "SortDirection": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}],"validators":{}},
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
    "NewOrganizationParams": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"tier":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"subscription_status":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"stripe_subscription_item_id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"stripe_subscription_id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"stripe_metadata":{"ref":"Json"},"stripe_customer_id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"soft_delete":{"dataType":"boolean"},"size":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"reseller_id":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"request_limit":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},"referral":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"percent_to_log":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},"owner":{"dataType":"string","required":true},"organization_type":{"dataType":"string"},"org_provider_key":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"onboarding_status":{"ref":"Json"},"name":{"dataType":"string","required":true},"logo_path":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"limits":{"dataType":"union","subSchemas":[{"ref":"Json"},{"dataType":"enum","enums":[null]}]},"is_personal":{"dataType":"boolean"},"is_main_org":{"dataType":"boolean"},"id":{"dataType":"string"},"icon":{"dataType":"string"},"has_onboarded":{"dataType":"boolean"},"governance_settings":{"dataType":"union","subSchemas":[{"ref":"Json"},{"dataType":"enum","enums":[null]}]},"domain":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"created_at":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"color":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_NewOrganizationParams.name-or-color-or-icon-or-org_provider_key-or-limits-or-reseller_id-or-organization_type-or-onboarding_status_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true},"color":{"dataType":"string"},"icon":{"dataType":"string"},"org_provider_key":{"dataType":"string"},"limits":{"ref":"Json"},"reseller_id":{"dataType":"string"},"organization_type":{"dataType":"string"},"onboarding_status":{"ref":"Json"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateOrganizationParams": {
        "dataType": "refAlias",
        "type": {"dataType":"intersection","subSchemas":[{"ref":"Pick_NewOrganizationParams.name-or-color-or-icon-or-org_provider_key-or-limits-or-reseller_id-or-organization_type-or-onboarding_status_"},{"dataType":"nestedObjectLiteral","nestedProperties":{"variant":{"dataType":"string"}}}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UIFilterRowTree": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"UIFilterRowNode"},{"ref":"FilterRow"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UIFilterRowNode": {
        "dataType": "refObject",
        "properties": {
            "operator": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["and"]},{"dataType":"enum","enums":["or"]}],"required":true},
            "rows": {"dataType":"array","array":{"dataType":"refAlias","ref":"UIFilterRowTree"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FilterRow": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"value":{"dataType":"string","required":true},"operatorIdx":{"dataType":"double","required":true},"filterMapIdx":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OrganizationFilter": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"softDelete":{"dataType":"boolean","required":true},"createdAt":{"dataType":"string"},"filter":{"dataType":"array","array":{"dataType":"refAlias","ref":"UIFilterRowTree"},"required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OrganizationLayout": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"filters":{"dataType":"array","array":{"dataType":"refAlias","ref":"OrganizationFilter"},"required":true},"type":{"dataType":"string","required":true},"organization_id":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_OrganizationLayout_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"OrganizationLayout","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_OrganizationLayout.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_OrganizationLayout_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OrganizationMember": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"org_role":{"dataType":"string","required":true},"member":{"dataType":"string","required":true},"email":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_OrganizationMember-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"OrganizationMember"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_OrganizationMember-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_OrganizationMember-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OrganizationOwner": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"tier":{"dataType":"string","required":true},"email":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_OrganizationOwner-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"OrganizationOwner"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_OrganizationOwner-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_OrganizationOwner-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial__currentStep-string--selectedTier-string--hasOnboarded-boolean--members-any-Array--addons_58__prompts-boolean--experiments-boolean--evals-boolean___": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"currentStep":{"dataType":"string"},"selectedTier":{"dataType":"string"},"hasOnboarded":{"dataType":"boolean"},"members":{"dataType":"array","array":{"dataType":"any"}},"addons":{"dataType":"nestedObjectLiteral","nestedProperties":{"evals":{"dataType":"boolean","required":true},"experiments":{"dataType":"boolean","required":true},"prompts":{"dataType":"boolean","required":true}}}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OnboardingStatus": {
        "dataType": "refAlias",
        "type": {"ref":"Partial__currentStep-string--selectedTier-string--hasOnboarded-boolean--members-any-Array--addons_58__prompts-boolean--experiments-boolean--evals-boolean___","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "HeliconeMeta": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"heliconeManualAccessKey":{"dataType":"string"},"lytixHost":{"dataType":"string"},"lytixKey":{"dataType":"string"},"posthogHost":{"dataType":"string"},"posthogApiKey":{"dataType":"string"},"webhookEnabled":{"dataType":"boolean","required":true},"omitResponseLog":{"dataType":"boolean","required":true},"omitRequestLog":{"dataType":"boolean","required":true},"modelOverride":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TemplateWithInputs": {
        "dataType": "refObject",
        "properties": {
            "template": {"dataType":"object","required":true},
            "inputs": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"string"},"required":true},
            "autoInputs": {"dataType":"array","array":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Log": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"response":{"dataType":"nestedObjectLiteral","nestedProperties":{"delayMs":{"dataType":"double","required":true},"responseCreatedAt":{"dataType":"datetime","required":true},"timeToFirstToken":{"dataType":"double"},"bodySize":{"dataType":"double","required":true},"status":{"dataType":"double","required":true},"id":{"dataType":"string","required":true}},"required":true},"request":{"dataType":"nestedObjectLiteral","nestedProperties":{"experimentRowIndex":{"dataType":"string"},"experimentColumnId":{"dataType":"string"},"heliconeTemplate":{"ref":"TemplateWithInputs"},"isStream":{"dataType":"boolean","required":true},"requestCreatedAt":{"dataType":"datetime","required":true},"countryCode":{"dataType":"string"},"threat":{"dataType":"boolean"},"path":{"dataType":"string","required":true},"bodySize":{"dataType":"double","required":true},"provider":{"ref":"Provider","required":true},"targetUrl":{"dataType":"string","required":true},"heliconeProxyKeyId":{"dataType":"string"},"heliconeApiKeyId":{"dataType":"double"},"properties":{"ref":"Record_string.string_","required":true},"promptVersion":{"dataType":"string"},"promptId":{"dataType":"string"},"userId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "KafkaMessageContents": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"log":{"ref":"Log","required":true},"heliconeMeta":{"ref":"HeliconeMeta","required":true},"authorization":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
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
    "PostgrestResponseSuccess__created_at-string--governance_limits-Json--member-string--org_role-string--organization-string__": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"double","required":true},
            "statusText": {"dataType":"string","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"organization":{"dataType":"string","required":true},"org_role":{"dataType":"string","required":true},"member":{"dataType":"string","required":true},"governance_limits":{"ref":"Json","required":true},"created_at":{"dataType":"string","required":true}},"required":true},
            "count": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
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
    "PostgrestResponseFailure": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"double","required":true},
            "statusText": {"dataType":"string","required":true},
            "error": {"ref":"PostgrestError","required":true},
            "data": {"dataType":"enum","enums":[null],"required":true},
            "count": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PostgrestSingleResponse__created_at-string--governance_limits-Json--member-string--org_role-string--organization-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"PostgrestResponseSuccess__created_at-string--governance_limits-Json--member-string--org_role-string--organization-string__"},{"ref":"PostgrestResponseFailure"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PostgrestResponseSuccess__governance_settings-Json__": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"double","required":true},
            "statusText": {"dataType":"string","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
            "data": {"dataType":"nestedObjectLiteral","nestedProperties":{"governance_settings":{"ref":"Json","required":true}},"required":true},
            "count": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PostgrestSingleResponse__governance_settings-Json__": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"PostgrestResponseSuccess__governance_settings-Json__"},{"ref":"PostgrestResponseFailure"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "KeyPermissions": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["w"]},{"dataType":"enum","enums":["rw"]},{"dataType":"undefined"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GenerateHashQueryParams": {
        "dataType": "refObject",
        "properties": {
            "apiKey": {"dataType":"string","required":true},
            "governance": {"dataType":"boolean","required":true},
            "keyName": {"dataType":"string","required":true},
            "permissions": {"ref":"KeyPermissions","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FineTuneResult": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"error":{"dataType":"string","required":true}}},{"dataType":"nestedObjectLiteral","nestedProperties":{"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"url":{"dataType":"string","required":true},"fineTuneJob":{"dataType":"string","required":true}},"required":true},"success":{"dataType":"boolean","required":true}}}],"validators":{}},
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
    "StoreFilterType": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"string"},"filter":{"dataType":"any","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_StoreFilterType-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refAlias","ref":"StoreFilterType"},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_StoreFilterType-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_StoreFilterType-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_StoreFilterType_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"StoreFilterType","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_StoreFilterType.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_StoreFilterType_"},{"ref":"ResultError_string_"}],"validators":{}},
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
    "ChatCompletionMessageToolCall.Function": {
        "dataType": "refObject",
        "properties": {
            "arguments": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessageToolCall": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "function": {"ref":"ChatCompletionMessageToolCall.Function","required":true},
            "type": {"dataType":"enum","enums":["function"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionMessage": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "refusal": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "role": {"dataType":"enum","enums":["assistant"],"required":true},
            "audio": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionAudio"},{"dataType":"enum","enums":[null]}]},
            "function_call": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionMessage.FunctionCall"},{"dataType":"enum","enums":[null]}]},
            "tool_calls": {"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletionMessageToolCall"}},
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
            "audio_tokens": {"dataType":"double"},
            "reasoning_tokens": {"dataType":"double"},
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
            "service_tier": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["scale"]},{"dataType":"enum","enums":["default"]},{"dataType":"enum","enums":[null]}]},
            "system_fingerprint": {"dataType":"string"},
            "usage": {"ref":"CompletionUsage"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_ChatCompletion_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"ChatCompletion","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_ChatCompletion.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_ChatCompletion_"},{"ref":"ResultError_string_"}],"validators":{}},
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
    "ChatCompletionContentPart": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionContentPartText"},{"ref":"ChatCompletionContentPartImage"},{"ref":"ChatCompletionContentPartInputAudio"}],"validators":{}},
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
            "tool_calls": {"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletionMessageToolCall"}},
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
        "type": {"dataType":"union","subSchemas":[{"ref":"ChatCompletionSystemMessageParam"},{"ref":"ChatCompletionUserMessageParam"},{"ref":"ChatCompletionAssistantMessageParam"},{"ref":"ChatCompletionToolMessageParam"},{"ref":"ChatCompletionFunctionMessageParam"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.unknown_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FunctionParameters": {
        "dataType": "refAlias",
        "type": {"ref":"Record_string.unknown_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "FunctionDefinition": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "parameters": {"ref":"FunctionParameters"},
            "strict": {"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionTool": {
        "dataType": "refObject",
        "properties": {
            "function": {"ref":"FunctionDefinition","required":true},
            "type": {"dataType":"enum","enums":["function"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionNamedToolChoice.Function": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionNamedToolChoice": {
        "dataType": "refObject",
        "properties": {
            "function": {"ref":"ChatCompletionNamedToolChoice.Function","required":true},
            "type": {"dataType":"enum","enums":["function"],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatCompletionToolChoiceOption": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["none"]},{"dataType":"enum","enums":["auto"]},{"dataType":"enum","enums":["required"]},{"ref":"ChatCompletionNamedToolChoice"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AlertResponse": {
        "dataType": "refObject",
        "properties": {
            "alerts": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"updated_at":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"time_window":{"dataType":"double","required":true},"time_block_duration":{"dataType":"double","required":true},"threshold":{"dataType":"double","required":true},"status":{"dataType":"string","required":true},"soft_delete":{"dataType":"boolean","required":true},"slack_channels":{"dataType":"array","array":{"dataType":"string"},"required":true},"org_id":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"minimum_request_count":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"metric":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"emails":{"dataType":"array","array":{"dataType":"string"},"required":true},"created_at":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},"required":true},
            "history": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"updated_at":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"triggered_value":{"dataType":"string","required":true},"status":{"dataType":"string","required":true},"soft_delete":{"dataType":"boolean","required":true},"org_id":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"created_at":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"alert_start_time":{"dataType":"string","required":true},"alert_name":{"dataType":"string","required":true},"alert_metric":{"dataType":"string","required":true},"alert_id":{"dataType":"string","required":true},"alert_end_time":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess_AlertResponse_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"AlertResponse","required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result_AlertResponse.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess_AlertResponse_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AlertRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "metric": {"dataType":"string","required":true},
            "threshold": {"dataType":"double","required":true},
            "time_window": {"dataType":"string","required":true},
            "emails": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "slack_channels": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "minimum_request_count": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"undefined"}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ResultSuccess__organization_id-string--name-string--flags-string-Array_-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"flags":{"dataType":"array","array":{"dataType":"string"},"required":true},"name":{"dataType":"string","required":true},"organization_id":{"dataType":"string","required":true}}},"required":true},
            "error": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result__organization_id-string--name-string--flags-string-Array_-Array.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"ResultSuccess__organization_id-string--name-string--flags-string-Array_-Array_"},{"ref":"ResultError_string_"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "KafkaSettings": {
        "dataType": "refObject",
        "properties": {
            "miniBatchSize": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AzureExperiment": {
        "dataType": "refObject",
        "properties": {
            "azureBaseUri": {"dataType":"string","required":true},
            "azureApiVersion": {"dataType":"string","required":true},
            "azureDeploymentName": {"dataType":"string","required":true},
            "azureApiKey": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiKey": {
        "dataType": "refObject",
        "properties": {
            "apiKey": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Setting": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"KafkaSettings"},{"ref":"AzureExperiment"},{"ref":"ApiKey"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SettingName": {
        "dataType": "refAlias",
        "type": {"dataType":"enum","enums":["kafka:dlq","kafka:log","kafka:score","kafka:dlq:score","kafka:dlq:eu","kafka:log:eu","kafka:orgs-to-dlq","azure:experiment","openai:apiKey","anthropic:apiKey","openrouter:apiKey"],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "url.URL": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
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
        app.get('/v1/settings/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SettingController)),
            ...(fetchMiddlewares<RequestHandler>(SettingController.prototype.getSettings)),

            async function SettingController_getSettings(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new SettingController();

              await templateService.apiHandler({
                methodName: 'getSettings',
                controller,
                response,
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
        app.post('/v1/organization/user/accept_terms',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.acceptTerms)),

            async function OrganizationController_acceptTerms(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'acceptTerms',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/organization/create',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.createNewOrganization)),

            async function OrganizationController_createNewOrganization(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"NewOrganizationParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'createNewOrganization',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/organization/:organizationId/update',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.updateOrganization)),

            async function OrganizationController_updateOrganization(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"UpdateOrganizationParams"},
                    organizationId: {"in":"path","name":"organizationId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'updateOrganization',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/organization/onboard',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.onboardOrganization)),

            async function OrganizationController_onboardOrganization(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'onboardOrganization',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/organization/:organizationId/add_member',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.addMemberToOrganization)),

            async function OrganizationController_addMemberToOrganization(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string","required":true}}},
                    organizationId: {"in":"path","name":"organizationId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'addMemberToOrganization',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/organization/:organizationId/create_filter',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.createOrganizationFilter)),

            async function OrganizationController_createOrganizationFilter(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"filterType":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["dashboard"]},{"dataType":"enum","enums":["requests"]}],"required":true},"filters":{"dataType":"array","array":{"dataType":"refAlias","ref":"OrganizationFilter"},"required":true}}},
                    organizationId: {"in":"path","name":"organizationId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'createOrganizationFilter',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/organization/:organizationId/update_filter',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.updateOrganizationFilter)),

            async function OrganizationController_updateOrganizationFilter(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"filterType":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["dashboard"]},{"dataType":"enum","enums":["requests"]}],"required":true},"filters":{"dataType":"array","array":{"dataType":"refAlias","ref":"OrganizationFilter"},"required":true}}},
                    organizationId: {"in":"path","name":"organizationId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'updateOrganizationFilter',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/v1/organization/delete',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.deleteOrganization)),

            async function OrganizationController_deleteOrganization(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'deleteOrganization',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/organization/:organizationId/layout',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.getOrganizationLayout)),

            async function OrganizationController_getOrganizationLayout(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    organizationId: {"in":"path","name":"organizationId","required":true,"dataType":"string"},
                    filterType: {"in":"query","name":"filterType","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'getOrganizationLayout',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/organization/:organizationId/members',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.getOrganizationMembers)),

            async function OrganizationController_getOrganizationMembers(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    organizationId: {"in":"path","name":"organizationId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'getOrganizationMembers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/organization/:organizationId/update_member',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.updateOrganizationMember)),

            async function OrganizationController_updateOrganizationMember(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"memberId":{"dataType":"string","required":true},"role":{"dataType":"string","required":true}}},
                    organizationId: {"in":"path","name":"organizationId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'updateOrganizationMember',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/organization/:organizationId/owner',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.getOrganizationOwner)),

            async function OrganizationController_getOrganizationOwner(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    organizationId: {"in":"path","name":"organizationId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'getOrganizationOwner',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/v1/organization/:organizationId/remove_member',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.removeMemberFromOrganization)),

            async function OrganizationController_removeMemberFromOrganization(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    organizationId: {"in":"path","name":"organizationId","required":true,"dataType":"string"},
                    memberId: {"in":"query","name":"memberId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'removeMemberFromOrganization',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/organization/setup-demo',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.setupDemo)),

            async function OrganizationController_setupDemo(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'setupDemo',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/organization/update_onboarding',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(OrganizationController.prototype.updateOnboardingStatus)),

            async function OrganizationController_updateOnboardingStatus(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"has_onboarded":{"dataType":"boolean","required":true},"name":{"dataType":"string","required":true},"onboarding_status":{"ref":"OnboardingStatus","required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new OrganizationController();

              await templateService.apiHandler({
                methodName: 'updateOnboardingStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/log/request',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LogController)),
            ...(fetchMiddlewares<RequestHandler>(LogController.prototype.getRequests)),

            async function LogController_getRequests(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    logMessage: {"in":"body","name":"logMessage","required":true,"ref":"KafkaMessageContents"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new LogController();

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
        app.post('/v1/gov-organization/limits/member/:memberId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GovOrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(GovOrganizationController.prototype.setMemberLimits)),

            async function GovOrganizationController_setMemberLimits(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    memberId: {"in":"path","name":"memberId","required":true,"dataType":"string"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"days":{"dataType":"double","required":true},"limitUSD":{"dataType":"double","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GovOrganizationController();

              await templateService.apiHandler({
                methodName: 'setMemberLimits',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/gov-organization/my-limits',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GovOrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(GovOrganizationController.prototype.getMyLimits)),

            async function GovOrganizationController_getMyLimits(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GovOrganizationController();

              await templateService.apiHandler({
                methodName: 'getMyLimits',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/gov-organization/limits/member/:memberId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GovOrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(GovOrganizationController.prototype.getMemberLimits)),

            async function GovOrganizationController_getMemberLimits(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    memberId: {"in":"path","name":"memberId","required":true,"dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GovOrganizationController();

              await templateService.apiHandler({
                methodName: 'getMemberLimits',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/gov-organization/is-governance-org',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GovOrganizationController)),
            ...(fetchMiddlewares<RequestHandler>(GovOrganizationController.prototype.isGovernanceOrg)),

            async function GovOrganizationController_isGovernanceOrg(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GovOrganizationController();

              await templateService.apiHandler({
                methodName: 'isGovernanceOrg',
                controller,
                response,
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

            async function GenerateHashController_generateHash(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"GenerateHashQueryParams"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new GenerateHashController();

              await templateService.apiHandler({
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

            async function DatasetController_datasetFineTune(request: ExRequest, response: ExResponse, next: any) {
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

              await templateService.apiHandler({
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

            async function FineTuneMainController_fineTune(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    body: {"in":"body","name":"body","required":true,"ref":"FineTuneBody"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new FineTuneMainController();

              await templateService.apiHandler({
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

            async function FineTuneMainController_fineTuneJobStats(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    jobId: {"in":"path","name":"jobId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new FineTuneMainController();

              await templateService.apiHandler({
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
        app.get('/v1/filter',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(FilterController)),
            ...(fetchMiddlewares<RequestHandler>(FilterController.prototype.getFilters)),

            async function FilterController_getFilters(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new FilterController();

              await templateService.apiHandler({
                methodName: 'getFilters',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/filter/:id',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(FilterController)),
            ...(fetchMiddlewares<RequestHandler>(FilterController.prototype.getFilter)),

            async function FilterController_getFilter(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    id: {"in":"path","name":"id","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new FilterController();

              await templateService.apiHandler({
                methodName: 'getFilter',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/filter',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(FilterController)),
            ...(fetchMiddlewares<RequestHandler>(FilterController.prototype.createFilter)),

            async function FilterController_createFilter(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"ref":"StoreFilterType"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new FilterController();

              await templateService.apiHandler({
                methodName: 'createFilter',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/v1/filter/:id',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(FilterController)),
            ...(fetchMiddlewares<RequestHandler>(FilterController.prototype.deleteFilter)),

            async function FilterController_deleteFilter(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    id: {"in":"path","name":"id","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new FilterController();

              await templateService.apiHandler({
                methodName: 'deleteFilter',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/filter/:id',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(FilterController)),
            ...(fetchMiddlewares<RequestHandler>(FilterController.prototype.updateFilter)),

            async function FilterController_updateFilter(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    requestBody: {"in":"body","name":"requestBody","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"filters":{"dataType":"any","required":true}}},
                    id: {"in":"path","name":"id","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new FilterController();

              await templateService.apiHandler({
                methodName: 'updateFilter',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/demo/completion',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DemoController)),
            ...(fetchMiddlewares<RequestHandler>(DemoController.prototype.demoCompletion)),

            async function DemoController_demoCompletion(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"cache_enabled":{"dataType":"boolean"},"max_tokens":{"dataType":"double"},"tool_choice":{"ref":"ChatCompletionToolChoiceOption"},"tools":{"dataType":"array","array":{"dataType":"refObject","ref":"ChatCompletionTool"}},"sessionPath":{"dataType":"string"},"sessionName":{"dataType":"string"},"sessionId":{"dataType":"string"},"userEmail":{"dataType":"string"},"promptId":{"dataType":"string","required":true},"messages":{"dataType":"array","array":{"dataType":"refAlias","ref":"ChatCompletionMessageParam"},"required":true}}},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new DemoController();

              await templateService.apiHandler({
                methodName: 'demoCompletion',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/alert/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AlertController)),
            ...(fetchMiddlewares<RequestHandler>(AlertController.prototype.getAlerts)),

            async function AlertController_getAlerts(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AlertController();

              await templateService.apiHandler({
                methodName: 'getAlerts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/alert/create',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AlertController)),
            ...(fetchMiddlewares<RequestHandler>(AlertController.prototype.createAlert)),

            async function AlertController_createAlert(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    alert: {"in":"body","name":"alert","required":true,"ref":"AlertRequest"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AlertController();

              await templateService.apiHandler({
                methodName: 'createAlert',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/v1/alert/:alertId',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AlertController)),
            ...(fetchMiddlewares<RequestHandler>(AlertController.prototype.deleteAlert)),

            async function AlertController_deleteAlert(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    alertId: {"in":"path","name":"alertId","required":true,"dataType":"string"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AlertController();

              await templateService.apiHandler({
                methodName: 'deleteAlert',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/feature-flags',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.updateFeatureFlags)),

            async function AdminController_updateFeatureFlags(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"orgId":{"dataType":"string","required":true},"flag":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'updateFeatureFlags',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.delete('/v1/admin/feature-flags',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.deleteFeatureFlag)),

            async function AdminController_deleteFeatureFlag(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"orgId":{"dataType":"string","required":true},"flag":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'deleteFeatureFlag',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/feature-flags/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.getFeatureFlags)),

            async function AdminController_getFeatureFlags(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'getFeatureFlags',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/orgs/top-usage',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.getTopOrgsByUsage)),

            async function AdminController_getTopOrgsByUsage(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"minRequests":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'getTopOrgsByUsage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/orgs/top',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.getTopOrgs)),

            async function AdminController_getTopOrgs(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"emailContains":{"dataType":"array","array":{"dataType":"string"}},"orgsNameContains":{"dataType":"array","array":{"dataType":"string"}},"orgsId":{"dataType":"array","array":{"dataType":"string"}},"tier":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["all"]},{"dataType":"enum","enums":["pro"]},{"dataType":"enum","enums":["free"]},{"dataType":"enum","enums":["growth"]},{"dataType":"enum","enums":["enterprise"]}],"required":true},"endDate":{"dataType":"string","required":true},"startDate":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'getTopOrgs',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/admin/admins/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.getAdmins)),

            async function AdminController_getAdmins(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'getAdmins',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/whodis',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.whodis)),

            async function AdminController_whodis(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string"},"userId":{"dataType":"string"},"organizationId":{"dataType":"string"}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'whodis',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/v1/admin/settings/:name',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.getSetting)),

            async function AdminController_getSetting(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    name: {"in":"path","name":"name","required":true,"ref":"SettingName"},
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'getSetting',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/azure/run-test',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.azureTest)),

            async function AdminController_azureTest(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"requestBody":{"dataType":"any","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'azureTest',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/settings',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.updateSetting)),

            async function AdminController_updateSetting(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"settings":{"ref":"Setting","required":true},"name":{"ref":"SettingName","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'updateSetting',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/orgs/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.findAllOrgs)),

            async function AdminController_findAllOrgs(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"orgName":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'findAllOrgs',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/orgs/over-time/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.newOrgsOverTime)),

            async function AdminController_newOrgsOverTime(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"groupBy":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["hour"]},{"dataType":"enum","enums":["day"]},{"dataType":"enum","enums":["week"]},{"dataType":"enum","enums":["month"]}],"required":true},"timeFilter":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["1 days"]},{"dataType":"enum","enums":["7 days"]},{"dataType":"enum","enums":["1 month"]},{"dataType":"enum","enums":["3 months"]},{"dataType":"enum","enums":["6 months"]},{"dataType":"enum","enums":["12 months"]},{"dataType":"enum","enums":["24 months"]}],"required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'newOrgsOverTime',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/admins/org/query',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.addAdminsToOrg)),

            async function AdminController_addAdminsToOrg(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"adminIds":{"dataType":"array","array":{"dataType":"string"},"required":true},"orgId":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'addAdminsToOrg',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/alert_banners',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.createAlertBanner)),

            async function AdminController_createAlertBanner(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true},"title":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'createAlertBanner',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.patch('/v1/admin/alert_banners',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.updateAlertBanner)),

            async function AdminController_updateAlertBanner(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"active":{"dataType":"boolean","required":true},"id":{"dataType":"double","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'updateAlertBanner',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.post('/v1/admin/top-orgs-over-time',
            authenticateMiddleware([{"api_key":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminController)),
            ...(fetchMiddlewares<RequestHandler>(AdminController.prototype.getTopOrgsOverTime)),

            async function AdminController_getTopOrgsOverTime(request: ExRequest, response: ExResponse, next: any) {
            const args: Record<string, TsoaRoute.ParameterSchema> = {
                    request: {"in":"request","name":"request","required":true,"dataType":"object"},
                    body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"groupBy":{"dataType":"string"},"limit":{"dataType":"double","required":true},"timeRange":{"dataType":"string","required":true}}},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args, request, response });

                const controller = new AdminController();

              await templateService.apiHandler({
                methodName: 'getTopOrgsOverTime',
                controller,
                response,
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
