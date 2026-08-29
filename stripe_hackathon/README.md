# Batti

Crowd board for Dhaka load-shedding. Twelve Areas, Crowd taps (On / Off / Unsure), Map pins, theater Forecast, canned Advice, and Ask Batti Guidance. Seed is a **Sample pattern**, not live DESCO.

## Run

```bash
pnpm install
pnpm test
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Ask Batti

The Assistant streams through the Next.js App Router route at `/api/assistant` (Vercel / Node runtime). The browser never receives `OPENROUTER_API_KEY`.

Create `stripe_hackathon/.env.local` (gitignored) with:

```bash
OPENROUTER_API_KEY=...
# optional
OPENROUTER_MODEL=z-ai/glm-5.3-flash
```

Then:

```bash
pnpm dev
```

Ordinary tests stay offline:

```bash
pnpm test
```

Optional live model checks (requires the key):

```bash
pnpm test:assistant:live
```

## Deploy

Deploy the Next.js app to Vercel so `/api/assistant` stays server-side. Configure `OPENROUTER_API_KEY` in the Vercel project environment. Do not commit the key.

Local production smoke check:

```bash
pnpm build
pnpm start
```
