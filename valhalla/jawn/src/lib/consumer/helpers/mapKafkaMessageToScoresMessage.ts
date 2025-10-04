import { KafkaMessage } from "kafkajs";
import { GenericResult, err, ok } from "../../../packages/common/result";
import { HeliconeScoresMessage } from "../../handlers/HandlerContext";

export function mapKafkaMessageToScoresMessage(
  kafkaMessage: KafkaMessage[],
): GenericResult<HeliconeScoresMessage[]> {
  const messages: HeliconeScoresMessage[] = [];
  for (const message of kafkaMessage) {
    if (message.value) {
      try {
        const kafkaValue = JSON.parse(message.value.toString());
        const parsedMsg = JSON.parse(kafkaValue.value) as HeliconeScoresMessage;
        messages.push(parsedMsg);
      } catch (error) {
        return err(`Failed to parse message: ${error}`);
      }
    } else {
      return err("Message value is empty");
    }
  }

  return ok(messages);
}
