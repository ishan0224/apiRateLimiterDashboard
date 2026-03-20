# Controllers

This folder will contain request handlers for backend features.

Each controller should:
- receive validated request input from routes or middleware
- delegate business rules to services
- shape HTTP responses and status codes
- avoid direct infrastructure logic where possible
