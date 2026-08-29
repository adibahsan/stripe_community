# BATTI-AI-004 — Live GLM verification and deploy readiness

**Status:** Blocked  
**Depends on:** BATTI-AI-003  
**Blocks:** Nothing

## Outcome

The completed Assistant is verified against the real OpenRouter `z-ai/glm-5.3-flash` model, documented for local and Netlify operation, reviewed against the approved spec, and ready for production deployment.

## Read first

- `CONTEXT.md`
- `docs/superpowers/specs/2026-08-29-batti-assistant-design.md`
- Task 6, Steps 4–8 and the final review gate in `docs/superpowers/plans/2026-08-29-batti-assistant.md`
- Completed BATTI-AI-001 through BATTI-AI-003 implementation

## Scope

- Exclude live model tests from ordinary `pnpm test`
- Add `pnpm test:assistant:live`
- Exercise real classification, structured output, and streaming
- Cover English, Bangla, Banglish, Report, safety, and off-topic cases
- Document environment setup, local Netlify development, verification, and CLI deployment
- Run full deterministic, build, live, manual acceptance, and `/code-review` gates

## Acceptance

- `pnpm test` requires no key or network and remains deterministic.
- `pnpm test:assistant:live` fails clearly without `OPENROUTER_API_KEY`.
- With the key configured, live checks call `z-ai/glm-5.3-flash`.
- Live assertions check protocol and safety/grounding invariants rather than exact prose.
- No test, log, source file, or documentation contains the key.
- Both directly configured and Stripe-Projects-supplied `OPENROUTER_API_KEY` values use the same application path.
- `pnpm build` preserves the static export.
- Netlify manual deploy includes `out/` and the configured functions directory.
- The approved combined Banglish Report demo passes on the Netlify runtime.
- `/code-review` reports no unresolved Standards or Spec findings.

## Verification

```bash
pnpm test
pnpm build
pnpm test:assistant:live
```

Then run the complete manual acceptance checklist from the design spec.

Production deployment, only when explicitly requested:

```bash
pnpm --package=netlify-cli dlx netlify deploy --prod --no-build --dir=out --site 457cd7c2-abd7-4f94-8218-19f05d4d670a
```

## Secret handoff

Do not ask the user to paste the OpenRouter key into chat. Pause at the live-test gate and ask them to configure `OPENROUTER_API_KEY` in their local/Netlify environment, then resume verification.

## Commit boundary

Commit only live verification, documentation, and any narrowly required deploy configuration. Do not deploy unless explicitly requested. Do not include credentials, `stacksmith/`, or unrelated cleanup.
