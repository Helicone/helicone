import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { PromiseGenericResult, Result } from "../../packages/common/result";
import { Provider } from "../../packages/llm-mapper/types";
import {
  KafkaMessageContents,
  HeliconeScoresMessage,
} from "../handlers/HandlerContext";

export interface MessageProducer {
  sendMessages({ msgs, topic }: QueuePayload): PromiseGenericResult<string>;
}
export type ScoreTopics = "helicone-scores-prod" | "helicone-scores-prod-dlq";
export type RequestResponseTopics =
  | "request-response-logs-prod-dlq"
  | "request-response-logs-prod";
export type QueueTopics = RequestResponseTopics | ScoreTopics;

export type QueuePayload =
  | {
      msgs: KafkaMessageContents[];
      topic: RequestResponseTopics;
    }
  | {
      msgs: HeliconeScoresMessage[];
      topic: ScoreTopics;
    };
