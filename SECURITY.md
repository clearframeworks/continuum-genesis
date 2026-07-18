# Security

Continuum Genesis is a local reference implementation. It is designed to be easy to inspect and safe to run locally.

## Reporting

Please report security issues privately to ClearFrameworks before posting public details.

## Scope

In scope:

- Local runtime API behavior
- Shard format validation
- Demo app behavior
- Leak-check coverage

Out of scope:

- Hosted Continuum infrastructure
- Managed customer deployments
- Private operating instances
- Private automation or advanced routing systems

## Public Release Gate

Before any public push, run:

```powershell
npm test
npm run leak:check
npm run security:triple
```

The leak check is intentionally conservative. It looks for local paths, provider key patterns, known private runtime names, and customer-data markers.

The triple gate runs the normal tests, the public leak check, and a release-shape scan that rejects common private files, hardcoded protected endpoints, and service-worker caching of protected API routes.
