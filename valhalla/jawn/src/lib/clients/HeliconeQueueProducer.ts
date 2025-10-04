import { LogManager } from "../../managers/LogManager";
import { PromiseGenericResult, ok } from "../../packages/common/result";
import {
  HeliconeScoresMessage,
  KafkaMessageContents,
} from "../handlers/HandlerContext";
import { DualWriteProducer } from "../producers/DualProducer";
import { KafkaProducer } from "../producers/KafkaProducerImpl";
import { SQSProducer } from "../producers/SQSProducer";
import {
  MessageProducer,
  RequestResponseTopics,
  ScoreTopics,
} from "../producers/types";

class MessageProducerFactory {
  static createProducer(): MessageProducer | null {
    const queueProvider = process.env.QUEUE_PROVIDER;
    if (queueProvider === "dual") {
      return new DualWriteProducer(new KafkaProducer(), new SQSProducer());
    } else if (queueProvider === "sqs") {
      return new SQSProducer();
    } else if (queueProvider === "kafka") {
      return new KafkaProducer();
    }

    return null;
  }
}

export class HeliconeQueueProducer {
  private producer: MessageProducer | null = null;

  constructor() {
    this.producer = MessageProducerFactory.createProducer();
  }

  async sendMessageHttp(msg: KafkaMessageContents) {
    try {
      const logManager = new LogManager();

      await logManager.processLogEntry({
        log: msg.log,
        authorization: msg.authorization,
        heliconeMeta: msg.heliconeMeta,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`Failed to send message via REST: ${error.message}`);
    }
  }

  async sendMessages(
    msgs: KafkaMessageContents[],
    topic: RequestResponseTopics,
  ): PromiseGenericResult<string> {
    if (!this.producer) {
      for (const msg of msgs) {
        await this.sendMessageHttp(msg);
      }
      return ok("Kafka is not initialized");
    }

    return this.producer.sendMessages({
      msgs,
      topic,
    });
  }

  async sendScoresMessage(
    scoresMessages: HeliconeScoresMessage[],
    topic: ScoreTopics,
  ): PromiseGenericResult<string> {
    if (!this.producer) {
      return ok("Kafka is not initialized");
    }

    return this.producer.sendMessages({
      msgs: scoresMessages,
      topic,
    });
  }

  public isQueueEnabled = (): boolean => this.producer !== null;
}
