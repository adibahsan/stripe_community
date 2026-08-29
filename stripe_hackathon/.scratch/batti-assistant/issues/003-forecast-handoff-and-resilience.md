# BATTI-AI-003 — Forecast handoff and resilience

**Status:** Blocked  
**Depends on:** BATTI-AI-002  
**Blocks:** BATTI-AI-004

## Outcome

The Assistant remains useful when AI fails, enforces the 20-message page-session allowance, and accepts a contextual handoff from the existing deterministic Forecast sheet.

## Read first

- `CONTEXT.md`
- `docs/superpowers/specs/2026-08-29-batti-assistant-design.md`
- Task 6, Steps 1–3 in `docs/superpowers/plans/2026-08-29-batti-assistant.md`
- Completed BATTI-AI-001 and BATTI-AI-002 implementations

## Scope

- **Ask Batti about this** from ready Forecast state
- Same-Area deterministic Forecast context passed to the Assistant
- Deterministic Status/Eta summary after classification, provider, or stream failure
- Direct On/Off/Unsure fallback controls
- Retry behavior
- Incomplete marker for partial streams
- Report-draft removal on every failed or interrupted path
- Visible 20-message page-session allowance

## Acceptance

- Forecast remains deterministic, retains canned Advice, and works without AI.
- Forecast handoff closes Forecast, opens Ask Batti, and preserves Area and Forecast facts.
- Failed classification or provider response shows existing Status/Eta and direct Report controls.
- Mid-stream failure marks partial text incomplete.
- No failed path leaves a confirmable Report draft.
- Retry starts a fresh request without duplicating the previous Crowd message.
- The 20th valid submission is allowed.
- The 21st submission is blocked in the browser with clear copy.
- Refresh clears both Assistant history and the visible allowance.
- Server-side Netlify rate limiting remains the abuse/spend boundary.

## Verification

```bash
pnpm vitest run lib/assistant.test.ts lib/assistant-stream.test.ts netlify/functions/assistant.test.ts
pnpm test
pnpm build
```

Manually force provider non-2xx and stream interruption through the injected development transport or a focused fixture. Verify deterministic fallback and confirm that existing direct Report behavior still works.

## Commit boundary

Commit Forecast handoff, fallback, and session-limit behavior together as one resilience slice. Do not include live model tests, credentials, deployment, `stacksmith/`, or unrelated cleanup.
