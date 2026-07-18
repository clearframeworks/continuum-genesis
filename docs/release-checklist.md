# Public Release Checklist

Run this checklist before pushing to a public repository.

## Required Gates

```powershell
npm test
npm run leak:check
npm run security:triple
npm run eval:memory
```

## Manual Review

- Confirm no private instance data exists in the repo.
- Confirm no `.env`, credentials, receipts, customer files, local paths, or private runtime code are staged.
- Confirm the text cockpit describes Genesis as a local reference layer.
- Confirm protected/managed features require a user-supplied endpoint and access token.
- Confirm the service worker caches only static app files, not protected API responses.
- Confirm the repo is created intentionally and the MIT publication is approved.

## First Public Push Rule

Create the public GitHub repo only after these gates pass. The current recommended name is:

```text
clearframeworks/continuum-genesis
```
