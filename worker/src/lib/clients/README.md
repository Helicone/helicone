# Clients Directory

This directory hosts clients for various external services the worker interacts with:

## Includes

- S3 Client: Handles interactions with Amazon S3 for object storage.
- External Caching Client: Manages connectivity with external caching solutions.
- Message Queues Client: Interfaces with message queue services for asynchronous processing.

### Excludes

- Direct database interactions.
- Internal memory cache handling.
