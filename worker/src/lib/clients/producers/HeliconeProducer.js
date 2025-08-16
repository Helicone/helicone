import { DualWriteProducer } from "./DualProducer";
import { KafkaProducerImpl } from "./KafkaProducerImpl";
import { SQSProducerImpl } from "./SQSProducer";
export class MessageProducerFactory {
    static createProducer(env) {
        if (env.QUEUE_PROVIDER === "sqs") {
            return new SQSProducerImpl(env);
        }
        else if (env.QUEUE_PROVIDER === "dual") {
            const kafkaProducer = new KafkaProducerImpl(env);
            const sqsProducer = new SQSProducerImpl(env);
            return new DualWriteProducer(kafkaProducer, sqsProducer);
        }
        else {
            if (!env.UPSTASH_KAFKA_URL ||
                !env.UPSTASH_KAFKA_USERNAME ||
                !env.UPSTASH_KAFKA_PASSWORD) {
                return null;
            }
            else {
                return new KafkaProducerImpl(env);
            }
        }
    }
}
export class HeliconeProducer {
    VALHALLA_URL = undefined;
    HELICONE_MANUAL_ACCESS_KEY = undefined;
    producer = null;
    constructor(env) {
        this.VALHALLA_URL = env.VALHALLA_URL;
        this.HELICONE_MANUAL_ACCESS_KEY = env.HELICONE_MANUAL_ACCESS_KEY;
        this.producer = MessageProducerFactory.createProducer(env);
    }
    setLowerPriority() {
        if (this.producer) {
            this.producer.setLowerPriority();
        }
    }
    async sendMessage(msg) {
        if (!this.producer ||
            msg.heliconeMeta.heliconeManualAccessKey ===
                this.HELICONE_MANUAL_ACCESS_KEY) {
            await this.sendMessageHttp(msg);
            return;
        }
        return this.producer.sendMessage(msg);
    }
    async sendMessageHttp(msg) {
        try {
            const result = await fetch(`${this.VALHALLA_URL}/v1/log/request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${msg.authorization}`,
                },
                body: JSON.stringify({
                    log: msg.log,
                    authorization: msg.authorization,
                    heliconeMeta: msg.heliconeMeta,
                }),
            });
            if (result.status !== 200) {
                console.error(`Failed to send message via REST: ${result.statusText}`);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            console.error(`Failed to send message via REST: ${error.message}`);
        }
    }
}
