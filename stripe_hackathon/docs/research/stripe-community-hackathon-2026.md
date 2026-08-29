# Stripe Community Hackathon 2026 — primary-source research

**Audience:** a Bangladesh-based competitor who cannot connect a live Stripe merchant account and must demo with test/sandbox (or mocked) Stripe data.

**Method:** every claim below is traced to a first-party owner (Stripe docs/sites, Stripe GitHub orgs, `projects.dev`, `stripecommunity.com`, or files in this workspace). Secondary blogs, LinkedIn, and third-party recaps are not used as evidence. Where a fact cannot be verified that way, it is marked **UNKNOWN**.

**Researched:** 2026-08-29.

---

## 0. What this event actually is

There is **no** first-party page titled “Stripe Community Hackathon 2026” that publishes a single global date range, prize table, or judging rubric.

What *does* exist, and what the local Stacksmith repo is built for:

| Name on a primary source | What it is |
| --- | --- |
| “Simplify building your tech stack with AI” — In-Person, Dhaka | Listed event on the official Stripe Community site. [stripecommunity.com](https://www.stripecommunity.com/) |
| “Stripe Dhaka AI Event 2026” | Filter name on the official Stripe Projects leaderboard. [projects.dev/leaderboard](https://projects.dev/leaderboard) |
| “Build with Stripe Community hackathon (Stripe Dhaka AI Event 2026)” | How the Stacksmith README names the event it was built for. [local `stacksmith/README.md`](/Users/adibahsan/dev/Github/stripe_community/stacksmith/README.md); same text on [github.com/sumonmselim/stacksmith](https://github.com/sumonmselim/stacksmith) |
| Stripe Projects participant workshop | Official “Go from init to deploy in 30 minutes” guide used as the hackathon playbook. [projects.dev/hackathon-participants](https://projects.dev/hackathon-participants) |

Stripe Community is a **city/topic network run by Stripe advocates**, not a single global contest. The homepage says communities are “Open to all—no Stripe account required” and that upcoming events include “networking events, hackathons, panel discussions, and more.” [stripecommunity.com](https://www.stripecommunity.com/)

The Community Builders program supports local leaders who “host at least four events each year.” It does **not** publish a 2026 global hackathon spec. [Become a Stripe Community Builder](https://stripe.com/gb/guides/become-a-stripe-community-builder); [stripecommunity.com builder page](https://www.stripecommunity.com/pages/become-a-stripe-community-builder-7n04o9)

**UNKNOWN:** whether “Stripe Community Hackathon 2026” is used as an official umbrella name anywhere besides the Stacksmith README’s “Build with Stripe Community” phrasing.

---

## 1. Official event: dates, rules, judging, prizes, required tech, submission

### 1.1 Dates and venue

Verified from [stripecommunity.com](https://www.stripecommunity.com/) (homepage “Upcoming events”):

- **Title:** Simplify building your tech stack with AI
- **Format:** In-Person · Dhaka
- **Time:** 4:00 PM – 7:00 PM GMT+6
- **Date:** August 29, 2026

**UNKNOWN from that listing:** street address, RSVP URL, capacity, whether the 3-hour window is the entire hackathon or a kickoff, whether remote submissions are allowed, and whether judging happens after the event.

The participant guide is framed as a **30-minute** “init to deploy” workshop, not a multi-day contest. [projects.dev/hackathon-participants](https://projects.dev/hackathon-participants)

### 1.2 Rules and required tech (participant guide)

Source: [projects.dev/hackathon-participants](https://projects.dev/hackathon-participants)

**Requirements before the workshop:**

- A laptop (explicitly: “this workshop cannot be done on a phone or tablet”)
- An agentic IDE (Cursor, Kiro) or a terminal-based tool (Claude Code)
- A terminal/shell to install the Stripe CLI
- **A Stripe account (“free, no business required”)** — created during the guide if needed

**Required Stripe surface:** **Stripe Projects** (CLI plugin), not a named Payments/Billing/Connect product list.

Stripe Projects is described as spinning up full-stack apps with pre-configured providers (databases, auth, AI, and more). It “handles account provisioning, environment variables, and wiring.” Critically:

> “Think of it as a composable app starter that connects **real services — not mock APIs** — and gives you production-ready credentials from the start.”

That sentence is about **Projects providers** (Vercel, Supabase, OpenRouter, …), not about whether Stripe *Payments* may use test mode.

**Setup steps the guide requires:**

1. `npx skills add https://docs.stripe.com`
2. Install Stripe CLI + `projects` plugin; verify `stripe projects --help`
3. `stripe projects init` (can open a browser flow to create a Stripe account)
4. Build with the CLI cheat sheet (`catalog`, `add`, `env --pull`, `spend`, `whoami`, `share`)
5. **Deploy** to a hosting provider **or** submit a library to a registry such as npm — required in order to add the project to the leaderboard

**Official example ideas** (all doable in ~30 minutes with Projects):

- AI chat with memory: OpenRouter + Supabase + Vercel
- Voice-narrated blog: Netlify + ElevenLabs + Turso
- Real-time analytics dashboard: Railway + Neon + PostHog + Cloudflare KV
- Web scraper with search: Firecrawl + Upstash Vector + Algolia + Cloudflare Workers
- Team task board: Clerk + Railway Postgres + Inngest + Vercel
- AI image gallery: Hugging Face + Cloudflare R2 + Neon + Sentry

The first example is the same stack Stacksmith itself uses (OpenRouter + Supabase + Vercel).

**Official example prompts** tell the agent to “Use only free tier services” in one sample.

**UNKNOWN:** a written code of conduct, IP assignment, team-size limit, or “must use product X” rule beyond Projects + deploy + leaderboard.

### 1.3 Submission requirements

Same source: [projects.dev/hackathon-participants](https://projects.dev/hackathon-participants) step 8.

1. `stripe whoami` — Stripe account ID (`acct_…`) required for the leaderboard
2. `stripe projects share` — share link encoding the stack
3. Leaderboard **Submit Your Project**: paste share link, **public repo**, and **deployed URL**
4. **Hackathon code** field if the organizer provided one (case-sensitive)

Stacksmith’s README records the Dhaka code as **`stripe-dhaka-aievent2026`**. That string is **not** printed on the participant guide itself; it appears in [local README](/Users/adibahsan/dev/Github/stripe_community/stacksmith/README.md) and the public GitHub README. The leaderboard **does** expose a filter named “Stripe Dhaka AI Event 2026”, which is independent confirmation that this code’s event exists on Stripe’s leaderboard. [projects.dev/leaderboard](https://projects.dev/leaderboard)

### 1.4 Judging criteria

**UNKNOWN.** No judging rubric, scorecard, or “winners announced by …” text appears on:

- [projects.dev/hackathon-participants](https://projects.dev/hackathon-participants)
- [projects.dev/leaderboard](https://projects.dev/leaderboard)
- [stripecommunity.com](https://www.stripecommunity.com/)
- [docs.stripe.com/projects](https://docs.stripe.com/projects)

What *is* first-party: the leaderboard is “Discover, **upvote**, and share the projects developers have built with Stripe Projects,” with a numeric **Votes** column. Whether votes are the official judging mechanism, or only a gallery, is **UNKNOWN**.

### 1.5 Prize structure

**UNKNOWN for the Dhaka / Community event.** None of the participant guide, leaderboard, or community event listing names prizes.

**Separate** (do not conflate with Dhaka): [projects.dev](https://projects.dev/) advertises a CLI contest:

- Prizes named: “a Mac Mini, openclaw, and Stripe Projects credits”
- How to enter: install Stripe Projects → `stripe projects init` → slash command `/contest` inside the CLI
- “The email associated with your Stripe account will be entered”
- “10 total winners will be randomly chosen”
- “Read more about the rules and terms” — the linked terms document was **not retrieved** in this research (**UNKNOWN** full legal terms, eligibility countries, dates)

That contest is a **random drawing**, not a judged hackathon.

### 1.6 Mock / test-mode Stripe vs live

| Question | Primary-source answer |
| --- | --- |
| Must Projects providers be real (not stubbed)? | Yes — “real services — not mock APIs” and “production-ready credentials.” [hackathon-participants](https://projects.dev/hackathon-participants) |
| Must the app take **live** card payments? | **Not stated.** The guide never requires Checkout, Billing, or live keys. |
| Is a fully activated live merchant account required to start? | Guide: Stripe account is “free, **no business required**.” [hackathon-participants](https://projects.dev/hackathon-participants) Account-activation docs: after creating an account you can **test in a sandbox**; live services require business verification. [docs.stripe.com/get-started/account/activate](https://docs.stripe.com/get-started/account/activate) |
| Stacksmith’s documented signup path | Register at [dashboard.stripe.com/register](https://dashboard.stripe.com/register), add a business name, **skip additional information**, click **Go to sandbox**, note `acct_***`. [stacksmith/README.md](/Users/adibahsan/dev/Github/stripe_community/stacksmith/README.md) |

**UNKNOWN:** whether organizers will reject a submission that never calls the Stripe Payments API at all (Stacksmith itself does not — see §2). **UNKNOWN:** whether a purely local fake of Stripe JSON (no `sk_test_` / sandbox) is allowed. The official testing path is sandbox/test keys, not a home-grown mock.

### 1.7 Geographic restrictions

**UNKNOWN** as a published eligibility rule. The participant guide does not list countries. Stripe Community is “Open to all—no Stripe account required” for **joining communities**. [stripecommunity.com](https://www.stripecommunity.com/)

The Dhaka event listing is in-person in Dhaka. Whether only attendees may submit, or anyone with the hackathon code may, is **UNKNOWN**.

Practical geographic constraint is **product availability**, not a contest ToS clause: Bangladesh is not a standard Stripe merchant country (see §4).

---

## 2. Stacksmith

### 2.1 What it is

Stacksmith is an AI tool: one-sentence app idea in → architecture plan for the **Stripe Projects CLI** out (recommended providers, reasons, exact `stripe projects add` commands, starter `.env` map). Anonymous generate; optional login to save history.

Primary descriptions:

- [github.com/sumonmselim/stacksmith](https://github.com/sumonmselim/stacksmith) (public)
- [local clone README](/Users/adibahsan/dev/Github/stripe_community/stacksmith/README.md)
- Leaderboard row: “stacksmith by sumonmselim — Describe your app in one sentence, get a provisioned architecture plan for the Stripe Projects CLI.” (4 votes at fetch time). [projects.dev/leaderboard](https://projects.dev/leaderboard)

**Not** in `github.com/stripe`: `https://github.com/stripe/stacksmith` returns **404**. It is a community project, not a Stripe-org repo.

Local git remotes this workspace to `git@github.com:adibahsan/stacksmith.git` ([`stacksmith/.git/config`](/Users/adibahsan/dev/Github/stripe_community/stacksmith/.git/config)). CONTRIBUTING still points issues at `github.com/sumonmselim/stacksmith`. [CONTRIBUTING.md](/Users/adibahsan/dev/Github/stripe_community/stacksmith/CONTRIBUTING.md)

**Live demo (as documented):** https://stacksmith-seven.vercel.app  
**Share URL (as documented):** https://projects.dev/s#v1:OpenRouter~api,Supabase~project,Vercel~project  
**License:** MIT, copyright 2026 Muhammad Sumon Molla Selim. [LICENSE](/Users/adibahsan/dev/Github/stripe_community/stacksmith/LICENSE)

### 2.2 Stripe products it uses

**It does not use Stripe Payments, Billing, Connect, Identity, Radar, Issuing, Climate, or Stripe Apps.**

Evidence:

- [`package.json`](/Users/adibahsan/dev/Github/stripe_community/stacksmith/package.json) has no `stripe` SDK — only Next.js, React, `@supabase/supabase-js`.
- [`app/api/generate/route.ts`](/Users/adibahsan/dev/Github/stripe_community/stacksmith/app/api/generate/route.ts) calls **OpenRouter** `https://openrouter.ai/api/v1/chat/completions`. The system prompt is “expert cloud architect for the Stripe Projects CLI.”
- Runtime stack provisioned via Projects: `openrouter/api`, `vercel/hobby` + `vercel/project`, `supabase/free` + `supabase/project`. [README](/Users/adibahsan/dev/Github/stripe_community/stacksmith/README.md)

**Stripe surface that *is* used:** Stripe **Projects CLI** as the provisioning and submission path (`init`, `add`, `share`, `whoami`), plus a Stripe **account** for CLI login / leaderboard.

### 2.3 The “inspiration” angle — how it showcases Stripe for developers

This is the first-party story, assembled from Stripe’s own workshop copy plus the project:

1. **Stripe Projects is the product being demoed**, not card checkout. Official Projects docs: provision third-party services from the terminal; credentials sync to `.env`; billing through Stripe. [docs.stripe.com/projects](https://docs.stripe.com/projects)
2. **The workshop’s first example idea is this exact stack** (OpenRouter + Supabase + Vercel). [hackathon-participants](https://projects.dev/hackathon-participants)
3. **Meta-tooling:** the app *teaches* `stripe projects add` by generating real catalog slugs. Catalog is embedded from Projects docs. [`lib/catalog.ts`](/Users/adibahsan/dev/Github/stripe_community/stacksmith/lib/catalog.ts)
4. **Agent-native workflow:** README is a step-by-step log (init → add providers → agent prompt → deploy → `share` + hackathon code) matching the participant guide’s “tell your agent” style.
5. **Free-tier path:** README reports **€0** on free tiers — aligned with the official sample prompt “Use only free tier services.”
6. **Stripe DevRel’s own Projects narrative** is the same pattern: use Projects to ship a real app (leaderboard, transcription tool) for community/hackathon use, without the app itself needing to charge cards. [stripe.dev/blog/integrating-services-with-agents-stripe-projects](https://stripe.dev/blog/integrating-services-with-agents-stripe-projects); [projects.dev/blog/building-with-agents-stripe-projects](https://projects.dev/blog/building-with-agents-stripe-projects/) (originally on stripe.dev; dated April 29, 2026)

Stripe DevRel (Anna Spysz) wrote that they built the **leaderboard** “to catalog and showcase open-source projects, and maybe add a competitive element to it **for future hackathons**.” That is official inspiration for *what the venue rewards*: shipped Projects-provisioned apps on a public leaderboard — not live GMV.

**UNKNOWN:** whether organizers named Stacksmith as an official “inspiration project.” It is a leaderboard entry and a public how-to for this event, not a Stripe-maintained template in [github.com/stripe/projects-templates](https://github.com/stripe/projects-templates).

---

## 3. What can be demoed without a live Bangladesh merchant account

Official testing environment: **sandboxes** (isolated; card networks do not process payments). [docs.stripe.com/sandboxes](https://docs.stripe.com/sandboxes); [docs.stripe.com/testing](https://docs.stripe.com/testing); [docs.stripe.com/keys](https://docs.stripe.com/keys)

Test keys: `pk_test_`, `sk_test_`, `rk_test_`. Live keys: `pk_live_`, `sk_live_`, `rk_live_`. Objects do not cross modes.

### 3.1 Path that does not require a pre-existing Stripe account

`stripe sandbox create` provisions a sandbox with working test API keys **without requiring an account**. Temporary credentials; **expires in 7 days**; `stripe sandbox claim` converts to a full account. [docs.stripe.com/cli/sandbox](https://docs.stripe.com/cli/sandbox); same note on [docs.stripe.com/sandboxes](https://docs.stripe.com/sandboxes) (“No account registration required” for coding agents).

Claiming still uses Dashboard onboarding (`claim_url` on `dashboard.stripe.com`). Whether a Bangladesh user can **claim** (vs only use the 7-day anonymous sandbox) is **UNKNOWN** from docs.

### 3.2 Product matrix (test/sandbox vs live)

| Product | Fully demoable with test/sandbox keys? | Needs live / activated merchant / specific country? |
| --- | --- | --- |
| **Payments** (PaymentIntents, Checkout, test cards e.g. `4242…`) | Yes. Test cards; no real money. [testing](https://docs.stripe.com/testing) | Live keys + activated account to take real payments. [keys](https://docs.stripe.com/keys); [activate](https://docs.stripe.com/get-started/account/activate) |
| **Stripe CLI** `listen` / `trigger` / **fixtures** | Yes. Default is test mode (`--live` opt-in). [cli/trigger](https://docs.stripe.com/cli/trigger); [cli/fixtures](https://docs.stripe.com/cli/fixtures); [cli/listen](https://docs.stripe.com/cli/listen); [stripe-cli/triggers](https://docs.stripe.com/stripe-cli/triggers) | Live webhooks only if you pass `--live` and have live endpoints |
| **Billing** (subscriptions, invoices, **test clocks**) | Yes in a sandbox, including advancing time. [billing/testing](https://docs.stripe.com/billing/testing) | Live customer charges need live mode + activation |
| **Connect** | Test connected accounts, test OAuth `client_id`, verification **tokens** (DOB `1901-01-01`, `000000000` ID, etc.). [connect/testing](https://docs.stripe.com/connect/testing) | Sandboxes “might not enforce some capabilities.” Live Connect needs a **platform in a supported country**. Express platforms listed do **not** include Bangladesh. [connect/express-accounts](https://docs.stripe.com/connect/express-accounts). BD appears under Connect **connected-account** countries as **preview**, not as a platform country. [connect/how-connect-works](https://docs.stripe.com/connect/how-connect-works) |
| **Identity** | Test-mode API: “If your API key is in test mode, **verification checks won’t actually process**, though everything else will occur as if in live mode.” [VerificationSession create](https://docs.stripe.com/api/identity/verification_sessions/create). Keys doc: “Identity doesn’t perform any verification checks” in sandboxes. [keys](https://docs.stripe.com/keys) | **Merchant availability** list (AT, AU, BE, … US — **no BD**). [docs.stripe.com/identity](https://docs.stripe.com/identity) |
| **Radar** | Test cards for `highest` / `elevated` risk in a sandbox. [radar/testing](https://docs.stripe.com/radar/testing) | Rule-impact estimates search **historical live mode** payments. [radar/testing](https://docs.stripe.com/radar/testing) |
| **Issuing** | Issue test cards; **test_helpers** simulate authorizations (cannot be used for external purchases). [issuing/testing?testing-method=with-code](https://docs.stripe.com/issuing/testing?testing-method=with-code); [test_helpers API](https://docs.stripe.com/api/issuing/authorizations/test_mode_create) | **Commercial Issuing live:** United States, United Kingdom, EEA. Consumer Issuing: US. Stablecoin-backed programs: 30+ countries in LATAM, Caribbean, Africa — **Bangladesh not named**. [docs.stripe.com/issuing](https://docs.stripe.com/issuing) |
| **Climate** | Quickstart uses test cards (`4242…`) and example order JSON has `"livemode": false`. [climate/orders/quickstart](https://docs.stripe.com/climate/orders/quickstart); [Climate Order create](https://docs.stripe.com/api/climate/order/create) | Live orders deduct from **Stripe balance** in live mode. [Climate Order create](https://docs.stripe.com/api/climate/order/create) |
| **Stripe Apps** | Local preview: `stripe apps start` against a **sandbox** (recommended for first-time setup). [stripe-apps/create-app](https://docs.stripe.com/stripe-apps/create-app). Sandbox install support is a documented app feature. [enable-sandbox-support](https://docs.stripe.com/stripe-apps/enable-sandbox-support) | **Marketplace publish** requires an **activated** account with verified email and business details. Connect platforms cannot publish. [create-app](https://docs.stripe.com/stripe-apps/create-app) |
| **Stripe Projects** | Needs a Stripe account + CLI login (`init` can create one). Free-tier providers exist. [hackathon-participants](https://projects.dev/hackathon-participants); [docs.stripe.com/projects](https://docs.stripe.com/projects) | Paid provider upgrades: `stripe projects billing add`. [projects.dev/llms.txt](https://projects.dev/llms.txt). Local Projects skill documents `ACCOUNT_NOT_ELIGIBLE` = “Account not onboarded for Projects.” [stacksmith skill](/Users/adibahsan/dev/Github/stripe_community/stacksmith/.agents/skills/stripe-projects-cli/SKILL.md) |

### 3.3 What “mock Stripe” should mean for this hackathon

**Official mock = Stripe’s sandbox/test helpers**, not a handwritten stub of `api.stripe.com`.

Use:

- Test publishable/secret keys
- Test cards and PaymentMethod tokens (`pm_card_visa`, Radar/Issuing test helpers)
- `stripe trigger` / `stripe fixtures` to generate real test objects and webhook deliveries
- `stripe listen --forward-to` for local webhook demo
- Billing **test clocks** for subscription time travel

Do **not** stub Vercel/Supabase/OpenRouter if you are playing by the participant guide — those must be real Projects-provisioned services.

**UNKNOWN:** whether a UI that plays back recorded Stripe JSON without ever calling Stripe is acceptable to organizers.

---

## 4. Bangladesh constraints (official)

### 4.1 Merchant / “supported countries” list

Canonical marketing page: [stripe.com/global](https://stripe.com/global) — “Stripe is currently supported in the following countries/regions, with more to come.” The country **grid is not present in the static HTML fetch** used for this research (client-rendered). **UNKNOWN:** the complete merchant-country list as a citable enumerated set from that page in this pass.

First-party facts that **do** pin Bangladesh:

| Source | What it says about BD |
| --- | --- |
| [docs.stripe.com/payouts](https://docs.stripe.com/payouts) | Bank-test section **“Bangladesh (BD)”**: “**Bangladesh is only available for Cross-border payouts accounts.**” (recipient bank details for platforms paying *into* BD, not “open a merchant account in BD”) |
| [docs.stripe.com/connect/how-connect-works](https://docs.stripe.com/connect/how-connect-works) | `BD` is under **“Available in preview”** for **connected-account** country availability — not in the main connected-account list, and **not** described as a platform/merchant country |
| [docs.stripe.com/connect/express-accounts](https://docs.stripe.com/connect/express-accounts) | Express **platform** countries listed (AU, AT, … US, etc.) — **Bangladesh absent** |
| [docs.stripe.com/identity](https://docs.stripe.com/identity) | “Available for users in” a list of ISO codes — **BD absent** |
| [docs.stripe.com/tax/supported-countries/asia-pacific/collect-tax](https://docs.stripe.com/tax/supported-countries/asia-pacific/collect-tax.md?tax-jurisdiction-asia-pacific=bangladesh) | Stripe Tax can calculate **VAT on digital products sold *to* Bangladeshi customers** by **remote sellers without physical presence** — customer jurisdiction, not BD merchant onboarding |
| [docs.stripe.com/changelog/basil/2025-04-30/additional-tax-registration-countries](https://docs.stripe.com/changelog/basil/2025-04-30/additional-tax-registration-countries) | Tax Registration API country `bd` added — again tax, not Payments merchant |

**Conclusion that is supported:** Bangladesh is **not** documented as a country where you activate a standard Stripe merchant account and receive local Stripe payouts as the business of record. It **is** documented as (a) a **cross-border payout destination**, (b) a **preview** Connect connected-account country, (c) a **Tax** customer jurisdiction for digital goods.

**UNKNOWN:** the exact Dashboard error copy when a user in Bangladesh tries to select BD as business country at signup (not published as a static doc).

### 4.2 Does test mode work globally?

Docs do **not** geofence sandbox API keys by merchant country. Sandboxes exist to test “without affecting your live integration”; payments in a sandbox are not processed by card networks. [sandboxes](https://docs.stripe.com/sandboxes); [testing](https://docs.stripe.com/testing)

Anonymous `stripe sandbox create` does not require prior registration. [cli/sandbox](https://docs.stripe.com/cli/sandbox)

**UNKNOWN:** whether Stripe blocks Dashboard registration or sandbox claim from Bangladeshi IPs. Not stated in the docs cited here.

After live activation, “you can’t change the business origin country.” [activate](https://docs.stripe.com/get-started/account/activate)

### 4.3 Official workarounds (not “fake a BD merchant”)

1. **Stay in sandbox / test keys** for any Payments/Billing/Connect/Issuing/Radar/Climate/Identity *demo* (with Identity’s documented limitation that checks do not actually run).
2. **Stripe Projects + free tiers** with a Stripe account created as the workshop describes (“no business required”) — this is how Stacksmith was submitted from this event’s own README.
3. **`stripe sandbox create`** if you cannot complete Dashboard signup yet (7-day clock).
4. **Stripe Atlas** — incorporate a US company “from anywhere in the world” per [stripe.com/global](https://stripe.com/global); Atlas site: “Startups in over **175 countries**.” [stripe.com/atlas](https://stripe.com/atlas). Docs cover **non-US founders** (83(b), ITIN). [atlas/83b-elections-non-us-founders](https://docs.stripe.com/atlas/83b-elections-non-us-founders). **UNKNOWN:** whether Bangladesh is inside the “175 countries” (no Atlas country table retrieved). Atlas is a **legal/entity** path, not a hackathon requirement, and costs USD 500 per [atlas/signup](https://docs.stripe.com/atlas/signup) — not a same-day demo tactic.
5. **Connect cross-border payouts** — a *platform in a supported country* paying a BD recipient. [payouts](https://docs.stripe.com/payouts); [cross-border-payouts](https://docs.stripe.com/connect/cross-border-payouts). That requires a supported-country **platform**, which a BD-only competitor does not have.

---

## 5. Winning / notable patterns (official recaps only)

**No first-party recap** was found that names winners of a “Stripe Community Hackathon 2026,” a Stripe Sessions 2026 hackathon, or a scored Stripe Sessions contest.

What official sources *do* show:

| Pattern | Source |
| --- | --- |
| Leaderboard **upvote** ranking of Projects apps (Auth0×Stripe, Vercel Ship NYC, RevenueCat Shipaton, Privy, **Stripe Dhaka AI Event 2026**, Stripe Stablecoins Sept 2026 filters) | [projects.dev/leaderboard](https://projects.dev/leaderboard) |
| High-vote entries (at fetch) mix **Checkout**, **Auth0 + Stripe**, marketplaces, and Projects-only tools — **not a published rubric** | Same page (descriptions in the table) |
| Stacksmith is on that board (4 votes at fetch) | Same page |
| DevRel built the leaderboard **for future hackathons**; friction was auth/rate limits, not live charges | [stripe.dev blog](https://stripe.dev/blog/integrating-services-with-agents-stripe-projects) |
| DevRel “init to deploy” story: Next.js + Projects + OpenRouter + Vercel, **no Payments API** | [projects.dev/blog/building-with-agents-stripe-projects](https://projects.dev/blog/building-with-agents-stripe-projects/) |
| Sessions 2026 is a **conference** (e.g. Apr 29–30, 2026 on [sessions-2026.vercelapp.stripe.dev](https://sessions-2026.vercelapp.stripe.dev/)), not a documented public hackathon with winners | Stripe Sessions pages |
| Internal Stripe hackathons (employee “People”/Home directory) are **not** community contests | [stripe.com/blog/stripe-home](https://stripe.com/blog/stripe-home) |

**UNKNOWN:** who won Dhaka 2026, prize amounts, or Sessions-attached hackathon winners — no official recap located.

---

## 6. Implications for a mocked-Stripe prototype (constraints + opportunities)

Use this as the competitor’s decision frame. Citations are in the sections above.

**Constraints**

1. The official playbook is **Stripe Projects** (real provider credentials, deploy, `share`, public repo, `acct_` id). A Payments-only mock that never runs `stripe projects` is off-script.
2. “Not mock APIs” applies to **Vercel/Supabase/OpenRouter/etc.** Stubbing those is against the written guide.
3. Bangladesh is **not** a documented standard merchant country; **live** charges, Issuing programs, Identity-as-merchant, and Connect-as-platform are the wrong demo.
4. Identity in test mode **does not actually verify**; demo the flow/UI, not KYC truth.
5. Issuing **live** is US/UK/EEA (plus named stablecoin regions) — use **test_helpers** only.
6. Publishing a Stripe App to the **Marketplace** needs an activated business account.
7. Anonymous sandboxes **expire in 7 days** unless claimed.
8. Dhaka **judging and prizes are unpublished** — optimizing for a secret scorecard is speculation; the only public ranking is **leaderboard votes**.
9. The in-person listing is a **3-hour** window; the workshop text is **30 minutes** to deploy. Scope accordingly.
10. `ACCOUNT_NOT_ELIGIBLE` exists as a Projects CLI error (“Account not onboarded for Projects”) — a possible gate even after sandbox keys exist.

**Opportunities (aligned with official sources)**

1. **Copy Stacksmith’s legal move:** sandbox account, Projects free tiers, ship a developer tool that *explains or operates* Stripe Projects — no BD merchant needed.
2. **Or** add a **sandbox Payments/Billing** slice (Checkout + test clocks + `stripe trigger`) on top of a Projects-provisioned app — still no live account.
3. Match the **official example ideas** (AI + memory, voice, analytics) so the demo is recognizable to organizers using the same guide.
4. Submit with **`stripe-dhaka-aievent2026`**, public GitHub, live URL, `stripe projects share`.
5. Prefer **test helpers and CLI fixtures** over a fake Stripe server — that *is* Stripe’s documented mock.
6. If Dashboard signup fails: try **`stripe sandbox create`** for a time-boxed test keypair.
7. Differentiation vs Stacksmith: Stacksmith does **not** call Stripe APIs; a competitor who shows **sandbox Checkout + webhooks + Billing test clocks** (still test mode) showcases more of the Stripe *platform* while remaining geo-legal.

---

## 7. Source index

### Stripe / Projects / Community (first-party web)

- https://www.stripecommunity.com/
- https://www.stripecommunity.com/pages/become-a-stripe-community-builder-7n04o9
- https://stripe.com/gb/guides/become-a-stripe-community-builder
- https://projects.dev/
- https://projects.dev/hackathon-participants
- https://projects.dev/leaderboard
- https://projects.dev/llms.txt
- https://projects.dev/blog/building-with-agents-stripe-projects/
- https://docs.stripe.com/projects
- https://docs.stripe.com/sandboxes
- https://docs.stripe.com/testing
- https://docs.stripe.com/keys
- https://docs.stripe.com/cli/sandbox
- https://docs.stripe.com/cli/trigger
- https://docs.stripe.com/cli/fixtures
- https://docs.stripe.com/cli/listen
- https://docs.stripe.com/get-started/account/activate
- https://docs.stripe.com/billing/testing
- https://docs.stripe.com/connect/testing
- https://docs.stripe.com/connect/how-connect-works
- https://docs.stripe.com/connect/express-accounts
- https://docs.stripe.com/connect/cross-border-payouts
- https://docs.stripe.com/payouts
- https://docs.stripe.com/identity
- https://docs.stripe.com/api/identity/verification_sessions/create
- https://docs.stripe.com/radar/testing
- https://docs.stripe.com/issuing
- https://docs.stripe.com/issuing/testing?testing-method=with-code
- https://docs.stripe.com/api/issuing/authorizations/test_mode_create
- https://docs.stripe.com/climate
- https://docs.stripe.com/climate/orders/quickstart
- https://docs.stripe.com/api/climate/order/create
- https://docs.stripe.com/apps
- https://docs.stripe.com/stripe-apps/create-app
- https://docs.stripe.com/stripe-apps/enable-sandbox-support
- https://docs.stripe.com/tax/supported-countries/asia-pacific/collect-tax.md?tax-jurisdiction-asia-pacific=bangladesh
- https://docs.stripe.com/changelog/basil/2025-04-30/additional-tax-registration-countries
- https://stripe.com/global
- https://stripe.com/atlas
- https://docs.stripe.com/atlas
- https://docs.stripe.com/atlas/signup
- https://docs.stripe.com/atlas/83b-elections-non-us-founders
- https://stripe.dev/blog/integrating-services-with-agents-stripe-projects
- https://sessions-2026.vercelapp.stripe.dev/
- https://stripe.com/blog/stripe-home
- https://dashboard.stripe.com/register

### GitHub (first-party / project)

- https://github.com/sumonmselim/stacksmith
- https://github.com/stripe/projects-templates
- https://github.com/stripe/projects-template-registry
- https://github.com/stripe/stacksmith — **404** (not a Stripe org repo)

### Local workspace

- `/Users/adibahsan/dev/Github/stripe_community/stacksmith/README.md`
- `/Users/adibahsan/dev/Github/stripe_community/stacksmith/package.json`
- `/Users/adibahsan/dev/Github/stripe_community/stacksmith/app/api/generate/route.ts`
- `/Users/adibahsan/dev/Github/stripe_community/stacksmith/lib/catalog.ts`
- `/Users/adibahsan/dev/Github/stripe_community/stacksmith/CONTRIBUTING.md`
- `/Users/adibahsan/dev/Github/stripe_community/stacksmith/LICENSE`
- `/Users/adibahsan/dev/Github/stripe_community/stacksmith/.agents/skills/stripe-projects-cli/SKILL.md`
- `/Users/adibahsan/dev/Github/stripe_community/stacksmith/.git/config`
