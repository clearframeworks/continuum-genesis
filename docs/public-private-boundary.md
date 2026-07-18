# Public / Private Boundary

Continuum Genesis opens the memory standard. It does not open a private operating instance.

## Public In This Repo

| Layer | Included |
| --- | --- |
| Protocol | HTTP API for memory and shards |
| Formats | Memory item and shard shapes |
| SDK | JavaScript client for the protocol |
| Runtime | Local file-backed reference implementation |
| Demo | Text cockpit for trying the reference flow |
| Tests | Runtime checks and leak checks |

## Not Included

| Layer | Status |
| --- | --- |
| Hosted engine | Closed |
| Advanced routing and selection | Closed |
| Managed security protocols, vaults, and tenant isolation | Closed |
| Billing, metering, and customer operations | Closed |
| Private operating history | Never public |
| Customer data and receipts | Never public |
| Credentials, local paths, and internal logs | Never public |

## User Responsibility

This free repo is useful, but it is not the full protected system. Users are responsible for protecting their own data, reviewing shards before sending them to a model, and avoiding sensitive production use unless they have added their own security controls or upgraded to a managed Continuum protocol or hosted feature tier.

## Product Split

Continuum Genesis is the starter instance.

Continuum Hosted and Continuum Infrastructure are operated products: the memory standard plus managed deployment, stronger routing, business integration, and ongoing support.

## Release Rule

Anything ambiguous defaults out of the public repo until it is explicitly reviewed. Closed-to-open is possible later. Open-to-closed is not.
