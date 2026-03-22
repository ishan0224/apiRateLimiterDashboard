import "dotenv/config";

import { readFile } from "node:fs/promises";

import { handler, type SQSEvent } from "../src/services/usage-log-worker.js";

const eventFilePath = process.argv[2];

if (!eventFilePath) {
  throw new Error("Usage: tsx scripts/test-usage-log-worker-event.ts <event-file>");
}

const eventFileContents = await readFile(eventFilePath, "utf8");
const event = JSON.parse(eventFileContents) as SQSEvent;
const result = await handler(event);

console.log(JSON.stringify(result, null, 2));
