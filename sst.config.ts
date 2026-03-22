/// <reference types="node" />
/// <reference path="./.sst/platform/config.d.ts" />

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export default $config({
  app(input) {
    return {
      name: "api-rate-limiter-dashboard",
      home: "aws",
      providers: {
        aws: {
          region: "ap-south-1",
        },
      },
      removal: input?.stage === "production" ? "retain" : "remove",
    };
  },
  async run() {
    const { execSync } = await import("node:child_process");
    const fs = await import("node:fs");
    const path = await import("node:path");

    const rootDir = process.cwd();
    const backendDir = path.join(rootDir, "apps", "backend");
    const backendNodeModulesDir = path.join(backendDir, "node_modules");
    const backendEnvPath = path.join(rootDir, "apps", "backend", ".env");

    function loadBackendEnvFile() {
      if (!fs.existsSync(backendEnvPath)) {
        return;
      }

      const envFile = fs.readFileSync(backendEnvPath, "utf8");

      for (const rawLine of envFile.split(/\r?\n/)) {
        const line = rawLine.trim();

        if (!line || line.startsWith("#")) {
          continue;
        }

        const separatorIndex = line.indexOf("=");

        if (separatorIndex === -1) {
          continue;
        }

        const key = line.slice(0, separatorIndex).trim();
        let value = line.slice(separatorIndex + 1).trim();

        if (
          (value.startsWith("\"") && value.endsWith("\"")) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    function removeUnusedPrismaEngines(functionDir: string) {
      const prismaClientDir = path.join(functionDir, "node_modules", ".prisma", "client");

      for (const fileName of fs.readdirSync(prismaClientDir)) {
        const isEngineFile =
          fileName.includes("libquery_engine") ||
          fileName.includes("query_engine") ||
          fileName.includes("schema-engine");

        if (isEngineFile && !fileName.includes("linux-arm64-openssl-3.0.x")) {
          fs.rmSync(path.join(prismaClientDir, fileName), { force: true });
        }
      }
    }

    function copyGeneratedPrismaClient(functionDir: string) {
      const functionNodeModulesDir = path.join(functionDir, "node_modules");
      const sourceGeneratedClientDir = path.join(backendNodeModulesDir, ".prisma", "client");
      const sourcePrismaClientDir = path.join(backendNodeModulesDir, "@prisma", "client");

      fs.rmSync(path.join(functionNodeModulesDir, ".prisma", "client"), {
        force: true,
        recursive: true,
      });
      fs.rmSync(path.join(functionNodeModulesDir, "@prisma", "client"), {
        force: true,
        recursive: true,
      });

      fs.mkdirSync(path.join(functionNodeModulesDir, ".prisma"), { recursive: true });
      fs.mkdirSync(path.join(functionNodeModulesDir, "@prisma"), { recursive: true });

      fs.cpSync(
        sourceGeneratedClientDir,
        path.join(functionNodeModulesDir, ".prisma", "client"),
        { recursive: true }
      );
      fs.cpSync(sourcePrismaClientDir, path.join(functionNodeModulesDir, "@prisma", "client"), {
        recursive: true,
      });

      fs.rmSync(path.join(functionNodeModulesDir, "@prisma", "engines"), {
        force: true,
        recursive: true,
      });
      fs.rmSync(path.join(functionNodeModulesDir, ".cache"), {
        force: true,
        recursive: true,
      });
      fs.rmSync(path.join(functionNodeModulesDir, ".package-lock.json"), { force: true });

      removeUnusedPrismaEngines(functionDir);
    }

    loadBackendEnvFile();

    const usageLogDeadLetterQueue = new sst.aws.Queue("UsageLogDeadLetterQueue");

    const usageLogQueue = new sst.aws.Queue("UsageLogQueue", {
      visibilityTimeout: "180 seconds",
      dlq: {
        queue: usageLogDeadLetterQueue.arn,
        retry: 3,
      },
    });

    const subscriber = usageLogQueue.subscribe(
      {
        handler: "apps/backend/src/workers/logWorker.handler",
        runtime: "nodejs20.x",
        architecture: "arm64",
        memory: "512 MB",
        timeout: "30 seconds",
        logging: {
          retention: "1 week",
        },
        environment: {
          DATABASE_URL: requiredEnv("DATABASE_URL"),
          DIRECT_URL: requiredEnv("DIRECT_URL"),
          NODE_ENV: "production",
        },
        copyFiles: [
          {
            from: "apps/backend/prisma/schema.prisma",
            to: "prisma/schema.prisma",
          },
        ],
        nodejs: {
          install: ["@prisma/client"],
        },
        hook: {
          async postbuild(functionDir) {
            execSync("npm run prisma:generate --workspace @api-rate-limiter-dashboard/backend", {
              cwd: rootDir,
              stdio: "inherit",
            });

            copyGeneratedPrismaClient(functionDir);
          },
        },
      },
      {
        batch: {
          partialResponses: true,
          size: 10,
          window: "2 seconds",
        },
      }
    );

    return {
      usageLogDeadLetterQueueArn: usageLogDeadLetterQueue.arn,
      usageLogQueueArn: usageLogQueue.arn,
      usageLogQueueUrl: usageLogQueue.url,
      usageLogWorkerArn: subscriber.nodes.function.arn,
      usageLogWorkerName: subscriber.nodes.function.name,
    };
  },
});
