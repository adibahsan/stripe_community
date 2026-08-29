# BATTI-AI-001 — Grounded streaming questions

**Status:** Done  
**Depends on:** Nothing  
**Blocks:** BATTI-AI-002, BATTI-AI-003, BATTI-AI-004

## Outcome

A Crowd member can open a floating Ask Batti bottom sheet, submit a Bangla, English, or Banglish power question, and receive streamed Guidance grounded in normalized Area evidence.

This is the first end-to-end tracer bullet: browser → `/api/assistant` (Vercel Node runtime) → `z-ai/glm-5.3-flash` through OpenRouter → Batti SSE stream → browser.

## Read first

- `CONTEXT.md`
- `docs/superpowers/specs/2026-08-29-batti-assistant-design.md`
- Tasks 1–4 in `docs/superpowers/plans/2026-08-29-batti-assistant.md`

## Scope

- Shared Assistant types and trust-boundary validators
- Normalized summaries for all 12 Areas
- Separate Crowd counts and Sample-pattern Eta
- Fragment-safe Batti SSE parser
- Two-stage `question | report | off_topic` classification pipeline
- Streaming question Guidance
- Deterministic off-topic redirect
- Next.js App Router Assistant route on Vercel
- Floating launcher and accessible session-only bottom sheet
- Six-message request-history bound
- Real-time remaining count display, without enforcing the final limit yet

The Report classification contract exists in this ticket, but confirmation and Report submission are BATTI-AI-002.

## Acceptance

- A question reaches `/api/assistant` without exposing `OPENROUTER_API_KEY` to the browser.
- `z-ai/glm-5.3-flash` classifies the message, then streams Guidance.
- Guidance mirrors the input language.
- The request contains combined Status, Sample-pattern Eta, and genuine Crowd counts separately.
- Seed Reports are never counted as Crowd evidence.
- Unknown Areas, malformed classifications, oversized messages, and more than six history messages are rejected.
- Off-topic input gets a brief redirect without a second model call.
- The bottom sheet supports Escape, focus return, `aria-live`, and reduced motion.
- Existing Map, Report buttons, Forecast, Eta, and Halo behavior remain unchanged.

## Verification

```bash
pnpm vitest run lib/assistant.test.ts lib/assistant-stream.test.ts lib/assistant-server.test.ts app/api/assistant/route.test.ts
pnpm test
pnpm build
pnpm dev
```

With `OPENROUTER_API_KEY` configured locally, ask one English and one Banglish Area question and verify streamed responses distinguish Crowd evidence from the Sample pattern.

## Commit boundary

This ticket may use the four focused commits listed in Tasks 1–4 of the implementation plan. Do not include `stacksmith/`, credentials, or unrelated cleanup.
