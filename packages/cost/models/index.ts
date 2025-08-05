/**
 * Model Registry Index
 * Auto-generated on: 2025-08-05T01:13:54.380Z
 * 
 * This file combines all author data from the ./authors/ directory
 */

// Model imports
import ai21Models from "./authors/ai21/models.json";
import amazonModels from "./authors/amazon/models.json";
import anthropicModels from "./authors/anthropic/models.json";
import bytedanceModels from "./authors/bytedance/models.json";
import cohereModels from "./authors/cohere/models.json";
import deepseekModels from "./authors/deepseek/models.json";
import googleModels from "./authors/google/models.json";
import inflectionModels from "./authors/inflection/models.json";
import meta_llamaModels from "./authors/meta-llama/models.json";
import microsoftModels from "./authors/microsoft/models.json";
import minimaxModels from "./authors/minimax/models.json";
import mistralaiModels from "./authors/mistralai/models.json";
import moonshotaiModels from "./authors/moonshotai/models.json";
import nvidiaModels from "./authors/nvidia/models.json";
import openaiModels from "./authors/openai/models.json";
import perplexityModels from "./authors/perplexity/models.json";
import qwenModels from "./authors/qwen/models.json";
import rekaaiModels from "./authors/rekaai/models.json";
import x_aiModels from "./authors/x-ai/models.json";

// Endpoint imports
import ai21Endpoints from "./authors/ai21/endpoints.json";
import amazonEndpoints from "./authors/amazon/endpoints.json";
import anthropicEndpoints from "./authors/anthropic/endpoints.json";
import bytedanceEndpoints from "./authors/bytedance/endpoints.json";
import cohereEndpoints from "./authors/cohere/endpoints.json";
import deepseekEndpoints from "./authors/deepseek/endpoints.json";
import googleEndpoints from "./authors/google/endpoints.json";
import inflectionEndpoints from "./authors/inflection/endpoints.json";
import meta_llamaEndpoints from "./authors/meta-llama/endpoints.json";
import microsoftEndpoints from "./authors/microsoft/endpoints.json";
import minimaxEndpoints from "./authors/minimax/endpoints.json";
import mistralaiEndpoints from "./authors/mistralai/endpoints.json";
import moonshotaiEndpoints from "./authors/moonshotai/endpoints.json";
import nvidiaEndpoints from "./authors/nvidia/endpoints.json";
import openaiEndpoints from "./authors/openai/endpoints.json";
import perplexityEndpoints from "./authors/perplexity/endpoints.json";
import qwenEndpoints from "./authors/qwen/endpoints.json";
import rekaaiEndpoints from "./authors/rekaai/endpoints.json";
import x_aiEndpoints from "./authors/x-ai/endpoints.json";

// Metadata imports
import agentica_orgMetadata from "./authors/agentica-org/metadata.json";
import ai21Metadata from "./authors/ai21/metadata.json";
import aion_labsMetadata from "./authors/aion-labs/metadata.json";
import alfredprosMetadata from "./authors/alfredpros/metadata.json";
import alpindaleMetadata from "./authors/alpindale/metadata.json";
import amazonMetadata from "./authors/amazon/metadata.json";
import anthracite_orgMetadata from "./authors/anthracite-org/metadata.json";
import anthropicMetadata from "./authors/anthropic/metadata.json";
import arcee_aiMetadata from "./authors/arcee-ai/metadata.json";
import arliaiMetadata from "./authors/arliai/metadata.json";
import baiduMetadata from "./authors/baidu/metadata.json";
import bytedanceMetadata from "./authors/bytedance/metadata.json";
import cognitivecomputationsMetadata from "./authors/cognitivecomputations/metadata.json";
import cohereMetadata from "./authors/cohere/metadata.json";
import deepseekMetadata from "./authors/deepseek/metadata.json";
import eleutheraiMetadata from "./authors/eleutherai/metadata.json";
import featherlessMetadata from "./authors/featherless/metadata.json";
import googleMetadata from "./authors/google/metadata.json";
import grypheMetadata from "./authors/gryphe/metadata.json";
import inceptionMetadata from "./authors/inception/metadata.json";
import infermaticMetadata from "./authors/infermatic/metadata.json";
import inflectionMetadata from "./authors/inflection/metadata.json";
import liquidMetadata from "./authors/liquid/metadata.json";
import mancerMetadata from "./authors/mancer/metadata.json";
import meta_llamaMetadata from "./authors/meta-llama/metadata.json";
import microsoftMetadata from "./authors/microsoft/metadata.json";
import minimaxMetadata from "./authors/minimax/metadata.json";
import mistralaiMetadata from "./authors/mistralai/metadata.json";
import moonshotaiMetadata from "./authors/moonshotai/metadata.json";
import morphMetadata from "./authors/morph/metadata.json";
import neversleepMetadata from "./authors/neversleep/metadata.json";
import nousresearchMetadata from "./authors/nousresearch/metadata.json";
import nvidiaMetadata from "./authors/nvidia/metadata.json";
import openaiMetadata from "./authors/openai/metadata.json";
import opengvlabMetadata from "./authors/opengvlab/metadata.json";
import openrouterMetadata from "./authors/openrouter/metadata.json";
import perplexityMetadata from "./authors/perplexity/metadata.json";
import pygmalionaiMetadata from "./authors/pygmalionai/metadata.json";
import qwenMetadata from "./authors/qwen/metadata.json";
import raifleMetadata from "./authors/raifle/metadata.json";
import rekaaiMetadata from "./authors/rekaai/metadata.json";
import sao10kMetadata from "./authors/sao10k/metadata.json";
import sarvamaiMetadata from "./authors/sarvamai/metadata.json";
import scb10xMetadata from "./authors/scb10x/metadata.json";
import shisa_aiMetadata from "./authors/shisa-ai/metadata.json";
import sophosympatheiaMetadata from "./authors/sophosympatheia/metadata.json";
import switchpointMetadata from "./authors/switchpoint/metadata.json";
import tencentMetadata from "./authors/tencent/metadata.json";
import thedrummerMetadata from "./authors/thedrummer/metadata.json";
import thudmMetadata from "./authors/thudm/metadata.json";
import tngtechMetadata from "./authors/tngtech/metadata.json";
import undi95Metadata from "./authors/undi95/metadata.json";
import x_aiMetadata from "./authors/x-ai/metadata.json";
import z_aiMetadata from "./authors/z-ai/metadata.json";

import modelVersions from "./model-versions.json";

export interface Model {
  id: string;
  name: string;
  author: string;
  description: string;
  contextLength: number;
  maxOutputTokens: number | null;
  created: string;
  modality: string;
  tokenizer: string;
}

export interface Endpoint {
  name: string;
  provider: string;
  tag: string;
  status: number;
  pricing: {
    prompt: number;
    completion: number;
    image?: number;
    cacheRead?: number | null;
    cacheWrite?: number | null;
  };
  contextLength: number;
  maxCompletionTokens: number | null;
  supportedParameters: string[];
}

export interface Author {
  slug: string;
  name: string;
  models: string[];
}

// Combine all models
export const models: Record<string, Model> = {
  ...ai21Models,
  ...amazonModels,
  ...anthropicModels,
  ...bytedanceModels,
  ...cohereModels,
  ...deepseekModels,
  ...googleModels,
  ...inflectionModels,
  ...meta_llamaModels,
  ...microsoftModels,
  ...minimaxModels,
  ...mistralaiModels,
  ...moonshotaiModels,
  ...nvidiaModels,
  ...openaiModels,
  ...perplexityModels,
  ...qwenModels,
  ...rekaaiModels,
  ...x_aiModels,
};

// Combine all endpoints
export const endpoints: Record<string, Endpoint[]> = {
  ...ai21Endpoints,
  ...amazonEndpoints,
  ...anthropicEndpoints,
  ...bytedanceEndpoints,
  ...cohereEndpoints,
  ...deepseekEndpoints,
  ...googleEndpoints,
  ...inflectionEndpoints,
  ...meta_llamaEndpoints,
  ...microsoftEndpoints,
  ...minimaxEndpoints,
  ...mistralaiEndpoints,
  ...moonshotaiEndpoints,
  ...nvidiaEndpoints,
  ...openaiEndpoints,
  ...perplexityEndpoints,
  ...qwenEndpoints,
  ...rekaaiEndpoints,
  ...x_aiEndpoints,
};

// Build authors map from metadata
export const authors: Record<string, Author> = {
  [agentica_orgMetadata.slug]: {
    slug: agentica_orgMetadata.slug,
    name: agentica_orgMetadata.name,
    models: [],
  },
  [ai21Metadata.slug]: {
    slug: ai21Metadata.slug,
    name: ai21Metadata.name,
    models: Object.keys(ai21Models),
  },
  [aion_labsMetadata.slug]: {
    slug: aion_labsMetadata.slug,
    name: aion_labsMetadata.name,
    models: [],
  },
  [alfredprosMetadata.slug]: {
    slug: alfredprosMetadata.slug,
    name: alfredprosMetadata.name,
    models: [],
  },
  [alpindaleMetadata.slug]: {
    slug: alpindaleMetadata.slug,
    name: alpindaleMetadata.name,
    models: [],
  },
  [amazonMetadata.slug]: {
    slug: amazonMetadata.slug,
    name: amazonMetadata.name,
    models: Object.keys(amazonModels),
  },
  [anthracite_orgMetadata.slug]: {
    slug: anthracite_orgMetadata.slug,
    name: anthracite_orgMetadata.name,
    models: [],
  },
  [anthropicMetadata.slug]: {
    slug: anthropicMetadata.slug,
    name: anthropicMetadata.name,
    models: Object.keys(anthropicModels),
  },
  [arcee_aiMetadata.slug]: {
    slug: arcee_aiMetadata.slug,
    name: arcee_aiMetadata.name,
    models: [],
  },
  [arliaiMetadata.slug]: {
    slug: arliaiMetadata.slug,
    name: arliaiMetadata.name,
    models: [],
  },
  [baiduMetadata.slug]: {
    slug: baiduMetadata.slug,
    name: baiduMetadata.name,
    models: [],
  },
  [bytedanceMetadata.slug]: {
    slug: bytedanceMetadata.slug,
    name: bytedanceMetadata.name,
    models: Object.keys(bytedanceModels),
  },
  [cognitivecomputationsMetadata.slug]: {
    slug: cognitivecomputationsMetadata.slug,
    name: cognitivecomputationsMetadata.name,
    models: [],
  },
  [cohereMetadata.slug]: {
    slug: cohereMetadata.slug,
    name: cohereMetadata.name,
    models: Object.keys(cohereModels),
  },
  [deepseekMetadata.slug]: {
    slug: deepseekMetadata.slug,
    name: deepseekMetadata.name,
    models: Object.keys(deepseekModels),
  },
  [eleutheraiMetadata.slug]: {
    slug: eleutheraiMetadata.slug,
    name: eleutheraiMetadata.name,
    models: [],
  },
  [featherlessMetadata.slug]: {
    slug: featherlessMetadata.slug,
    name: featherlessMetadata.name,
    models: [],
  },
  [googleMetadata.slug]: {
    slug: googleMetadata.slug,
    name: googleMetadata.name,
    models: Object.keys(googleModels),
  },
  [grypheMetadata.slug]: {
    slug: grypheMetadata.slug,
    name: grypheMetadata.name,
    models: [],
  },
  [inceptionMetadata.slug]: {
    slug: inceptionMetadata.slug,
    name: inceptionMetadata.name,
    models: [],
  },
  [infermaticMetadata.slug]: {
    slug: infermaticMetadata.slug,
    name: infermaticMetadata.name,
    models: [],
  },
  [inflectionMetadata.slug]: {
    slug: inflectionMetadata.slug,
    name: inflectionMetadata.name,
    models: Object.keys(inflectionModels),
  },
  [liquidMetadata.slug]: {
    slug: liquidMetadata.slug,
    name: liquidMetadata.name,
    models: [],
  },
  [mancerMetadata.slug]: {
    slug: mancerMetadata.slug,
    name: mancerMetadata.name,
    models: [],
  },
  [meta_llamaMetadata.slug]: {
    slug: meta_llamaMetadata.slug,
    name: meta_llamaMetadata.name,
    models: Object.keys(meta_llamaModels),
  },
  [microsoftMetadata.slug]: {
    slug: microsoftMetadata.slug,
    name: microsoftMetadata.name,
    models: Object.keys(microsoftModels),
  },
  [minimaxMetadata.slug]: {
    slug: minimaxMetadata.slug,
    name: minimaxMetadata.name,
    models: Object.keys(minimaxModels),
  },
  [mistralaiMetadata.slug]: {
    slug: mistralaiMetadata.slug,
    name: mistralaiMetadata.name,
    models: Object.keys(mistralaiModels),
  },
  [moonshotaiMetadata.slug]: {
    slug: moonshotaiMetadata.slug,
    name: moonshotaiMetadata.name,
    models: Object.keys(moonshotaiModels),
  },
  [morphMetadata.slug]: {
    slug: morphMetadata.slug,
    name: morphMetadata.name,
    models: [],
  },
  [neversleepMetadata.slug]: {
    slug: neversleepMetadata.slug,
    name: neversleepMetadata.name,
    models: [],
  },
  [nousresearchMetadata.slug]: {
    slug: nousresearchMetadata.slug,
    name: nousresearchMetadata.name,
    models: [],
  },
  [nvidiaMetadata.slug]: {
    slug: nvidiaMetadata.slug,
    name: nvidiaMetadata.name,
    models: Object.keys(nvidiaModels),
  },
  [openaiMetadata.slug]: {
    slug: openaiMetadata.slug,
    name: openaiMetadata.name,
    models: Object.keys(openaiModels),
  },
  [opengvlabMetadata.slug]: {
    slug: opengvlabMetadata.slug,
    name: opengvlabMetadata.name,
    models: [],
  },
  [openrouterMetadata.slug]: {
    slug: openrouterMetadata.slug,
    name: openrouterMetadata.name,
    models: [],
  },
  [perplexityMetadata.slug]: {
    slug: perplexityMetadata.slug,
    name: perplexityMetadata.name,
    models: Object.keys(perplexityModels),
  },
  [pygmalionaiMetadata.slug]: {
    slug: pygmalionaiMetadata.slug,
    name: pygmalionaiMetadata.name,
    models: [],
  },
  [qwenMetadata.slug]: {
    slug: qwenMetadata.slug,
    name: qwenMetadata.name,
    models: Object.keys(qwenModels),
  },
  [raifleMetadata.slug]: {
    slug: raifleMetadata.slug,
    name: raifleMetadata.name,
    models: [],
  },
  [rekaaiMetadata.slug]: {
    slug: rekaaiMetadata.slug,
    name: rekaaiMetadata.name,
    models: Object.keys(rekaaiModels),
  },
  [sao10kMetadata.slug]: {
    slug: sao10kMetadata.slug,
    name: sao10kMetadata.name,
    models: [],
  },
  [sarvamaiMetadata.slug]: {
    slug: sarvamaiMetadata.slug,
    name: sarvamaiMetadata.name,
    models: [],
  },
  [scb10xMetadata.slug]: {
    slug: scb10xMetadata.slug,
    name: scb10xMetadata.name,
    models: [],
  },
  [shisa_aiMetadata.slug]: {
    slug: shisa_aiMetadata.slug,
    name: shisa_aiMetadata.name,
    models: [],
  },
  [sophosympatheiaMetadata.slug]: {
    slug: sophosympatheiaMetadata.slug,
    name: sophosympatheiaMetadata.name,
    models: [],
  },
  [switchpointMetadata.slug]: {
    slug: switchpointMetadata.slug,
    name: switchpointMetadata.name,
    models: [],
  },
  [tencentMetadata.slug]: {
    slug: tencentMetadata.slug,
    name: tencentMetadata.name,
    models: [],
  },
  [thedrummerMetadata.slug]: {
    slug: thedrummerMetadata.slug,
    name: thedrummerMetadata.name,
    models: [],
  },
  [thudmMetadata.slug]: {
    slug: thudmMetadata.slug,
    name: thudmMetadata.name,
    models: [],
  },
  [tngtechMetadata.slug]: {
    slug: tngtechMetadata.slug,
    name: tngtechMetadata.name,
    models: [],
  },
  [undi95Metadata.slug]: {
    slug: undi95Metadata.slug,
    name: undi95Metadata.name,
    models: [],
  },
  [x_aiMetadata.slug]: {
    slug: x_aiMetadata.slug,
    name: x_aiMetadata.name,
    models: Object.keys(x_aiModels),
  },
  [z_aiMetadata.slug]: {
    slug: z_aiMetadata.slug,
    name: z_aiMetadata.name,
    models: [],
  },
};

// Export registry
export const registry = {
  models,
  endpoints,
  authors,
  modelVersions: modelVersions as Record<string, string[]>,
};

// Helper functions
export function getModel(modelKey: string): Model | undefined {
  return registry.models[modelKey];
}

export function getEndpoints(modelKey: string): Endpoint[] {
  return registry.endpoints[modelKey] || [];
}

export function getAuthor(authorSlug: string): Author | undefined {
  return registry.authors[authorSlug];
}

export function getModelVersions(baseModel: string): string[] {
  return registry.modelVersions[baseModel] || [];
}
