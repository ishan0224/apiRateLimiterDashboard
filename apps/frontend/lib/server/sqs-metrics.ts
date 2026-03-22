import { GetQueueAttributesCommand, SQSClient } from "@aws-sdk/client-sqs";

type GlobalSqsCache = typeof globalThis & {
  __dashboardSqsClient?: SQSClient;
};

const globalSqsCache = globalThis as GlobalSqsCache;

function getSqsQueueUrl(): string | null {
  return process.env.SQS_QUEUE_URL ?? null;
}

function getSqsClient(): SQSClient | null {
  const region = process.env.AWS_REGION;

  if (!region) {
    return null;
  }

  if (!globalSqsCache.__dashboardSqsClient) {
    globalSqsCache.__dashboardSqsClient = new SQSClient({ region });
  }

  return globalSqsCache.__dashboardSqsClient;
}

export async function fetchQueueLagSeconds(): Promise<number | null> {
  const queueUrl = getSqsQueueUrl();
  const client = getSqsClient();

  if (!queueUrl || !client) {
    return null;
  }

  try {
    const response = await client.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ["All"],
      })
    );

    const attributes = response.Attributes as Record<string, string> | undefined;
    const oldestMessageAge = Number(attributes?.ApproximateAgeOfOldestMessage ?? 0);
    const visibleMessages = Number(attributes?.ApproximateNumberOfMessages ?? 0);
    const inFlightMessages = Number(attributes?.ApproximateNumberOfMessagesNotVisible ?? 0);

    if (!Number.isFinite(oldestMessageAge) || oldestMessageAge < 0) {
      return 0;
    }

    if (visibleMessages + inFlightMessages === 0) {
      return 0;
    }

    return Math.floor(oldestMessageAge);
  } catch (error) {
    console.error("Failed to fetch SQS queue attributes for lag metric", error);
    return null;
  }
}
