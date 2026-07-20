# Security

Continuum Genesis is a local reference implementation. The security posture is deliberately small, inspectable, and conservative.

## Reporting

Please report security issues privately before posting public details:

- Email: security@clearframeworks.org
- Subject prefix: `[continuum-genesis security]`

Do not include exploit payloads, private memory data, or step-by-step vulnerability
details in public GitHub issues. If email delivery fails, open a public issue that asks
for a security contact without publishing technical details.

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

The normal test suite includes runtime security checks for local-origin API access,
controlled validation errors, concurrent HTTP writes, instance-root isolation, and SDK
credential endpoint safety. The release gate is not a substitute for a manual threat
model review before exposing this reference runtime beyond loopback.
