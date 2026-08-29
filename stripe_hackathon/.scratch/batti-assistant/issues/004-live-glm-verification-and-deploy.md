# BATTI-AI-004 — Live GLM verification and deploy readiness

**Status:** Ready  
**Depends on:** BATTI-AI-003  
**Blocks:** Nothing

## Outcome

The completed Assistant is verified against the real OpenRouter `z-ai/glm-5.3-flash` model, documented for local and Vercel operation, reviewed against the approved spec, and ready for production deployment.

## Scope

- Exclude live model tests from ordinary `pnpm test`
- Add `pnpm test:assistant:live`
- Document environment setup, local `pnpm dev`, verification, and Vercel deployment
- Run deterministic, build, and optional live gates

## Acceptance

- `pnpm test` requires no key or network and remains deterministic.
- `pnpm test:assistant:live` fails clearly without `OPENROUTER_API_KEY`.
- With the key configured, live checks call `z-ai/glm-5.3-flash` through `createAssistantHandler(fetch)`.
- No test, log, source file, or documentation contains the key.
- `pnpm build` preserves the `/api/assistant` server route.
- Deploy target is Vercel with server-side env for `OPENROUTER_API_KEY`.

## Verification

```bash
pnpm test
pnpm build
pnpm test:assistant:live
```

## Secret handoff

Do not ask the user to paste the OpenRouter key into chat. Pause at the live-test gate and ask them to configure `OPENROUTER_API_KEY` in `.env.local` / Vercel, then resume verification.
