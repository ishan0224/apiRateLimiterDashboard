import "dotenv/config";

import { handler } from "../src/services/usage-log-worker.js";

const result = await handler({
  Records: [
    {
      messageId: "direct-valid-1",
      body: JSON.stringify({
        identifier: "test-api-key-id-1",
        path: "/api/direct-test",
        status: 200,
        timestamp: new Date().toISOString(),
      }),
    },
    {
      messageId: "direct-invalid-json-1",
      body: "{invalid-json",
    },
    {
      messageId: "direct-invalid-timestamp-1",
      body: JSON.stringify({
        identifier: "test-api-key-id-1",
        path: "/api/direct-test",
        status: 429,
        timestamp: "not-a-date",
      }),
    },
  ],
});

console.log(JSON.stringify(result, null, 2));
