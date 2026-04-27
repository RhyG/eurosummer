# EatList

A personal PWA for saving and viewing places to eat & drink on a map. Built for an Italy + Greece trip.

## Stack

- **Client:** Vite + React + TypeScript, Tailwind, MapLibre GL, vite-plugin-pwa
- **Server:** Hono on Node 20, single JSON file on disk for storage
- **Search:** Google Places API (New) — server-proxied
- **Map tiles:** MapTiler (free tier)
- **Auth:** Single shared password gate → bearer token
- **Deploy:** Single Dockerfile to Fly.io

## Local development

```bash
cp .env.example .env       # then fill in the secrets
npm install
npm run dev                # starts server :8080 + client :5173
```

The Vite dev server proxies `/api` → `http://localhost:8080`.

## Required environment variables

| Var | Where | What |
|---|---|---|
| `AUTH_PASSWORD` | server | password for the gate |
| `AUTH_TOKEN` | server | random string returned to the browser after auth |
| `GOOGLE_PLACES_API_KEY` | server | Google Cloud API key (Places API New) |
| `VITE_MAPTILER_KEY` | client build-time | MapTiler key for vector tiles |
| `DATA_DIR` | server | defaults to `./data` locally, `/data` on Fly |

Generate a random `AUTH_TOKEN`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Setup: MapTiler (map tiles)

1. Sign up at [https://www.maptiler.com/cloud/](https://www.maptiler.com/cloud/) (free, no card).
2. After verifying email, go to **Account → API keys**.
3. Click the default key (or create one). Copy the value.
4. (Optional, recommended for production) Restrict the key under **Allowed origins** to your Fly URL, e.g. `https://eatlist.fly.dev`.
5. Set it locally in `.env` as `VITE_MAPTILER_KEY=...`. For Fly, pass it as a Docker build arg (see deploy section).

Free tier: 100k tile requests / month. More than enough for a 2-week trip.

---

## Setup: Google Cloud (Places API New)

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/) and sign in.
2. **Create a project**: top bar → project picker → **New project** → name it `eatlist` → Create.
3. **Enable billing** (required for Places API; free credit covers your usage):
   - Left nav → **Billing** → link a billing account (add a card if you don't already have one).
4. **Enable the Places API (New)**:
   - Left nav → **APIs & Services → Library**
   - Search for **"Places API (New)"** (the one with `(New)` in the name — not the legacy "Places API").
   - Click it → **Enable**.
5. **Create an API key**:
   - Left nav → **APIs & Services → Credentials**
   - **+ Create Credentials → API key** → copy the value.
6. **Restrict the key** (recommended):
   - Click the new key → **API restrictions → Restrict key → "Places API (New)"** → Save.
   - Application restrictions: leave as **None** for now (we proxy server-side, so the key never leaves Fly). If you want extra safety, add an IP restriction once your Fly app has a static outbound IP.
7. Set as `GOOGLE_PLACES_API_KEY` in `.env` (local) and as a Fly secret (deploy).

Cost: Autocomplete sessions ~$0.017 each, Place Details (Basic) ~$0.017. Google credits $200/mo of free usage on the Places API. A trip's worth of searches is pennies.

---

## Deploying to Fly.io

One-time setup:

```bash
brew install flyctl                # or curl -L https://fly.io/install.sh | sh
fly auth login
fly launch --no-deploy             # answers: keep app name eatlist (or pick one), region cdg, no postgres, no redis
fly volumes create eatlist_data --region cdg --size 1
```

If `fly launch` overwrote `fly.toml`, restore the `[[mounts]]` block from this repo (volume → `/data`).

Set secrets:

```bash
fly secrets set \
  AUTH_PASSWORD='your-password' \
  AUTH_TOKEN="$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')" \
  GOOGLE_PLACES_API_KEY='AIza...'
```

The MapTiler key is baked into the client bundle at build time, so pass it as a Docker build arg:

```bash
fly deploy --build-arg VITE_MAPTILER_KEY=YOUR_MAPTILER_KEY
```

After deploy, open `https://<your-app>.fly.dev`, enter the password, and start saving places.

## Backup

Settings menu (gear icon, top-right) → **Export JSON** downloads the current `places.json`.

## Project layout

```
client/   Vite + React PWA
server/   Hono API + static file server
fly.toml  Fly app config (256MB, /data volume)
Dockerfile
```
