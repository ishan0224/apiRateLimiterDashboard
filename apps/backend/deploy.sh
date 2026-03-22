#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$ROOT_DIR/../.." && pwd)"
BUILD_DIR="$ROOT_DIR/.lambda-build"
ZIP_PATH="$ROOT_DIR/usage-log-worker.zip"
PRISMA_CLIENT_VERSION="$(node -p "require('$ROOT_DIR/package.json').dependencies['@prisma/client']")"

rm -rf "$BUILD_DIR" "$ZIP_PATH"
mkdir -p "$BUILD_DIR/prisma" "$BUILD_DIR/node_modules"

cp "$ROOT_DIR/prisma/schema.prisma" "$BUILD_DIR/prisma/schema.prisma"

cat > "$BUILD_DIR/package.json" <<EOF
{
  "name": "@api-rate-limiter-dashboard/backend-lambda",
  "private": true,
  "type": "commonjs",
  "dependencies": {
    "@prisma/client": "$PRISMA_CLIENT_VERSION"
  }
}
EOF

pushd "$BUILD_DIR" >/dev/null
npm install --omit=dev
npm prune --omit=dev
popd >/dev/null

pushd "$ROOT_DIR" >/dev/null
npx prisma generate --schema "$BUILD_DIR/prisma/schema.prisma"
npx esbuild src/workers/logWorker.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=cjs \
  --outfile="$BUILD_DIR/index.js" \
  --external:aws-sdk \
  --external:@prisma/client
popd >/dev/null

rm -rf "$BUILD_DIR/node_modules/.prisma/client" "$BUILD_DIR/node_modules/@prisma/client"
mkdir -p "$BUILD_DIR/node_modules/.prisma" "$BUILD_DIR/node_modules/@prisma"
cp -R "$MONOREPO_ROOT/node_modules/.prisma/client" "$BUILD_DIR/node_modules/.prisma/client"
cp -R "$MONOREPO_ROOT/node_modules/@prisma/client" "$BUILD_DIR/node_modules/@prisma/client"

rm -rf "$BUILD_DIR/node_modules/@prisma/engines"
rm -rf "$BUILD_DIR/node_modules/.cache"
rm -f "$BUILD_DIR/node_modules/.package-lock.json"

find "$BUILD_DIR/node_modules/.prisma/client" -type f \
  \( -name "libquery_engine-*" -o -name "query_engine-*" -o -name "schema-engine-*" \) \
  ! -name "*linux-arm64-openssl-3.0.x*" \
  -delete

find "$BUILD_DIR/node_modules" -type d \
  \( -name "typescript" -o -name "@types" \) \
  -prune -exec rm -rf {} +

find "$BUILD_DIR/node_modules" -type f \
  \( -name "*.md" -o -name "*.map" -o -name "*.ts" \) \
  -delete

pushd "$BUILD_DIR" >/dev/null
zip -r "$ZIP_PATH" index.js node_modules prisma
popd >/dev/null

echo "Created deployment package at: $ZIP_PATH"
du -h "$ZIP_PATH"
