import { QueuePayload } from "./types";
import { MessageProducer } from "./types";

export class DualWriteProducer implements MessageProducer {
  private primary: MessageProducer;
  private secondary: MessageProducer;

  constructor(
    primaryProducer: MessageProducer,
    secondaryProducer: MessageProducer,
  ) {
    this.primary = primaryProducer;
    this.secondary = secondaryProducer;
  }

  async sendMessages(queuePayload: QueuePayload) {
    // Send to primary and log any errors but don't fail
    try {
      console.log("Sending to primary queue");
      await this.primary.sendMessages(queuePayload);
    } catch (error: any) {
      console.error(`Error sending to primary queue: ${error.message}`);
    }
    // Always return the result from the secondary
    console.log("Sending to secondary queue");
    return this.secondary.sendMessages(queuePayload);
  }
}
