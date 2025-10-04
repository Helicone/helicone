import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';

export class SqsClient {
	private sqs: SQSClient;
	private queueUrl: string;
	private queueUrlLowPriority: string;
	private sqsLowPriority: SQSClient;

	constructor(env: Env) {
		if (
			!env.AWS_REGION ||
			!env.AWS_ACCESS_KEY_ID ||
			!env.AWS_SECRET_ACCESS_KEY ||
			!env.REQUEST_LOGS_QUEUE_URL ||
			!env.REQUEST_LOGS_QUEUE_URL_LOW_PRIORITY
		) {
			throw new Error(
				'Required AWS SQS environment variables are not set, SQSProducer will not be initialized.',
			);
		}

		this.sqs = new SQSClient({
			region: env.AWS_REGION,
			credentials: {
				accessKeyId: env.AWS_ACCESS_KEY_ID,
				secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			},
		});

		this.sqsLowPriority = new SQSClient({
			region: env.AWS_REGION,
			credentials: {
				accessKeyId: env.AWS_ACCESS_KEY_ID,
				secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			},
		});

		this.queueUrl = env.REQUEST_LOGS_QUEUE_URL;
		this.queueUrlLowPriority = env.REQUEST_LOGS_QUEUE_URL_LOW_PRIORITY;
	}

	async getQueueSize(): Promise<number | null> {
		const command = new GetQueueAttributesCommand({
			QueueUrl: this.queueUrl,
			AttributeNames: ['ApproximateNumberOfMessages'],
		});
		const response = await this.sqs.send(command);
		return response.Attributes?.ApproximateNumberOfMessages
			? Number(response.Attributes.ApproximateNumberOfMessages)
			: null;
	}

	async getQueueSizeLowPriority(): Promise<number | null> {
		const command = new GetQueueAttributesCommand({
			QueueUrl: this.queueUrlLowPriority,
			AttributeNames: ['ApproximateNumberOfMessages'],
		});
		const response = await this.sqsLowPriority.send(command);
		return response.Attributes?.ApproximateNumberOfMessages
			? Number(response.Attributes.ApproximateNumberOfMessages)
			: null;
	}
}
