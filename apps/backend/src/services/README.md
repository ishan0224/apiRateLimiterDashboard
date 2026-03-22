# Services

This folder will contain backend service modules.

Services should:
- hold business workflows and orchestration
- coordinate controllers with data and infrastructure layers
- remain independent from Express request and response objects
- expose reusable operations for application features

Current setup:
- Lambda-oriented batch worker logic for asynchronous usage-log persistence
- service modules can consume queue batches and delegate persistence to the database layer without touching the Redis hot path
