import { useCallback } from "react";

const BASE_URL = "https://app.openpipe.ai/api/v1/unstable";
///Supported models include: OpenPipe/Hermes-2-Theta-Llama-3-8B-32k, meta-llama/Meta-Llama-3-8B-Instruct, meta-llama/Meta-Llama-3-70B-Instruct, OpenPipe/mistral-ft-optimized-1227, mistralai/Mixtral-8x7B-Instruct-v0.1

const SUPPORTED_MODELS = [
  "OpenPipe/Hermes-2-Theta-Llama-3-8B-32k",
  "meta-llama/Meta-Llama-3-8B-Instruct",
  "meta-llama/Meta-Llama-3-70B-Instruct",
  "OpenPipe/mistral-ft-optimized-1227",
  "mistralai/Mixtral-8x7B-Instruct-v0.1",
] as const;

interface OpenPipeClientProps {
  apiKey: string;
}

interface DatasetEntry {
  messages: {
    role: string;
    content: string;
    name?: string;
  }[];
  rejected_message?: {
    content: string;
    refusal: string;
    role?: string;
    function_call?: {
      name: string;
      arguments: string;
    };
    tool_calls?: {
      id: string;
      function: {
        name: string;
        arguments: string;
      };
      type: string;
    }[];
  };
  function_call?: string;
  functions?: {
    name: string;
    parameters: Record<string, unknown>;
    description: string;
    strict: boolean;
  }[];
  tool_choice?: string;
  tools?: {
    function: {
      name: string;
      parameters: Record<string, unknown>;
      description: string;
      strict: boolean;
    };
    type: string;
  }[];
  response_format?: {
    type: string;
  };
  split?: string;
}

interface CreateDatasetEntryResponse {
  createdEntries: number;
  errors: {
    index: number;
    message: string;
  }[];
}

interface CreateDatasetResponse {
  datasetId: string;
}

interface CreateFinetuneRequest {
  datasetId: string;
  slug: string;
  baseModel: (typeof SUPPORTED_MODELS)[number];
  overrides?: {
    batch_size?: string | number;
    learning_rate_multiplier?: number;
    num_epochs?: number;
  };
}

interface Finetune {
  id: string;
  status: string;
  // Add other finetune properties as needed
}

const useOpenPipeClient = ({ apiKey }: OpenPipeClientProps) => {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const fetchWithAuth = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(
          `OpenPipe API error: ${response.statusText} ${
            response.status
          } ${await response.text()}`
        );
      }

      return response.json();
    },
    [apiKey]
  );

  const createDatasetEntry = (
    datasetId: string,
    entries: DatasetEntry[]
  ): Promise<CreateDatasetEntryResponse> => {
    return fetchWithAuth("/dataset-entry/create", {
      method: "POST",
      body: JSON.stringify({ datasetId, entries }),
    });
  };

  const createDataset = (name: string): Promise<CreateDatasetResponse> => {
    return fetchWithAuth("/dataset/create", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  };

  const createFinetune = (
    request: CreateFinetuneRequest
  ): Promise<Finetune> => {
    return fetchWithAuth("/finetune/create", {
      method: "POST",
      body: JSON.stringify(request),
    });
  };

  const getFinetunes = (): Promise<Finetune[]> => {
    return fetchWithAuth("/finetune/get");
  };

  return {
    createDatasetEntry,
    createDataset,
    createFinetune,
    getFinetunes,
  };
};

export default useOpenPipeClient;
