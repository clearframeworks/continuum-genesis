# Public / Private Boundary

Continuum Genesis publishes the memory layer as a clean reference implementation. The line is intentional: developers can inspect and extend the standard without inheriting private operating infrastructure.

## Included In This Repo

| Layer | Included |
| --- | --- |
| Protocol | HTTP API for memory and shards |
| Formats | Memory item and shard shapes |
| SDK | JavaScript client for the protocol |
| Runtime | Local file-backed reference implementation |
| Interface | Installable text cockpit for trying the reference flow |
| Tests | Runtime checks and leak checks |

## Managed Continuum Layer

| Capability | Path |
| --- | --- |
| Hosted runtime | Managed deployment |
| Advanced routing and selection | Managed protocol |
| Security review, vaults, and tenant isolation | Managed protocol |
| Billing, metering, and customer operations | Managed service |
| Private operating history | Private instance only |
| Customer data and receipts | Private instance only |
| Credentials, local paths, and internal logs | Private instance only |

## User Responsibility

Genesis gives you the public memory pattern. Production use still requires data classification, access control, secret handling, backup policy, audit review, and model-output review.

## Product Split

Continuum Genesis is the reference implementation.

Continuum Hosted and Continuum Infrastructure are operated products: the memory standard plus managed deployment, stronger routing, business integration, and ongoing support.

## Release Rule

Anything ambiguous defaults out of the public repo until it is explicitly reviewed. Closed-to-open is possible later. Open-to-closed is not.
