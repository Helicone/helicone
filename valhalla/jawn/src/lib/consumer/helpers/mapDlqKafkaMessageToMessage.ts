import { KafkaMessage } from "kafkajs";
import { GenericResult, err, ok } from "../../../packages/common/result";
import { mapMessageDates } from "./mapKafkaMessageToMessage";
import { KafkaMessageContents } from "../../handlers/HandlerContext";

export function mapDlqKafkaMessageToMessage(
  kafkaMessage: KafkaMessage[],
): GenericResult<KafkaMessageContents[]> {
  const messages: KafkaMessageContents[] = [];
  for (const message of kafkaMessage) {
    if (message.value) {
      try {
        const kafkaValue = JSON.parse(message.value.toString());
        const parsedMsg = JSON.parse(kafkaValue.value) as KafkaMessageContents;
        messages.push(mapMessageDates(parsedMsg));
      } catch (error) {
        return err(`Failed to parse message: ${error}`);
      }
    } else {
      return err("Message value is empty");
    }
  }

  return ok(messages);
}
