import {  MessageData, MessageProducer } from "./types";

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

  setLowerPriority() {
    if (!(this.secondary instanceof DualWriteProducer)) {
      this.secondary.setLowerPriority();
    }
    if (!(this.primary instanceof DualWriteProducer)) {
      this.primary.setLowerPriority();
    }
  }

  async sendMessage(msg: MessageData) {
    // Send to primary and log any errors but don't fail
    try {
      await this.primary.sendMessage(msg);
    } catch (error: any) {
      console.error(`Error sending to primary queue: ${error.message}`);
    }

    // Always return the result from the secondary
    return this.secondary.sendMessage(msg);
  }
}