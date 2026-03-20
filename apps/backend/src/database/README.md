# Database

This folder will contain database integration and persistence scaffolding.

Future contents may include:
- database client setup
- ORM or query-builder configuration
- repository modules
- migrations or persistence-related helpers

Current setup:
- Prisma ORM schema and client initialization for PostgreSQL
- database-only connection utilities kept outside the Redis-backed rate-limit hot path
