# Getting Started

## Requirements

- Node.js 20 or newer
- No database
- No API key
- No cloud account

## Operating Note

Continuum Genesis is designed for local prototypes, research, and public inspection. Keep sensitive records out of the reference runtime unless you have added your own access control, backup, monitoring, and review process.

## Install

```powershell
npm install
```

## Seed Example Data

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

The text cockpit can be installed as a PWA from the browser install button or the browser address bar.

## Add Memory With curl

```powershell
curl.exe -X POST http://127.0.0.1:8787/v0/memory ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"note\",\"title\":\"Follow-up preference\",\"body\":\"The customer prefers text updates after 4 PM.\",\"tags\":[\"customer\",\"follow-up\"]}"
```

## Create A Shard

```powershell
curl.exe -X POST http://127.0.0.1:8787/v0/shards ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"customer update\",\"max_items\":5}"
```

## Reset Local Data

Delete the `.continuum-genesis/` folder in this repo.
