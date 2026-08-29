# BATTI-AI-002 — Confirmed natural-language Reports

**Status:** Blocked  
**Depends on:** BATTI-AI-001  
**Blocks:** BATTI-AI-003, BATTI-AI-004

## Outcome

A Crowd member can describe what they see in Bangla, English, or Banglish, receive a streamed acknowledgement, review a validated Area + On/Off/Unsure draft, and explicitly confirm exactly one Crowd Report.

## Read first

- `CONTEXT.md`
- `docs/superpowers/specs/2026-08-29-batti-assistant-design.md`
- Task 5 in `docs/superpowers/plans/2026-08-29-batti-assistant.md`
- Completed BATTI-AI-001 implementation

## Scope

- Report classification output validation
- Streamed same-language acknowledgement
- `report_draft` emitted only after acknowledgement completion
- Confirmation card with known Area, Report kind, and 30-minute note
- Confirm, Cancel, View Map, and Keep asking actions
- Area-aware Report submission in `BattiApp`
- Existing direct Report buttons routed through the same Area-aware helper

## Acceptance

- “Current chole gese” while Dhanmondi is selected drafts Dhanmondi Off.
- An explicitly named known Area overrides the selected Area.
- Landmark descriptions do not infer an Area.
- Status, localStorage, and Halo do not change before confirmation.
- Confirm writes exactly one Crowd Report and selects its Area.
- A second confirmation cannot duplicate the Report.
- Cancel writes nothing.
- Malformed, unknown-Area, failed, or interrupted model output cannot produce a confirmable draft.
- The model never receives a callable path that writes Reports directly.

## Verification

```bash
pnpm vitest run lib/assistant.test.ts netlify/functions/assistant.test.ts
pnpm test
pnpm build
```

Manual flow:

1. Select Dhanmondi.
2. Submit `Current chole gese`.
3. Verify acknowledgement appears before the card.
4. Verify the Map has not changed.
5. Confirm.
6. Verify one new Dhanmondi Off Report and a recalculated Status/Halo.
7. Repeat with Cancel and verify no change.

## Commit boundary

Use the focused conventional commit from Task 5. Do not include fallback, Forecast handoff, live-test infrastructure, credentials, `stacksmith/`, or unrelated cleanup.
