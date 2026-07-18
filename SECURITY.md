# Security

Continuum Genesis is a local reference implementation. The security posture is deliberately small, inspectable, and conservative.

## Reporting

Please report security issues privately to ClearFrameworks before posting public details.

## Scope

In scope:

- Local runtime API behavior
- Shard format validation
- Demo app behavior
- Leak-check coverage

Managed separately:

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

The leak check is intentionally conservative. It looks for local paths, provider key patterns, private runtime markers, and customer-data markers.

The triple gate runs the normal tests, the public leak check, and a release-shape scan that rejects common private files, hardcoded protected endpoints, and service-worker caching of protected API routes.
