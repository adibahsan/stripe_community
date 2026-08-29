# BATTI-AI-003 — Forecast handoff and resilience

**Status:** Done  
**Depends on:** BATTI-AI-002  
**Blocks:** BATTI-AI-004

## Outcome

The Assistant remains useful when AI fails, enforces the 20-message page-session allowance, and accepts a contextual handoff from the existing deterministic Forecast sheet.

## Acceptance (shipped)

- Forecast ready state includes **Ask Batti about this**.
- Handoff closes Forecast, opens Ask Batti, and passes same-Area Forecast facts.
- Failed streams show Status/Eta, direct Report controls, Retry, and incomplete markers.
- No failed path leaves a confirmable Report draft.
- The 21st page-session submission is blocked in the browser with clear copy.

## Verification

```bash
pnpm test
pnpm build
```
