# Batti Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a streaming, grounded Batti Assistant that answers Area questions, drafts confirmable Crowd Reports, and hands off from Forecast without changing Status, Eta, Seed, or Halo rules.

**Architecture:** Keep the Next.js app as a static export and add one TypeScript Netlify Function at `/api/assistant`. The browser sends normalized Area evidence to a two-stage OpenRouter pipeline using `z-ai/glm-5.3-flash`; the Function returns a small SSE protocol consumed by a session-only bottom sheet.

**Tech Stack:** Next.js 15 static export, React 19, TypeScript, Vitest, Netlify Functions, native `fetch`/`ReadableStream`, OpenRouter Chat Completions.

## Global Constraints

- Use `pnpm` for every Node-related command.
- Default OpenRouter model: `z-ai/glm-5.3-flash`.
- Keep `OPENROUTER_API_KEY` server-only and out of source control, fixtures, logs, and documentation.
- Do not add an AI SDK, schema library, state library, database, authentication system, or browser persistence for Assistant history.
- Keep Status as the existing 30-minute majority over Seed plus Crowd Reports.
- Keep Eta and Forecast deterministic and labeled as Sample pattern.
- Never describe Seed as Crowd evidence or claim live DESCO/trained-model knowledge.
- Never submit an AI-drafted Report before an explicit Crowd confirmation.
- Mirror Bangla, English, or Banglish input in Guidance.
- Keep Forecast and canned Advice usable without AI.
- Honor reduced-motion and keyboard/focus accessibility in the bottom sheet.

---

## File map

### Create

- `lib/assistant.ts` — shared Assistant contracts, Area evidence construction, request validation, classification validation, and pure session-state helpers.
- `lib/assistant.test.ts` — deterministic evidence, validation, session-limit, and Report-state tests.
- `lib/assistant-stream.ts` — browser-side parser for Batti SSE events.
- `lib/assistant-stream.test.ts` — fragmented/combined stream parsing tests.
- `lib/assistant-safety.ts` — small curated safety text used by the server prompt.
- `netlify/functions/assistant.ts` — request validation, two-stage OpenRouter calls, SSE transformation, and rate-limit config.
- `netlify/functions/assistant.test.ts` — Function tests with injected fake `fetch`.
- `netlify/functions/assistant.live.test.ts` — opt-in real-model contract checks.
- `vitest.live.config.ts` — includes only live Assistant tests.
- `components/BattiAssistant.tsx` — floating launcher, bottom sheet, chat, report confirmation, fallback, and focus behavior.

### Modify

- `components/BattiApp.tsx` — build normalized evidence, own Assistant open/handoff state, and expose Area-aware Report submission.
- `components/ForecastSheet.tsx` — add **Ask Batti about this** callback.
- `app/globals.css` — Assistant launcher, bottom sheet, messages, confirmation card, fallback, and reduced-motion styles.
- `netlify.toml` — declare `netlify/functions` and esbuild bundling.
- `vitest.config.ts` — exclude `*.live.test.ts` from ordinary tests.
- `package.json` — add `test:assistant:live`.
- `README.md` — document local Netlify development, environment variables, live verification, and deploy command.

---

### Task 1: Shared Assistant contracts and normalized evidence

**Files:**
- Create: `lib/assistant.ts`
- Create: `lib/assistant.test.ts`

**Interfaces:**
- Consumes: `AREAS`, `AreaId`, `Eta`, `Forecast`, `Report`, `ReportKind`, `Status`.
- Produces:

```ts
export type CrowdEvidence = {
  on: number;
  off: number;
  unsure: number;
  latestMinutesAgo: number | null;
};

export type AssistantArea = {
  id: AreaId;
  name: string;
  status: Status;
  eta: Eta;
  crowd: CrowdEvidence;
};

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantForecast = Forecast & {
  areaId: AreaId;
};

export type AssistantRequest = {
  selectedAreaId: AreaId;
  areas: AssistantArea[];
  history: AssistantMessage[];
  message: string;
  forecast: AssistantForecast | null;
};

export type AssistantClassification = {
  intent: "question" | "report" | "off_topic";
  areaId: AreaId;
  reportKind: ReportKind | null;
  language: "bn" | "en" | "mixed";
};

export type AssistantEvent =
  | { type: "delta"; text: string }
  | { type: "report_draft"; areaId: AreaId; kind: ReportKind }
  | { type: "done" }
  | { type: "error"; code: "invalid_request" | "classification_failed" | "provider_failed" | "stream_failed" };
```

- Produces:

```ts
export function buildAssistantAreas(input: {
  now: Date;
  crowd: readonly Report[];
  statusByArea: Readonly<Record<string, Status>>;
  etaByArea: Readonly<Record<string, Eta>>;
}): AssistantArea[];

export function validateAssistantRequest(value: unknown): AssistantRequest | null;

export function validateClassification(
  value: unknown,
  request: AssistantRequest,
): AssistantClassification | null;
```

- [ ] **Step 1: Write evidence tests**

Create reports at 5, 10, 20, and 31 minutes ago and assert that `buildAssistantAreas`:

```ts
expect(dhanmondi.crowd).toEqual({
  on: 1,
  off: 1,
  unsure: 1,
  latestMinutesAgo: 5,
});
expect(dhanmondi.status).toBe("off");
expect(dhanmondi.eta).toEqual({ direction: "on", minutes: 42 });
```

The 31-minute Report must not count. Pass `crowd`, not merged Seed plus Crowd, so Seed can never be mislabeled as Crowd evidence.

- [ ] **Step 2: Run the evidence test and verify red**

Run:

```bash
pnpm vitest run lib/assistant.test.ts
```

Expected: FAIL because `lib/assistant.ts` does not exist.

- [ ] **Step 3: Implement normalized evidence**

Implement the four counts with one 30-minute filter per Area. Clamp latest age to a non-negative integer. Use `AREAS` for IDs and display names; do not accept names from model or browser input.

- [ ] **Step 4: Add request-validation tests**

Assert acceptance of exactly 12 unique known Areas, at most six history messages, and a trimmed message from 1–1000 characters. Assert rejection of:

```ts
[
  { ...valid, selectedAreaId: "unknown" },
  { ...valid, history: Array(7).fill(valid.history[0]) },
  { ...valid, message: "" },
  { ...valid, message: "x".repeat(1001) },
  { ...valid, areas: valid.areas.slice(1) },
]
```

- [ ] **Step 5: Implement manual trust-boundary validation**

Use small type-guard helpers in `lib/assistant.ts`. Do not add Zod or another runtime-schema dependency for this one request shape.

- [ ] **Step 6: Add classification-validation tests**

Cover:

```ts
expect(validateClassification(
  { intent: "report", areaId: "dhanmondi", reportKind: "off", language: "mixed" },
  request,
)).toEqual({
  intent: "report",
  areaId: "dhanmondi",
  reportKind: "off",
  language: "mixed",
});
```

Reject unknown Areas, invalid kinds, a non-null `reportKind` for questions, and a null `reportKind` for Reports. Verify that a classifier result with no explicit known Area is normalized by the server prompt to `selectedAreaId`; validation itself must never guess.

- [ ] **Step 7: Run shared tests**

Run:

```bash
pnpm vitest run lib/assistant.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add stripe_hackathon/lib/assistant.ts stripe_hackathon/lib/assistant.test.ts
git commit -m "feat: add grounded Assistant contracts"
```

---

### Task 2: Batti SSE parser

**Files:**
- Create: `lib/assistant-stream.ts`
- Create: `lib/assistant-stream.test.ts`

**Interfaces:**
- Consumes: a `ReadableStream<Uint8Array>` containing `event:` and `data:` frames.
- Produces:

```ts
export async function* parseAssistantStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<AssistantEvent>;
```

- [ ] **Step 1: Write fragmented-stream tests**

Construct a stream where boundaries split both UTF-8 text and SSE delimiters:

```ts
const frames = [
  'event: delta\ndata: {"text":"Bujh',
  'lam"}\n\nevent: report_draft\ndata: {"areaId":"dhanmondi",',
  '"kind":"off"}\n\nevent: done\ndata: {}\n\n',
];
```

Encode fragments through one `TextEncoder`, collect the async generator, and expect:

```ts
[
  { type: "delta", text: "Bujhlam" },
  { type: "report_draft", areaId: "dhanmondi", kind: "off" },
  { type: "done" },
]
```

Use an actual Bangla string in a second test to verify streaming `TextDecoder` behavior across multibyte boundaries.

- [ ] **Step 2: Run the parser test and verify red**

```bash
pnpm vitest run lib/assistant-stream.test.ts
```

Expected: FAIL because the parser does not exist.

- [ ] **Step 3: Implement the parser**

Use one streaming `TextDecoder`, retain incomplete text in a buffer, split complete frames on `\n\n`, parse `event` and `data` lines, and validate each decoded event with known Area and Report-kind guards from `lib/assistant.ts`.

Throw a typed `Error("invalid_assistant_stream")` for malformed JSON or unknown events. Never evaluate event content.

- [ ] **Step 4: Cover combined frames and malformed input**

Add tests for multiple frames in one transport chunk, a final frame before stream close, invalid JSON, and an unknown event type.

- [ ] **Step 5: Run parser and shared tests**

```bash
pnpm vitest run lib/assistant-stream.test.ts lib/assistant.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add stripe_hackathon/lib/assistant-stream.ts stripe_hackathon/lib/assistant-stream.test.ts
git commit -m "feat: parse Assistant event streams"
```

---

### Task 3: Netlify Function and two-stage OpenRouter pipeline

**Files:**
- Create: `lib/assistant-safety.ts`
- Create: `netlify/functions/assistant.ts`
- Create: `netlify/functions/assistant.test.ts`
- Modify: `netlify.toml`

**Interfaces:**
- Consumes: validated `AssistantRequest`, `OPENROUTER_API_KEY`, and optional `OPENROUTER_MODEL`.
- Produces: `POST /api/assistant` with `Content-Type: text/event-stream`.
- Test seam:

```ts
export function createAssistantHandler(
  requestFetch: typeof fetch,
): (request: Request) => Promise<Response>;

export default createAssistantHandler(fetch);
```

- [ ] **Step 1: Write the failing question-path Function test**

Inject a fake `fetch` that returns:

1. a non-streamed structured classification:

```json
{"choices":[{"message":{"content":"{\"intent\":\"question\",\"areaId\":\"dhanmondi\",\"reportKind\":null,\"language\":\"mixed\"}"}}]}
```

2. an OpenRouter SSE body with two text deltas and `[DONE]`.

Call the handler with a valid request and assert:

- exactly two upstream calls;
- both use `z-ai/glm-5.3-flash`;
- the first uses `response_format.type = "json_schema"`;
- the second uses `stream: true`;
- the returned Batti stream contains `delta`, `delta`, then `done`;
- trusted Area facts and curated safety content appear in the system prompt;
- user text appears only in a user-role message.

- [ ] **Step 2: Run the Function test and verify red**

```bash
pnpm vitest run netlify/functions/assistant.test.ts
```

Expected: FAIL because the Function does not exist.

- [ ] **Step 3: Implement the minimum Function**

Use native web APIs:

```ts
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const model = process.env.OPENROUTER_MODEL ?? "z-ai/glm-5.3-flash";
```

Return JSON errors before streaming for non-POST, unsupported content type, missing key, oversized body, or invalid request. Never log request bodies or the key.

Build the classifier schema with `additionalProperties: false` and enums copied from known Area IDs and Report kinds.

- [ ] **Step 4: Transform OpenRouter streaming frames**

Read the second upstream response incrementally. For each `choices[0].delta.content` string, emit:

```text
event: delta
data: {"text":"..."}

```

Treat OpenRouter's final usage chunk as accounting data, not a second completion. Emit one Batti `done` event after `[DONE]`.

- [ ] **Step 5: Add Report and off-topic tests**

For a Report classification, verify the Function streams acknowledgement text and emits:

```text
event: report_draft
data: {"areaId":"dhanmondi","kind":"off"}

event: done
data: {}

```

only after acknowledgement deltas. For `off_topic`, assert one classifier call and a deterministic redirect without a second upstream call.

- [ ] **Step 6: Add failure tests**

Cover missing key, invalid request, malformed classification, unknown Area, provider non-2xx, missing upstream body, malformed upstream SSE, and mid-stream failure. Assert no `report_draft` is emitted on any failure.

- [ ] **Step 7: Add safety content**

Export one concise constant from `lib/assistant-safety.ts` covering:

- preparation and conservation;
- no repair instructions;
- immediate high-level triage for fire, shock, smoke, trapped people, or medical-device risk;
- referral to emergency or qualified professional help.

Test that system prompts prohibit DESCO/live-grid/trained-model claims and require explicit Crowd-versus-Sample-pattern wording.

- [ ] **Step 8: Configure Netlify**

Add:

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

Export Function configuration:

```ts
export const config = {
  path: "/api/assistant",
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
```

- [ ] **Step 9: Run Function tests and static build**

```bash
pnpm vitest run netlify/functions/assistant.test.ts lib/assistant.test.ts lib/assistant-stream.test.ts
pnpm build
```

Expected: all tests PASS; static export succeeds.

- [ ] **Step 10: Commit**

```bash
git add stripe_hackathon/lib/assistant-safety.ts stripe_hackathon/netlify/functions stripe_hackathon/netlify.toml
git commit -m "feat: stream grounded OpenRouter Guidance"
```

---

### Task 4: Floating Assistant question experience

**Files:**
- Create: `components/BattiAssistant.tsx`
- Modify: `components/BattiApp.tsx`
- Modify: `app/globals.css`
- Modify: `lib/assistant.ts`
- Modify: `lib/assistant.test.ts`

**Interfaces:**
- Consumes:

```ts
type BattiAssistantProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAreaId: AreaId;
  areas: AssistantArea[];
  forecast: AssistantForecast | null;
  onConfirmReport: (areaId: AreaId, kind: ReportKind) => void;
};
```

- `BattiAssistant` owns page-session messages, active request, incomplete-stream state, and submitted-message count.
- `BattiApp` owns all power-domain state plus the externally controllable Assistant open state required by Forecast handoff.

- [ ] **Step 1: Add pure message-limit and stream-reduction tests**

In `lib/assistant.ts`, define:

```ts
export const ASSISTANT_SESSION_LIMIT = 20;

export function appendAssistantEvent(
  state: AssistantReplyState,
  event: AssistantEvent,
): AssistantReplyState;
```

Test delta concatenation, incomplete/error state, delayed Report draft, one terminal completion, and rejection of submission when count is 20.

- [ ] **Step 2: Run the state tests and verify red**

```bash
pnpm vitest run lib/assistant.test.ts
```

Expected: FAIL for missing session helpers.

- [ ] **Step 3: Implement the pure helpers**

Keep transitions immutable. Ignore events after `done` or `error`. Do not allow a `report_draft` to mutate domain Reports.

- [ ] **Step 4: Build normalized evidence in `BattiApp`**

Use existing `crowd`, `statusByArea`, and `etaByArea`:

```ts
const assistantAreas = useMemo(
  () => buildAssistantAreas({ now, crowd, statusByArea, etaByArea }),
  [now, crowd, statusByArea, etaByArea],
);
```

Do not pass merged `reports` into `buildAssistantAreas`.

- [ ] **Step 5: Implement the floating launcher and bottom sheet**

The component must:

- render a persistent **Ask Batti** launcher;
- open a dialog labeled by its heading;
- show selected Area, privacy notice, examples, and `20 - submittedCount`;
- preserve messages when closed;
- keep history in React state only;
- submit with `fetch("/api/assistant", { method: "POST", ... })`;
- send at most the latest six messages;
- parse `response.body` with `parseAssistantStream`;
- display streamed deltas without fake character animation;
- abort the active request on unmount;
- return focus to the launcher on close;
- close on Escape;
- expose an `aria-live="polite"` response region.

- [ ] **Step 6: Add the existing visual language**

Add focused CSS classes prefixed `assistant-`. Reuse `--asphalt`, `--paper`, `--sodium`, `--on`, `--off`, and `--fog`. Keep the launcher above Map controls and below dialogs. Use a bottom sheet on narrow screens and a right-aligned sheet no wider than 32rem on larger screens.

Under `prefers-reduced-motion: reduce`, remove launcher/sheet transitions and cursor animation.

- [ ] **Step 7: Verify the question slice**

```bash
pnpm test
pnpm build
```

Then run `pnpm --package=netlify-cli dlx netlify dev`, open the local URL, and verify a grounded question streams through the Function.

Expected: normal tests PASS, static export succeeds, and the Assistant opens without changing existing Map/Report/Forecast behavior.

- [ ] **Step 8: Commit**

```bash
git add stripe_hackathon/components/BattiAssistant.tsx stripe_hackathon/components/BattiApp.tsx stripe_hackathon/app/globals.css stripe_hackathon/lib/assistant.ts stripe_hackathon/lib/assistant.test.ts
git commit -m "feat: add floating Ask Batti experience"
```

---

### Task 5: Confirmed natural-language Reports

**Files:**
- Modify: `components/BattiAssistant.tsx`
- Modify: `components/BattiApp.tsx`
- Modify: `lib/assistant.ts`
- Modify: `lib/assistant.test.ts`

**Interfaces:**
- Consumes: validated `report_draft` event.
- Produces: exactly one existing `Report` only through `onConfirmReport(areaId, kind)`.

- [ ] **Step 1: Write Report-transition tests**

Cover:

- draft does not submit;
- cancel clears the draft and submits nothing;
- confirm returns one `{ areaId, kind }` command;
- a second confirm cannot return another command;
- an explicit different Area is preserved;
- an error after partial acknowledgement leaves no confirmable draft.

- [ ] **Step 2: Run the tests and verify red**

```bash
pnpm vitest run lib/assistant.test.ts
```

Expected: FAIL for missing confirmation transitions.

- [ ] **Step 3: Implement Area-aware Report submission**

Replace the selected-only helper with:

```ts
function submitReport(areaId: AreaId, kind: ReportKind) {
  setSelectedId(areaId);
  setCrowd((previous) => [
    ...previous,
    { areaId, kind, at: new Date().toISOString() },
  ]);
}
```

Existing On/Off/Unsure buttons call `submitReport(selectedId, kind)`. Assistant confirmation calls `submitReport(draft.areaId, draft.kind)`.

- [ ] **Step 4: Render the confirmation card**

After the acknowledgement stream completes, show known Area display name, Report kind, the 30-minute note, **Confirm**, and **Cancel**. Disable confirmation while applying it. After success, show **View Map** and **Keep asking**.

- [ ] **Step 5: Verify end-to-end behavior**

With a fake Function response, verify manually:

1. acknowledgement text appears before the card;
2. Status/Halo do not change before confirmation;
3. confirmation writes one localStorage Report;
4. selected Area switches when the message named another known Area;
5. Map Status/Halo recalculate via existing code;
6. cancellation changes nothing.

Run:

```bash
pnpm test
pnpm build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add stripe_hackathon/components/BattiAssistant.tsx stripe_hackathon/components/BattiApp.tsx stripe_hackathon/lib/assistant.ts stripe_hackathon/lib/assistant.test.ts
git commit -m "feat: confirm Assistant Report drafts"
```

---

### Task 6: Forecast handoff, deterministic fallback, and live GLM verification

**Files:**
- Modify: `components/ForecastSheet.tsx`
- Modify: `components/BattiApp.tsx`
- Modify: `components/BattiAssistant.tsx`
- Modify: `app/globals.css`
- Modify: `vitest.config.ts`
- Create: `vitest.live.config.ts`
- Create: `netlify/functions/assistant.live.test.ts`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Forecast produces `onAskBatti(areaId, forecast)`.
- Live command: `pnpm test:assistant:live`.

- [ ] **Step 1: Add Forecast handoff**

Add to `ForecastSheet`:

```ts
onAskBatti: (areaId: AreaId, forecast: Forecast) => void;
```

In the ready state, render **Ask Batti about this**. In `BattiApp`, the callback closes Forecast and passes `{ areaId, ...forecast }` into the Assistant.

- [ ] **Step 2: Complete deterministic fallback**

On invalid request response, missing response body, parser failure, provider error event, or mid-stream interruption:

- mark partial model text incomplete;
- show selected Area Status and formatted Eta from existing deterministic data;
- show direct On/Off/Unsure controls using `onConfirmReport`;
- offer Retry;
- never show or retain a Report draft from the failed request.

- [ ] **Step 3: Enforce the visible session allowance**

Increment submitted count once when a valid request leaves the browser. At 20, disable the input and submit button and explain that refresh starts a new session. Do not present this as the server security limit.

- [ ] **Step 4: Isolate live tests from ordinary tests**

Update `vitest.config.ts`:

```ts
test: {
  environment: "node",
  exclude: ["**/*.live.test.ts"],
},
```

Create `vitest.live.config.ts` with only `netlify/functions/assistant.live.test.ts`, and add:

```json
"test:assistant:live": "vitest run --config vitest.live.config.ts"
```

- [ ] **Step 5: Write the live GLM checks**

Fail immediately with a clear message when `OPENROUTER_API_KEY` is absent. Import `createAssistantHandler(fetch)` and send real requests covering:

- Banglish Off Report for Dhanmondi;
- English grounded Area question;
- Bangla grounded Area question;
- dangerous repair request;
- unrelated general-chat request.

Assert protocol shape and required labels rather than exact prose. Keep live prompts few and short to limit cost.

- [ ] **Step 6: Document local and production operation**

Document:

```bash
pnpm --package=netlify-cli dlx netlify dev
pnpm test
OPENROUTER_API_KEY=... pnpm test:assistant:live
pnpm build
pnpm --package=netlify-cli dlx netlify deploy --prod --no-build --dir=out --site 457cd7c2-abd7-4f94-8218-19f05d4d670a
```

State that the key should be configured through local Netlify environment handling and the Netlify dashboard/CLI, not committed or pasted into docs. Confirm the CLI deploy discovers the configured functions directory as well as `out/`.

- [ ] **Step 7: Run full verification**

```bash
pnpm test
pnpm build
OPENROUTER_API_KEY="$OPENROUTER_API_KEY" pnpm test:assistant:live
```

Expected: deterministic suite PASS, static export succeeds, and live GLM checks PASS.

Perform the approved manual acceptance flow from the design spec, including no Map change before Report confirmation and correct Forecast handoff.

- [ ] **Step 8: Commit**

```bash
git add stripe_hackathon/components stripe_hackathon/app/globals.css stripe_hackathon/vitest.config.ts stripe_hackathon/vitest.live.config.ts stripe_hackathon/netlify/functions/assistant.live.test.ts stripe_hackathon/package.json stripe_hackathon/README.md
git commit -m "test: verify Batti Assistant end to end"
```

---

## Final review gate

After all six tasks:

```bash
pnpm test
pnpm build
```

With the key configured:

```bash
pnpm test:assistant:live
```

Then run `/code-review` along both axes:

- **Standards:** repository conventions, trust boundaries, accessibility, no secret leakage, no unnecessary dependencies.
- **Spec:** every requirement in `docs/superpowers/specs/2026-08-29-batti-assistant-design.md`, especially Crowd-versus-Seed wording and confirmation-before-Report.

Do not commit `stacksmith/`. Do not commit any local OpenRouter or Netlify credential file.
