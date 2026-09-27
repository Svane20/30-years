# Kasper & Mette's 30th Birthday Invitation — Design

**Date:** 2026-09-27
**Status:** Approved in brainstorming, awaiting spec review

## 1. Purpose

A one-page invitation website for Kasper and Mette's joint 30th birthday. It is
shared as a link with about 60 guests, who will mostly open it on their phones.

**Success means a guest can, within a minute:**

1. see photos of the couple,
2. know when and where the party is and find it on a map,
3. open one of three wish lists,
4. tell the hosts whether they are coming.

The hosts collect all responses in one Google Sheet.

**Language:** Danish (`da-DK`), like the wedding site (github.com/Svane20/wedding-site),
which served as inspiration.

## 2. Scope

**In scope:** header, hero photo slideshow, invitation details with a live
countdown, embedded Google Map, three wish list cards, RSVP form saved to Google
Sheets, footer, CI, and GitHub Pages deployment.

**Out of scope:** background music, a separate gallery page, an admin view of
responses (the Google Sheet is the admin view), translations, and a custom domain.

**Content to be filled in later:** date, time, venue, address, map URLs, RSVP
deadline, RSVP endpoint, photos, and wish list texts and URLs. Everything is built
with placeholders from a single config file (§4), so filling in the real details
never touches a template.

## 3. Visual design

A hybrid of two directions explored in brainstorming: **the playful layout of
"Warm & playful"** in **the colours of "Champagne night"**.

| Token | Value | Use |
|---|---|---|
| `--navy` | `#14161f` | Page background |
| `--navy-alt` | `#1b1e2a` | Alternating section background |
| `--gold` | `#c9a86a` | Headings, accents, primary buttons |
| `--gold-line` | `rgba(201,168,106,.3)` | Card and input borders |
| `--cream` | `#e9e3d6` | Body text |
| `--polaroid` | `#f5efe3` | Polaroid frames |

- **Headings and display type:** Fraunces (600/800, italic 500 for the footer).
- **Body and UI:** DM Sans (400/500/700). Both come from Google Fonts. The Great
  Vibes and Roboto imports currently in `styles.scss` are replaced.
- **Shapes:** rounded cards (about 14px radius), pill buttons, and tilted polaroid
  frames with soft shadows.
- **Mobile first:** designed at 390px and enhanced at wider widths (breakpoint
  around 860px, as in the existing header).

## 4. Architecture

Standalone Angular 22 components with signals, SCSS, and Vitest. **No new runtime
dependencies:** no Font Awesome and no `@angular/animations`. Animations use plain CSS.

### 4.1 Content config: `src/app/invitation.config.ts`

The single source of all content, typed by an `Invitation` interface and checked
with `satisfies`:

```ts
export interface Invitation {
  names: string;                 // 'Kasper & Mette'
  date: Date;                    // party start, local time
  endTime: string;               // e.g. 'til sent'
  venue: { name: string; address: string; mapEmbedUrl: string; mapsUrl: string };
  rsvpDeadline: Date;
  rsvpEndpoint: string;          // Google Apps Script web app URL
  photos: { src: string; alt: string }[];               // at least 3
  wishlists: { name: string; text: string; url: string }[]; // exactly 3
}
```

The three wish lists are **Kasper**, **Mette**, and **Fælles** (shared). Until real
values exist, the config holds placeholders.

### 4.2 Page composition

`App` renders the sections in this order, each as its own component in
`src/app/components/<name>/`:

| # | Component | Anchor id | Nav label |
|---|---|---|---|
| — | `header` (existing, restyled) | — | — |
| 1 | `hero` | `home` | — |
| 2 | `invitation` | `info` | Info |
| 3 | `location` | `kort` | Kort |
| 4 | `wishlists` | `oensker` | Ønsker |
| 5 | `rsvp` | `svar` | Svar |
| 6 | `footer` | — | — |

Sections read content by importing `invitation` directly. There are no inputs
between components, because none are needed.

### 4.3 Services and pure logic

- **`CountdownService`** exposes a `remaining` signal
  (`{ days, hours, minutes, seconds, isToday }`) that ticks every second. It
  clamps at zero, and `isToday` is true from midnight on the party date.
- **`slideshow.ts`** holds pure functions for the hero rotation (next state given
  the current state and the photo count), so the logic can be tested without a DOM.
- **`RsvpService`** has `submit(response): Promise<void>`, which POSTs to
  `rsvpEndpoint` (see §6).

### 4.4 Locale

`registerLocaleData(localeDa)` runs in `main.ts`, and `LOCALE_ID` is set to `'da-DK'`,
so dates render as "lørdag d. 14. november".

## 5. Sections

### 5.1 Header
The existing `Header` component keeps its behaviour: a "K & M" logo in Fraunces,
transparent at the top and solid navy with a shadow after scrolling 100px. It gets
jump links (Info, Kort, Ønsker, Svar) that scroll smoothly to the anchors. Under
860px it shows a hamburger menu that closes after a link is tapped. Unused code
(`activeFragment`, `isActive`, the `RouterLink` to `/`) is removed or used.

### 5.2 Hero slideshow
- Three polaroid **slots**, each with a fixed tilt, are placed around a centred
  title card that reads "Vi fylder 30! · Kasper & Mette".
- Every **4 seconds** the next photo from `photos` cross-fades into the next slot,
  taking the slots in turn (slot 0, 1, 2, 0, …). This cycles through every photo
  evenly. A photo is never shown in two slots at once.
- **A swipe (horizontal, at least 40px) or a tap** on the hero advances straight
  away and restarts the 4-second timer.
- **Dots** show the position of the most recently changed photo in `photos`.
- **Pauses** while `document.hidden` is true. With `prefers-reduced-motion: reduce`,
  there is no automatic rotation and no fade, but manual swipes still work.
- **Images:** compressed JPGs about 800px on the long edge, stored in
  `public/assets/images/photos/`. The first three load eagerly and the rest use
  `loading="lazy"`.
- On desktop the polaroids spread wider and are larger.

### 5.3 Invitation and countdown
Heading "Kom og fejr os". Three facts: the date (with weekday), the time
("18:00 · til sent"), and the venue name. Below them, a countdown in four boxes
(dage, timer, min, sek). When `isToday` is true, the boxes are replaced by
**"I dag er dagen! 🎉"**.

### 5.4 Location
Heading "Her fester vi". A responsive Google Maps embed iframe (`mapEmbedUrl`,
`loading="lazy"`, rounded, 16:10 ratio on mobile), the venue name and address, and
an outline button **"Åbn i Google Maps"** (`mapsUrl`, new tab). No API key is needed.

### 5.5 Wish lists
Heading "Ønskelister". Three cards, each with an initials avatar, name, short text
and a "Se" button that opens the URL in a new tab (`rel="noopener"`). Cards stack
on mobile and sit in a row of three on desktop.

### 5.6 RSVP
Heading "Kommer du?", then "Svar venligst senest {rsvpDeadline}". A reactive form:

| Field | Control | Rules |
|---|---|---|
| Navn | text | required, trimmed, 1–100 characters |
| Deltager du? | two toggle buttons: "Ja, jeg kommer 🎉" and "Desværre ikke" | required |
| Antal personer | number | required and 1–10 only when attending; default 1; hidden when not attending |
| Besked | textarea | optional, max 500 characters |
| `website` | hidden honeypot | must be empty |

Validation messages appear after a field is touched, or when submit is pressed.

**States:** `idle → sending → success | error`

- **sending:** the submit button is disabled and reads "Sender…".
- **success:** the form is replaced by "Tak, {navn}! 🎉 Vi glæder os til at se
  dig." (attending) or "Ærgerligt, {navn} – vi kommer til at savne dig!" (not
  attending), plus a "Send et nyt svar" link that resets the form to idle.
- **error:** the inputs are kept, and the message reads "Noget gik galt – prøv
  igen, eller skriv til os på SMS." The button is enabled again.
- **Honeypot filled:** the page shows success without sending anything.

### 5.7 Footer
"Vi glæder os til at se dig!" in italic Fraunces, and "K & M · 2026".

## 6. RSVP backend: Google Apps Script → Google Sheet

GitHub Pages only serves static files, so responses go to a Google Apps Script web
app bound to a Google Sheet. That is free, needs no server, and easily handles
about 60 guests.

**Client request** (`RsvpService`):
- `POST rsvpEndpoint`, with the body `JSON.stringify({ name, attending, count, message })`.
- The header is `Content-Type: text/plain;charset=utf-8`, which makes it a CORS
  "simple request" with no preflight. Apps Script cannot answer `OPTIONS`.
- It reads the JSON response. Only `{ ok: true }` resolves, and anything else rejects.
- A **10-second timeout** via `AbortController` rejects on timeout.
- When not attending, `count` is sent as `0`.

**Script** (`apps-script/rsvp.gs`, stored in the repo):
- `doPost(e)` parses `e.postData.contents` and validates again on the server
  (name 1–100 characters, attending a boolean, count 0–10, message up to 500).
- It appends the row `timestamp | name | attending (Ja/Nej) | count | message`
  to the sheet "Svar".
- It returns `ContentService` JSON: `{ ok: true }`, or `{ ok: false, error }`.
- It uses `LockService` so simultaneous submissions don't collide.
- **Duplicates:** every submission is appended, and the hosts treat the newest
  row per name as the current answer.

**Setup guide** (`apps-script/README.md`): create the sheet, paste in the script,
deploy as a web app ("Execute as: me", "Who has access: anyone"), and copy the URL
into `rsvpEndpoint`.

## 7. Testing

Vitest unit tests:

- **CountdownService** (fake timers): the values count down correctly, day
  boundaries are handled, the clamp keeps values from going negative, and
  `isToday` flips at midnight on the party date.
- **slideshow.ts:** slots advance in turn, the rotation covers every photo, no
  photo appears in two slots at once, it works with exactly 3 photos, and it
  works with more.
- **Hero component:** a tap or swipe advances and restarts the timer, rotation
  pauses when hidden, and reduced motion disables automatic rotation.
- **RsvpService** (mocked `fetch`): checks the body shape and `text/plain`
  header, that `ok: true` resolves, that `ok: false`, non-JSON, network errors and
  timeouts reject, and that `count` is 0 when not attending.
- **RSVP component:** the validation rules, that people count is only required
  when attending, that the honeypot skips sending, and that the sending, success
  (both texts), error and reset states render.
- **Config sanity:** exactly 3 wish lists, at least 3 photos, a valid `date`, and
  `rsvpDeadline` before `date`.

**Visual verification:** before calling it done, the Playwright MCP loads the
page at 390px and 1280px wide. It screenshots every section, exercises the
slideshow, submits an RSVP against a mocked endpoint, and checks that there are no
console errors.

## 8. Deployment

- **CI** (`.github/workflows/ci.yml`): on every push and PR, run `pnpm install
  --frozen-lockfile`, `pnpm test`, and `pnpm build`.
- **Deploy** (`.github/workflows/deploy.yml`): on pushes to `master`, build with
  `--base-href /30-years/`, copy `index.html` to `404.html`, and publish with the
  official `actions/upload-pages-artifact` and `actions/deploy-pages` actions.
  No personal access token is needed.
- **URL:** `https://svane20.github.io/30-years/`

## 9. File map

```
src/main.ts                                  (+ da-DK locale)
src/styles.scss                              (design tokens, fonts, base)
src/app/invitation.config.ts                 (new)
src/app/services/countdown.service.ts        (new)
src/app/services/rsvp.service.ts             (new)
src/app/components/hero/slideshow.ts         (new, pure logic)
src/app/components/{hero,invitation,location,wishlists,rsvp,footer}/  (new)
src/app/components/header/                   (restyled, nav added)
src/app/components/app/                      (composes sections)
src/app/app.routes.ts                        (the '' route that renders App inside itself is removed; single page, no routes)
public/assets/images/photos/                 (photos, added by the hosts)
apps-script/rsvp.gs, apps-script/README.md   (new)
.github/workflows/ci.yml, deploy.yml         (new)
```
