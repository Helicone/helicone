import { Controller, Get, Route, Tags } from "tsoa";
import { registry } from "../../../../../packages/cost/models/registry";

interface OAIModel {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
}

interface OAIModelsResponse {
  object: "list";
  data: OAIModel[];
}

@Route("/v1/models")
@Tags("Models")
export class ModelController extends Controller {
  private dateToUnixTimestamp(dateString?: string): number {
    if (!dateString) {
      return Math.floor(new Date("2024-01-01").getTime() / 1000);
    }
    return Math.floor(new Date(dateString).getTime() / 1000);
  }

  @Get("/")
  public async getModels(): Promise<OAIModelsResponse> {
    try {
      const allModelsResult = registry.getAllModelsWithIds();
      if (allModelsResult.error) {
        this.setStatus(500);
        throw new Error("Failed to fetch models from registry");
      }

      const oaiModels: OAIModel[] = [];

      for (const [modelId, modelConfig] of Object.entries(
        allModelsResult.data!
      )) {
        const endpointsResult = registry.getEndpointsByModel(modelId);
        if (
          !endpointsResult.data ||
          endpointsResult.data.length === 0 ||
          endpointsResult.error
        ) {
          continue;
        }

        const allEndpointsRequireExplicitRouting = endpointsResult.data.every(
          (ep) => ep.modelConfig.requireExplicitRouting === true
        );
        if (allEndpointsRequireExplicitRouting) {
          continue;
        }

        oaiModels.push({
          id: modelId,
          object: "model",
          created: this.dateToUnixTimestamp(modelConfig.created),
          owned_by: modelConfig.author,
        });
      }

      this.setStatus(200);
      return {
        object: "list",
        data: oaiModels,
      };
    } catch (error) {
      console.error("Error fetching models:", error);
      this.setStatus(500);
      throw new Error("Internal server error while fetching models");
    }
  }

  @Get("/multimodal")
  public async getMultimodalModels(): Promise<OAIModelsResponse> {
    try {
      const allModelsResult = registry.getAllModelsWithIds();
      if (allModelsResult.error) {
        this.setStatus(500);
        throw new Error("Failed to fetch models from registry");
      }

      const oaiModels: OAIModel[] = [];

      for (const [modelId, modelConfig] of Object.entries(
        allModelsResult.data!
      )) {
        // Filter for multimodal models: inputs other than "text" OR outputs other than "text"
        const hasMultimodalInputs =
          modelConfig.modality.inputs.length > 1 ||
          (modelConfig.modality.inputs.length === 1 &&
            modelConfig.modality.inputs[0] !== "text");
        const hasMultimodalOutputs =
          modelConfig.modality.outputs.length > 1 ||
          (modelConfig.modality.outputs.length === 1 &&
            modelConfig.modality.outputs[0] !== "text");

        if (!hasMultimodalInputs && !hasMultimodalOutputs) {
          continue;
        }

        const endpointsResult = registry.getEndpointsByModel(modelId);
        if (
          !endpointsResult.data ||
          endpointsResult.data.length === 0 ||
          endpointsResult.error
        ) {
          continue;
        }

        const allEndpointsRequireExplicitRouting = endpointsResult.data.every(
          (ep) => ep.modelConfig.requireExplicitRouting === true
        );
        if (allEndpointsRequireExplicitRouting) {
          continue;
        }

        oaiModels.push({
          id: modelId,
          object: "model",
          created: this.dateToUnixTimestamp(modelConfig.created),
          owned_by: modelConfig.author,
        });
      }

      this.setStatus(200);
      return {
        object: "list",
        data: oaiModels,
      };
    } catch (error) {
      console.error("Error fetching multimodal models:", error);
      this.setStatus(500);
      throw new Error("Internal server error while fetching multimodal models");
    }
  }
}
