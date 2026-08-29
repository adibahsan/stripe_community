# Batti Electric Wayfinding design

**Date:** 2026-08-29  
**Status:** Approved in design interview; expanded after Ask Batti shipped  
**Audience:** Dhaka Crowd, mobile-first

## Purpose

Redesign the full Crowd board and Ask Batti surface as one **Electric Wayfinding** system: bold bilingual typography, lamp amber, route-line geometry, map-first blocks, and restrained status motion — without reopening Status, Seed, Eta, Halo, Forecast, or Report semantics.

## Product locks (unchanged)

- Live look = Dhaka clock + this month’s Seed + Crowd on top. Stamp **Sample pattern**.
- Status = 30-minute majority; Unsure does not vote; Stale when empty.
- Map Predictor = per-Area Eta from the month curve.
- Halos = large Circles (pulse On, dark Off, grey Stale); `prefers-reduced-motion` honored.
- Forecast remains deterministic theater + canned Advice.
- Ask Batti streams Guidance; Report drafts require one Confirm; no automatic submission.
- Deploy runtime: Vercel App Router `/api/assistant`. No DESCO, Admin, GeoJSON, or trained model.

## Information hierarchy

Mobile (primary):

1. Brand + language toggle + Sample pattern stamp
2. Selected Area Status → Eta “power route”
3. Map / List segmented control + Forecast
4. Map stage (or Area list)
5. Persistent Report dock
6. Ask Batti launcher, collision-free above the dock

Desktop: two-pane enhancement — map/stage dominant, selected Area + dock beside or below. Forecast and Ask Batti become mutually exclusive side panels (never stacked).

## Visual identity

- **Direction:** Electric Wayfinding (Dhaka transit/signage + electricity status).
- **Themes:** adaptive system light/dark via `prefers-color-scheme`.
  - Light: warm paper, deep indigo ink, crisp map.
  - Dark: night indigo (not pure black), lamp amber accent.
- **Semantics:** On green, Off vermilion, Stale slate — always with text/icon, never color alone.
- **Type:** Tektur for brand/data moments; Bangla-capable sans (e.g. Noto Sans Bengali + Outfit or similar via `next/font`) for UI in both locales.
- **Motion:** Halos, panel enter/exit, press feedback only; transform/opacity; reduced-motion first-class.
- **Signature:** Status → Eta → Report route line / wayfinding marker.

## Bilingual coverage

- Persistent English / বাংলা toggle, stored in `localStorage`.
- Translate all chrome: header, toolbar, dock, Forecast, Advice, Ask Batti chrome, examples, privacy, draft card, fallback, counters, stamps.
- Area display names localize; Area IDs stay English slug keys.
- Model-generated Guidance stays in the model’s mirrored input language (not re-translated by the UI).
- Invalid stored/browser locale falls back to English.

## Accessibility

- 44px minimum touch targets; visible focus rings; 4.5:1 text contrast in both themes.
- Forecast and Ask Batti: Escape closes, focus enters on open, returns to trigger on close.
- List view remains the keyboard-friendly geographic alternative.
- `aria-live` for Report confirmation and Assistant streaming.
- Color never sole status cue.

## Non-goals

- UI framework, animation library, new map tile provider, manual theme picker.
- Voice input, persistent Assistant history, landmark inference, general chat.
- Changing Status/Seed/Eta/Forecast/Report persistence semantics.
