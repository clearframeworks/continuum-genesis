# Getting Started

## Requirements

- Node.js 20 or newer
- No database
- No API key
- No cloud account

## Before You Store Sensitive Data

Continuum Genesis is the free reference layer. It does not include managed security protocols, hosted isolation, team permissions, production monitoring, or business implementation support. Use safe demo data while testing. Upgrade to the managed Continuum protocols and hosted features before using memory with sensitive customer or business records.

## Install

```powershell
npm install
```

## Seed Safe Demo Data

```powershell
npm run seed
```

## Run The Runtime

```powershell
npm start
```

Then open:

```text
http://127.0.0.1:8787/
```

## Add Memory With curl

```powershell
curl.exe -X POST http://127.0.0.1:8787/v0/memory ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"note\",\"title\":\"Example\",\"body\":\"Remember the customer prefers text updates.\",\"tags\":[\"demo\"]}"
```

## Create A Shard

```powershell
curl.exe -X POST http://127.0.0.1:8787/v0/shards ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"customer update\",\"max_items\":5}"
```

## Reset Local Data

Delete the `.continuum-genesis/` folder in this repo.
