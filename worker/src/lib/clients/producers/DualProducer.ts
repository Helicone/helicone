import { LOW_PRIORITY_QUEUE_URL, MessageData, MessageProducer } from "./types";

export class DualWriteProducer implements MessageProducer {
  private primary: MessageProducer;
  private secondary: MessageProducer;

  constructor(
    primaryProducer: MessageProducer,
    secondaryProducer: MessageProducer
  ) {
    this.primary = primaryProducer;
    this.secondary = secondaryProducer;
  }

  setLowerPriorityQueueUrl(queueUrl: string) {
    this.secondary.setLowerPriorityQueueUrl(LOW_PRIORITY_QUEUE_URL);
  }

  async sendMessage(msg: MessageData) {
    // Send to primary and log any errors but don't fail
    try {
      console.log("Sending to primary queue");
      await this.primary.sendMessage(msg);
    } catch (error: any) {
      console.error(`Error sending to primary queue: ${error.message}`);
    }

    // Always return the result from the secondary
    console.log("Sending to secondary queue");
    return this.secondary.sendMessage(msg);
  }
}
