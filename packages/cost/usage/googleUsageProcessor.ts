import { VertexOpenAIUsageProcessor } from "./vertexUsageProcessor";
import { IUsageProcessor } from "./IUsageProcessor";

// Google AI Studio returns the same response shape as Vertex Gemini endpoints.
// Reuse the Vertex processor to avoid duplicate parsing logic.
export class GoogleUsageProcessor
  extends VertexOpenAIUsageProcessor
  implements IUsageProcessor {}
