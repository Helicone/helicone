import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { err, ok } from "../../util/results";
export class SQSProducerImpl {
    sqs;
    queueUrl;
    lowerPriorityQueueUrl;
    constructor(env) {
        if (!env.AWS_REGION ||
            !env.AWS_ACCESS_KEY_ID ||
            !env.AWS_SECRET_ACCESS_KEY ||
            !env.REQUEST_LOGS_QUEUE_URL ||
            !env.REQUEST_LOGS_QUEUE_URL_LOW_PRIORITY) {
            throw new Error("Required AWS SQS environment variables are not set, SQSProducer will not be initialized.");
        }
        this.sqs = new SQSClient({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
        });
        this.queueUrl = env.REQUEST_LOGS_QUEUE_URL;
        this.lowerPriorityQueueUrl = env.REQUEST_LOGS_QUEUE_URL_LOW_PRIORITY;
    }
    setLowerPriority() {
        this.queueUrl = this.lowerPriorityQueueUrl;
    }
    async sendMessage(msg) {
        let attempts = 0;
        const maxAttempts = 3;
        const timeout = 1000;
        while (attempts < maxAttempts) {
            try {
                const command = new SendMessageCommand({
                    QueueUrl: this.queueUrl,
                    MessageBody: JSON.stringify(msg),
                });
                await this.sqs.send(command);
                return ok(null);
            }
            catch (error) {
                console.error(`SQS attempt ${attempts + 1} failed: ${error.message}`);
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise((resolve) => setTimeout(resolve, timeout));
                }
                else {
                    console.error(`Failed to send message to SQS: ${error.message}`);
                    return err(`Failed to send message to SQS: ${error.message}`);
                }
            }
        }
        return err(`Failed to send message to SQS`);
    }
}
