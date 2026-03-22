import { prisma } from "../database/prisma.js";

type SQSMessageRecord = {
  messageId: string;
  body: string;
};

export type SQSEvent = {
  Records: SQSMessageRecord[];
};

export type SQSBatchResponse = {
  batchItemFailures: Array<{
    itemIdentifier: string;
  }>;
};

type UsageLogMessage = {
  identifier: string;
  path: string;
  status: number;
  timestamp: string | number | Date;
};

type UsageLogInsert = {
  apiKeyId: string;
  path: string;
  status: number;
  timestamp: Date;
};

type BlockedRequestInsert = {
  apiKeyId: string;
  path: string;
  reason: string;
  timestamp: Date;
};

const BLOCKED_REQUEST_REASON = "rate_limit_exceeded";

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

function parseUsageLogMessage(body: string): UsageLogMessage {
  const parsed = JSON.parse(body) as Partial<UsageLogMessage>;

  if (typeof parsed.identifier !== "string" || parsed.identifier.trim().length === 0) {
    throw new Error("Invalid identifier");
  }

  if (typeof parsed.path !== "string" || parsed.path.trim().length === 0) {
    throw new Error("Invalid path");
  }

  if (typeof parsed.status !== "number" || !Number.isInteger(parsed.status)) {
    throw new Error("Invalid status");
  }

  if (
    typeof parsed.timestamp !== "string" &&
    typeof parsed.timestamp !== "number" &&
    !(parsed.timestamp instanceof Date)
  ) {
    throw new Error("Invalid timestamp");
  }

  return {
    identifier: parsed.identifier,
    path: parsed.path,
    status: parsed.status,
    timestamp: parsed.timestamp,
  };
}

function toUsageLogInsert(message: UsageLogMessage): UsageLogInsert {
  const timestamp = new Date(message.timestamp);

  if (!isValidDate(timestamp)) {
    throw new Error("Invalid timestamp value");
  }

  return {
    apiKeyId: message.identifier,
    path: message.path,
    status: message.status,
    timestamp,
  };
}

export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const validInserts: UsageLogInsert[] = [];
  const blockedRequestInserts: BlockedRequestInsert[] = [];
  const validMessageIds: string[] = [];
  const batchItemFailures: SQSBatchResponse["batchItemFailures"] = [];

  for (const record of event.Records) {
    try {
      const parsedMessage = parseUsageLogMessage(record.body);
      const usageLogInsert = toUsageLogInsert(parsedMessage);

      validInserts.push(usageLogInsert);
      if (usageLogInsert.status === 429) {
        blockedRequestInserts.push({
          apiKeyId: usageLogInsert.apiKeyId,
          path: usageLogInsert.path,
          reason: BLOCKED_REQUEST_REASON,
          timestamp: usageLogInsert.timestamp,
        });
      }
      validMessageIds.push(record.messageId);
    } catch (error) {
      console.error("Failed to parse SQS usage log message", {
        messageId: record.messageId,
        error,
      });

      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  if (validInserts.length === 0) {
    return { batchItemFailures };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.usageLog.createMany({
        data: validInserts,
      });

      if (blockedRequestInserts.length > 0) {
        await tx.blockedRequest.createMany({
          data: blockedRequestInserts,
        });
      }
    });

    return { batchItemFailures };
  } catch (error) {
    console.error("Failed to persist SQS usage log batch", {
      validMessageCount: validInserts.length,
      blockedRequestCount: blockedRequestInserts.length,
      error,
    });

    return {
      batchItemFailures: [
        ...batchItemFailures,
        ...validMessageIds.map((messageId) => ({ itemIdentifier: messageId })),
      ],
    };
  }
}
