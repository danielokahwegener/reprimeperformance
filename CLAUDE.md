# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

RePrime Performance is a German-language sales funnel for an online Performance Concierge business targeting former club athletes (ex-Sportler). It is a static HTML/CSS/JS site with a Cloudflare Worker backend. There is no build system or bundler for the frontend.

## Funnel page sequence

```
index.html → bewerbung.html → (manual qualification by Daniel) → termin.html → bestaetigung.html → zahlung.html → danke-zahlung.html
```

Each page also has a standalone CSS file if it needs page-specific styles (e.g. `css/quiz.css`, `css/zahlung.css`).

**Note:** quiz.html, results.html, and anmeldung.html are kept in place but are retired from the primary acquisition flow. The quiz is no longer the primary CTA. `bewerbung.html` is the new application form page (Section 2.10 fields).

## Athlete archetypes

The quiz scores answers and assigns one of five archetypes stored in `window.FDA.ARCHETYPEN` in `js/quiz-engine.js`:

| Key | Name |
|-----|------|
| V | Der Vollgassportler |
| T | Das Teamkind |
| R | Der Rost-Veteran |
| M | Der Metabolismus-Schock |
| L | Der Leistungsblockierte |

Each archetype has MailerLite group IDs defined in `worker/index.js` (`ML_GROUPS`).

## Frontend JS architecture

Three scripts are loaded as plain globals (no ES modules, no bundler). Order matters:

1. `js/quiz-engine.js` — defines `window.FDA`: archetypes, questions, scoring, localStorage helpers
2. `js/quiz-ui.js` — DOM rendering and navigation for the quiz, runs after quiz-engine.js
3. `js/email-capture.js` — calls the Cloudflare Worker to subscribe to MailerLite; sets `window.FDA.WORKER_URL`

`quiz-engine.js` is also loaded by `index.html` to populate the archetype tabs on the landing page.

## CSS architecture

- `css/base.css` — design tokens (CSS variables), reset, layout primitives, shared header/footer
- `css/components.css` — buttons, badges, form elements shared across pages
- Page-specific CSS files (`css/quiz.css`, `css/termin.css`, `css/zahlung.css`) — imported only on the relevant page

**Design token note:** The variable `--gold` is actually red (`#CC1111`), not gold. The color palette is black/silver/red. Do not rename this variable.

## Cloudflare Worker (backend)

Located in `worker/`. Proxies MailerLite API calls server-side and manages session tokens via Cloudflare KV.

**Endpoints:**
- `POST /api/subscribe` — email capture from results.html; returns `{ token }` for the next step
- `POST /api/platz-sichern` — consumes token, tags subscriber in MailerLite
- `POST /api/booking-stop` — tags subscriber as "Termin gebucht" after Calendly redirect

**Worker commands (run from `worker/` directory):**
```bash
npm run dev      # local dev server via wrangler
npm run deploy   # deploy to Cloudflare (wrangler deploy)
```

**Secrets (set via `wrangler secret put`):** `MAILERLITE_API_KEY`, `PLATZ_GESICHERT_GROUP_ID`, `GEBUCHT_GROUP_ID`. Never stored in files.

**KV namespace:** `SESSIONS` — stores `token → email` with 1-hour TTL. Namespace ID is in `worker/wrangler.toml`.

## Development workflow

The frontend is static files - open any HTML file directly in a browser, or use any static file server. No build step required.

To test the full email flow locally, run `npm run dev` in `worker/` and update `window.FDA.WORKER_URL` in `js/email-capture.js` to point to `localhost`.

## Copy rules

- All user-facing copy is in German (de)
- Never use em-dashes (—) in copy. Use a hyphen with spaces ( - ) or rephrase
- Tone is direct, empathetic, and sports-specific
- The service is a "Performance Concierge" - not coaching. Use "Performance Concierge Service" as the service descriptor wherever copy currently says "Online-Coaching-Service" or "1-zu-1-Coaching" in branding positions.

## External integrations

- **MailerLite** — email marketing and subscriber segmentation
- **Calendly** — appointment booking (embedded on `termin.html` via lazy-load in `js/calendly-lazy.js`)
- **Stripe** — payments on `zahlung.html`
- **Notion / Google Drive** — operational docs (see `operations/` and `texte/` folders)

## Operations and content docs

- `operations/` — SOPs, client journey map, pricing, CRM design, automation workflows
- `texte/` — copy strategy, sales scripts, ad templates
