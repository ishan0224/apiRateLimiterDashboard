import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

export type UsageLogMessagePayload = {
  identifier: string;
  path: string;
  status: 200 | 429;
  timestamp: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

let sqsClient: SQSClient | null = null;
let queueUrl: string | null = null;
function getSqsClient(): SQSClient {
  if (!sqsClient) {
    sqsClient = new SQSClient({
      region: getRequiredEnv("AWS_REGION"),
      credentials: {
        accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }

  return sqsClient;
}

function getQueueUrl(): string {
  if (!queueUrl) {
    queueUrl = getRequiredEnv("SQS_QUEUE_URL");
  }

  return queueUrl;
}

export async function sendLogMessage(payload: UsageLogMessagePayload): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info("SQS usage log payload", payload);
  }

  await getSqsClient().send(
    new SendMessageCommand({
      QueueUrl: getQueueUrl(),
      MessageBody: JSON.stringify(payload),
    })
  );
}
