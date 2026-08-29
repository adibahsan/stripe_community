# Batti Assistant design

**Date:** 2026-08-29  
**Status:** Approved in design interview  
**Model:** OpenRouter `z-ai/glm-5.3-flash`

## Purpose

Add one conversational Batti Assistant that:

1. answers practical power and outage-preparation questions;
2. generates contextual Guidance grounded in Batti facts and curated safety content;
3. converts natural-language observations into Report drafts that require Crowd confirmation.

The required demonstration is:

> In Dhanmondi, type a Banglish outage observation, receive a streamed acknowledgement, confirm the Off Report, and see the Map Status and Halo recalculate.

The Assistant must keep Crowd evidence distinct from the Sample pattern throughout this flow.

## Domain language

The canonical definitions live in `CONTEXT.md`.

- **Batti Assistant:** the conversational part of Batti. It answers Crowd questions and can draft, but never submit, a Report.
- **Guidance:** a generated practical response grounded in Batti facts and curated household-safety content.
- **Advice:** remains the canned long-form copy in the deterministic Forecast sheet. Guidance does not replace Advice.

The Assistant is not a grid operator, a source of Status, an automated reporter, or a trained prediction model.

## Locked product decisions

- One unified Assistant handles questions, Guidance, and Report drafting.
- Input is text only and may be Bangla, English, or Banglish.
- Replies mirror the Crowd's language.
- The Assistant opens from a floating launcher into a dismissible bottom sheet.
- An explicitly named known Area overrides the currently selected Area. Otherwise, the selected Area applies.
- The Assistant does not infer Areas from landmarks or free-form location descriptions.
- A Report draft requires one explicit confirmation tap before submission.
- Report-like messages receive a short streamed acknowledgement followed by a confirmation card.
- Forecast stays deterministic and retains canned Advice.
- Forecast gains an **Ask Batti about this** handoff that opens the Assistant with the same Area and Forecast context.
- Conversation history lives only for the current page session and is cleared by refresh.
- The UI allows 20 submitted AI messages per page session and shows the remaining count.
- Off-topic messages receive a brief redirect.
- Messages and selected Area are disclosed as being sent to an AI provider. Batti does not store conversation history server-side.
- Dangerous electrical or medical scenarios receive high-level safety triage and referral to emergency or qualified professional help. The Assistant never provides repair instructions.

## Existing invariants

The new feature must not reopen these shipped locks:

- Live presentation remains Dhaka clock plus this month's Seed plus Crowd Reports.
- Status remains the 30-minute majority of On and Off Reports; Unsure does not vote, and the latest On/Off Report breaks a tie.
- Map Eta remains a deterministic lookup from the month's Seed curve.
- Halos remain the Map representation of On, Off, and Stale.
- Seed remains labeled **Sample pattern**.
- There is no live DESCO feed, trained outage model, official feeder model, Admin, GeoJSON, or automatic Report submission.

## User interface

### Entry

A floating **Ask Batti** launcher is visible without permanently covering the Map. Activating it opens a bottom sheet scoped to the selected Area.

The initial sheet contains:

- the current Area;
- a text input accepting Bangla, English, and Banglish;
- example prompts;
- an inline privacy notice before the first message;
- the remaining session-message count.

The sheet is dismissible. Dismissing and reopening preserves history until page refresh.

### Question and Guidance flow

1. The Crowd submits a message.
2. The message appears immediately.
3. The Assistant classifies the intent.
4. For a supported question, Guidance streams into the sheet.
5. The final response remains visible in session history.

Every factual response must distinguish:

- combined Status;
- genuine Crowd evidence;
- Sample-pattern Eta or Forecast information.

Example:

> Status is On; there are 2 recent Crowd Reports; the Sample pattern suggests Off in about 2 hours.

### Report flow

1. The Crowd submits an observation such as `Current chole gese`.
2. The Assistant streams a short acknowledgement in the same language.
3. After the stream completes, a validated confirmation card appears with:
   - Area;
   - On, Off, or Unsure;
   - a note that the Report counts toward Status for 30 minutes.
4. **Confirm** submits exactly one Crowd Report through the existing Report-writing path.
5. **Cancel** submits nothing.
6. After confirmation, the Map Status and Halo recalculate through existing logic.

The model cannot directly invoke the Report-writing callback. Malformed or unknown Area/kind output produces no confirmation card.

### Forecast handoff

The existing Forecast sheet adds **Ask Batti about this**. Activating it:

1. closes Forecast;
2. opens the Assistant;
3. keeps the Forecast Area selected;
4. supplies the deterministic Forecast facts as context.

Forecast remains usable without AI.

### Failure state

If classification, OpenRouter, or response streaming fails, the sheet shows:

- a deterministic selected-Area Status and Eta summary;
- direct On, Off, and Unsure controls wired to the existing Report flow;
- a concise retry affordance.

If a stream fails after partial output, the partial response is marked incomplete and followed by the deterministic fallback. No Report draft is emitted after a failed stream.

## Architecture

### Ownership

`BattiApp` remains the source of truth for:

- selected Area;
- Crowd Reports;
- combined reports;
- Status;
- Eta;
- Forecast;
- Report submission;
- Map updates.

A new `BattiAssistant` component receives normalized context and an `onConfirmReport` callback. It owns only presentation state, page-session conversation history, streaming state, and the visible 20-message allowance.

Pure modules should own:

- construction of normalized Assistant context;
- request and response validation;
- parsing Assistant stream events.

The OpenRouter transport stays behind the Netlify Function boundary. No AI SDK is required; native `fetch`, `ReadableStream`, and `EventSource`-compatible server-sent event framing are sufficient.

### Netlify Function

A TypeScript function under `netlify/functions/` exposes a dedicated Assistant path. `netlify.toml` configures the functions directory and esbuild bundling while retaining `out/` as the static publish directory.

The Function:

1. accepts `POST` only;
2. validates content type and request size;
3. validates the request schema and known Area IDs;
4. enforces bounded history;
5. calls OpenRouter for intent classification;
6. validates the structured classification;
7. performs the relevant response branch;
8. streams server-sent events to the browser.

The Function exports a Netlify rate-limit configuration for its path. The initial limit is 30 requests per 60 seconds aggregated by IP and domain. The visible 20-message page-session allowance is a product limit, not the security boundary.

### Environment

The Function reads:

- `OPENROUTER_API_KEY`;
- `OPENROUTER_MODEL`, defaulting to `z-ai/glm-5.3-flash`;
- optional OpenRouter attribution headers configured as non-secret environment values.

`OPENROUTER_API_KEY` may be configured directly or supplied later through Stripe Projects. Application code does not distinguish the source.

The key must never be exposed to browser code, written to source control, placed in test fixtures, or pasted into project documentation.

## Data contracts

### Client request

The request contains:

- current selected Area ID;
- normalized summaries for all 12 Areas;
- optional deterministic Forecast facts for a Forecast handoff;
- the latest six conversation messages at most;
- the new Crowd message.

Each Area summary contains:

- Area ID and display name;
- combined Status;
- Sample-pattern Eta direction and minutes;
- genuine Crowd On, Off, and Unsure counts within 30 minutes;
- age in minutes of the latest genuine Crowd Report, or `null`.

The client does not send the full Seed or raw Report history.

### Classification result

The first model call uses a strict structured-output schema:

- `intent`: `question | report | off_topic`;
- `areaId`: one known Area ID;
- `reportKind`: `on | off | unsure | null`;
- `language`: `bn | en | mixed`.

Rules:

- an explicitly named known Area wins;
- otherwise `areaId` must equal the selected Area;
- `reportKind` must be non-null only for `report`;
- output outside the schema is a classification failure;
- the server never repairs an unknown Area or Report kind by guessing.

### Stream protocol

The Function returns `text/event-stream` with these application events:

- `delta`: one Guidance or acknowledgement text fragment;
- `report_draft`: validated Area ID and Report kind, emitted only after acknowledgement completion;
- `done`: successful terminal event;
- `error`: typed failure code suitable for deterministic fallback.

The browser parser must tolerate arbitrary network chunk boundaries, multiple events in one chunk, and a final frame without assuming one transport chunk equals one event.

## Model pipeline

Both stages use `z-ai/glm-5.3-flash` through OpenRouter.

### Stage 1: classify

The Function requests strict structured output. The classifier receives:

- the new message;
- selected Area;
- known Area names and IDs;
- only the minimum recent conversation needed to resolve references.

It does not receive authority to submit a Report.

### Stage 2: respond

- **Question:** stream Guidance grounded in normalized facts and the curated safety guide.
- **Report:** stream a short acknowledgement, then emit the already validated Report draft as a separate application event.
- **Off-topic:** return a deterministic brief redirect without a second model call.

The generator receives trusted facts in a clearly separated system-controlled section. Crowd messages and prior model text are untrusted content and cannot override grounding, safety, or output rules.

## Grounding and safety

The Assistant receives a small, versioned household-safety guide maintained in source control. It may provide preparation, conservation, and immediate high-level safety triage.

It must not:

- describe Seed as live Crowd evidence;
- claim access to DESCO or another utility;
- claim official feeder or outage knowledge;
- claim Eta or Forecast comes from a trained model;
- guarantee restoration times;
- provide electrical repair instructions;
- invent Crowd counts or Area facts;
- submit Reports automatically;
- answer unrelated general-chat questions.

For emergencies, Guidance should prioritize immediate safety and referral over conversational completeness.

## Privacy and retention

- The browser holds conversation history in React state only.
- Refresh clears the history.
- The Function does not write prompts, responses, or Report drafts to application storage.
- Batti sends the bounded message history, selected Area, and normalized Area summaries to OpenRouter for inference.
- The product notice must not imply that the external provider has no retention; it states only that Batti does not store the conversation server-side.

## Verification

### Deterministic suite

`pnpm test` remains network-independent. Tests use a fake OpenRouter transport at the Function's network boundary, not a fake model implementation embedded in product logic.

Coverage includes:

- normalized context construction;
- strict request validation;
- explicit-Area override and selected-Area fallback;
- classification-schema validation;
- rejection of unknown Areas and invalid Report kinds;
- SSE parsing across fragmented and combined chunks;
- no Report before confirmation;
- exactly one Report after confirmation;
- no Report after cancellation or malformed output;
- 21st page-session submission blocked;
- Forecast handoff preserving Area and facts;
- separate Crowd and Sample-pattern wording requirements;
- fallback after classification, provider, and mid-stream failures;
- safety and unsupported-claim prompt fixtures.

### Live OpenRouter verification

A separate opt-in pnpm script runs only when `OPENROUTER_API_KEY` is present. It calls the real `z-ai/glm-5.3-flash` model and verifies:

- structured classification;
- Report Area and kind extraction;
- streamed response delivery;
- Bangla and Banglish behavior;
- grounding labels;
- safety triage.

This command is not part of ordinary `pnpm test`, because network availability, provider credits, latency, and model behavior are not deterministic.

### Manual acceptance

Using the real key on the Netlify runtime:

1. select Dhanmondi;
2. open Ask Batti;
3. submit a Banglish Off observation;
4. observe streamed acknowledgement;
5. verify the Report card says Dhanmondi and Off;
6. verify the Map has not changed before confirmation;
7. confirm;
8. verify one Crowd Report is saved and the Map Status/Halo recalculates;
9. ask a grounded follow-up and verify Crowd evidence and Sample pattern are stated separately;
10. open Forecast and verify **Ask Batti about this** hands off the same Area and facts.

## Excluded scope

- voice input or transcription;
- server-side or cross-device conversation memory;
- authentication;
- landmark or GPS inference;
- live DESCO or utility data;
- trained outage prediction;
- changing Eta or Status rules;
- automatic Report submission;
- replacing Forecast or canned Advice;
- Admin or moderation;
- general-purpose chat;
- provider abstraction beyond environment-based OpenRouter configuration.
