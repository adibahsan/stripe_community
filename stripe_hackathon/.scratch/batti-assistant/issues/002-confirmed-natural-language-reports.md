# BATTI-AI-002 — Confirmed natural-language Reports

**Status:** Done  
**Depends on:** BATTI-AI-001  
**Blocks:** BATTI-AI-003, BATTI-AI-004

## Outcome

A Crowd member can describe what they see in Bangla, English, or Banglish, receive a streamed acknowledgement, review a validated Area + On/Off/Unsure draft, and explicitly confirm exactly one Crowd Report.

## Acceptance (shipped)

- Draft confirmation helpers live in `lib/assistant.ts`.
- `BattiAssistant` renders Confirm / Cancel and View Map / Keep asking after success.
- `BattiApp.submitReport(areaId, kind)` is the single Report-writing path for dock taps and Assistant confirmation.
- Failed or incomplete streams clear confirmable drafts.

## Verification

```bash
pnpm vitest run lib/assistant.test.ts
pnpm test
pnpm build
```
