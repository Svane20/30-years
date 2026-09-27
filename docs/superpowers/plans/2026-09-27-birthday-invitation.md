# Birthday Invitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Kasper & Mette's one-page 30th birthday invitation: a polaroid photo slideshow, event details with a countdown, an embedded map, three wish lists, and an RSVP form saved to a Google Sheet, deployed to GitHub Pages.

**Architecture:** Standalone Angular 22 components (zoneless, signals), one per page section, all reading content from a single typed config file (`src/app/invitation.config.ts`). The logic worth testing is kept in pure functions or small services (`computeRemaining`, `slideshow.ts`, `RsvpService`). RSVPs are POSTed as `text/plain` JSON to a Google Apps Script web app, which appends rows to a Google Sheet.

**Tech Stack:** Angular 22, TypeScript 6, SCSS, Vitest 5 + jsdom (through `@angular/build:unit-test`), reactive forms, pnpm 11, GitHub Actions + GitHub Pages, and Google Apps Script.

**Spec:** `docs/superpowers/specs/2026-09-27-birthday-invitation-design.md`

**Deliberate small deviations from the spec:**
- Locale registration lives in `src/app/locale.ts` (imported by `app.config.ts`) instead of `main.ts`, so tests can reuse `provideDanishLocale()`.
- Each wish list entry gets an `initials` field (`'K'`, `'M'`, `'K&M'`) for its avatar.
- Until the real photos arrive, three placeholder SVGs stand in for the JPGs.
- The polaroid `<img>` elements have no `loading="lazy"`. Only the three on-screen photos are ever in the DOM, so lazy loading does nothing. Instead, the hero preloads the *next* photo after each advance, which is what actually prevents a blank polaroid.

## Global Constraints

- The UI language is Danish, with `LOCALE_ID` set to `'da-DK'`. All user-facing copy is exactly as written in this plan.
- No new runtime dependencies. No Font Awesome, no `@angular/animations`, and no map library. Animations use plain CSS.
- Colours come only from the CSS custom properties defined in Task 1: `--navy #14161f`, `--navy-alt #1b1e2a`, `--gold #c9a86a`, `--gold-line rgba(201,168,106,.3)`, `--cream #e9e3d6`, `--polaroid #f5efe3`, and `--error #e8826f`.
- Fonts: Fraunces (display: 600/800, italic 500) and DM Sans (body: 400/500/700), from Google Fonts.
- Mobile first, designed at 390px, with a desktop breakpoint at `min-width: 860px`.
- Each component stylesheet must stay under the 4 kB `anyComponentStyle` budget in `angular.json`. Shared styles go in `src/styles.scss`.
- Content is read only from `invitation.config.ts`. Components never hard-code dates, venue, URLs or names.
- Match the existing code style: Prettier config (single quotes, width 140, trailing commas, `arrowParens: avoid`), separate `templateUrl`/`styleUrl` files, `public`/`protected` modifiers, and signals for state.
- Run tests with `pnpm ng test --watch=false`, optionally adding `--include <spec path>`.
- Every commit message ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Work on branch `master`. It deploys to `https://svane20.github.io/30-years/`.

## Review Focus

1. **The RSVP endpoint isn't configured yet** (`rsvpEndpoint: ''`, the real state until the Apps Script is deployed). A guest who submits must see the error message and **never** a false "Tak!". Pinned in Task 8 (`rejects without calling fetch when the endpoint is empty`) and Task 9 (`shows the error message when the service rejects`).
2. **Double-tapping "Send svar" on a slow phone connection** must produce exactly one submission. Pinned in Task 9 (`ignores a second submit while sending`).
3. **A name that is only spaces, or has leading or trailing spaces**, must be rejected or trimmed respectively, and the sheet gets the trimmed name. Pinned in Task 9 (`rejects a whitespace-only name` and `sends the trimmed values`).
4. **Opening the site on the day of the party or afterwards** must never show negative numbers. It shows "I dag er dagen! 🎉". Pinned in Task 2 (`clamps to zero after the party has started`) and Task 6 (`shows the party-day message on the day`).
5. **A guest who picks "Ja", clears or breaks the people count, then switches to "Desværre ikke"** must still be able to submit, and `count` is sent as `0`. Pinned in Task 9 (`ignores an invalid count once the guest declines`) and Task 8 (`sends count 0 when not attending`).

---

## File map

| File | Responsibility | Task |
|---|---|---|
| `src/index.html` | Document shell, fonts, `lang="da"` | 1 |
| `src/styles.scss` | Design tokens and shared classes (`.section`, `.section-title`, `.card`, `.btn`) | 1 |
| `src/app/locale.ts` | Register `da` locale data; `provideDanishLocale()` | 1 |
| `src/app/app.config.ts` | App providers (no router) | 1 |
| `src/app/app.routes.ts` | **Deleted** | 1 |
| `src/app/invitation.model.ts` | `Invitation` interface | 1 |
| `src/app/invitation.config.ts` (+ spec) | All content | 1 |
| `public/assets/images/photos/placeholder-{1,2,3}.svg` | Temporary photos | 1 |
| `src/app/components/app/*` (+ spec) | Page composition | 1, 4–9, 12 |
| `src/app/services/countdown.service.ts` (+ spec) | `computeRemaining()` and the ticking signal | 2 |
| `src/app/components/hero/slideshow.ts` (+ spec) | Pure rotation logic | 3 |
| `src/app/components/hero/*` (+ spec) | Polaroid slideshow UI | 4 |
| `src/app/components/header/*` (+ spec) | Fixed header and jump nav | 5 |
| `src/app/components/invitation/*` (+ spec) | Facts and countdown section | 6 |
| `src/app/components/location/*` (+ spec) | Map embed section | 7 |
| `src/app/components/wishlists/*` (+ spec) | Wish list cards | 7 |
| `src/app/components/footer/*` (+ spec) | Sign-off | 7 |
| `src/app/services/rsvp.service.ts` (+ spec) | POST to Apps Script | 8 |
| `src/app/components/rsvp/*` (+ spec) | RSVP form and its states | 9 |
| `apps-script/rsvp.gs`, `apps-script/README.md` | Sheet backend and setup guide | 10 |
| `.github/workflows/ci.yml`, `deploy.yml`, `README.md` | CI, Pages deploy, project docs | 11 |

---

### Task 1: Foundation — config, locale, design tokens, no router

**Files:**
- Delete: `src/app/app.routes.ts`
- Modify: `src/app/app.config.ts`, `src/index.html`, `src/styles.scss`, `src/app/components/app/app.ts`, `src/app/components/app/app.html`, `src/app/components/header/header.ts`, `src/app/components/header/header.html`
- Create: `src/app/locale.ts`, `src/app/invitation.model.ts`, `src/app/invitation.config.ts`, `public/assets/images/photos/placeholder-1.svg`, `placeholder-2.svg`, `placeholder-3.svg`
- Test: `src/app/invitation.config.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface Invitation`, `interface Venue`, `interface Photo`, `interface Wishlist` from `src/app/invitation.model.ts`
  - `const invitation` (type `Invitation`) from `src/app/invitation.config.ts`
  - `provideDanishLocale(): Provider` from `src/app/locale.ts`
  - The CSS tokens and shared classes `.container`, `.narrow`, `.section`, `.section--alt`, `.section-title`, `.card`, `.btn`, `.btn--outline`, and `.btn--block` in `src/styles.scss`

- [ ] **Step 0: Commit the existing scaffold (only if your human partner has approved it)**

The Angular scaffold is staged but has never been committed. Commit it first, so every later task's diff is reviewable:

```bash
git add -A -- . ':!docs' ':!.superpowers'
git commit -m "chore: Angular 22 scaffold" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 1: Write the failing config test**

Create `src/app/invitation.config.spec.ts`:

```ts
import { invitation } from './invitation.config';

describe('invitation config', () => {
  it('has exactly three wish lists, each with a name, initials, text and an https url', () => {
    expect(invitation.wishlists).toHaveLength(3);
    for (const list of invitation.wishlists) {
      expect(list.name.trim()).not.toBe('');
      expect(list.initials.trim()).not.toBe('');
      expect(list.text.trim()).not.toBe('');
      expect(list.url.startsWith('https://')).toBe(true);
    }
  });

  it('has at least three photos, each with a src and alt text', () => {
    expect(invitation.photos.length).toBeGreaterThanOrEqual(3);
    for (const photo of invitation.photos) {
      expect(photo.src.startsWith('assets/images/photos/')).toBe(true);
      expect(photo.alt.trim()).not.toBe('');
    }
  });

  it('has a valid party date', () => {
    expect(Number.isNaN(invitation.date.getTime())).toBe(false);
  });

  it('has an RSVP deadline before the party date', () => {
    expect(invitation.rsvpDeadline.getTime()).toBeLessThan(invitation.date.getTime());
  });

  it('only embeds maps from google.com', () => {
    expect(new URL(invitation.venue.mapEmbedUrl).hostname.endsWith('google.com')).toBe(true);
    expect(new URL(invitation.venue.mapsUrl).hostname.endsWith('google.com')).toBe(true);
  });

  it('has an empty RSVP endpoint or a Google Apps Script URL', () => {
    const endpoint = invitation.rsvpEndpoint;
    expect(endpoint === '' || endpoint.startsWith('https://script.google.com/')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `pnpm ng test --watch=false --include src/app/invitation.config.spec.ts`
Expected: FAIL with a build error saying it cannot resolve `./invitation.config`.

- [ ] **Step 3: Create the model**

Create `src/app/invitation.model.ts`:

```ts
export interface Venue {
  name: string;
  address: string;
  /** Google Maps embed URL for the iframe (no API key). */
  mapEmbedUrl: string;
  /** Google Maps link opened by the "Åbn i Google Maps" button. */
  mapsUrl: string;
}

export interface Photo {
  /** Path under public/, e.g. 'assets/images/photos/1.jpg'. */
  src: string;
  alt: string;
}

export interface Wishlist {
  name: string;
  /** Shown in the round avatar, e.g. 'K' or 'K&M'. */
  initials: string;
  text: string;
  url: string;
}

export interface Invitation {
  names: string;
  /** Party start in local time. */
  date: Date;
  endTime: string;
  venue: Venue;
  rsvpDeadline: Date;
  /** Google Apps Script web app URL; empty until deployed. */
  rsvpEndpoint: string;
  /** At least three. */
  photos: Photo[];
  /** Exactly three: Kasper, Mette, Fælles. */
  wishlists: Wishlist[];
}
```

- [ ] **Step 4: Create the config with placeholders**

Create `src/app/invitation.config.ts`:

```ts
import { Invitation } from './invitation.model';

// Placeholder values – replace with the real details before sharing the link.
export const invitation = {
  names: 'Kasper & Mette',
  date: new Date('2026-11-14T18:00:00'),
  endTime: 'til sent',
  venue: {
    name: 'Rådhussalen',
    address: 'Bystævnet 21, 5792 Årslev',
    mapEmbedUrl: 'https://maps.google.com/maps?q=Byst%C3%A6vnet%2021%2C%205792%20%C3%85rslev&output=embed',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Byst%C3%A6vnet%2021%2C%205792%20%C3%85rslev',
  },
  rsvpDeadline: new Date('2026-11-01T23:59:59'),
  rsvpEndpoint: '',
  photos: [
    { src: 'assets/images/photos/placeholder-1.svg', alt: 'Pladsholder – foto 1' },
    { src: 'assets/images/photos/placeholder-2.svg', alt: 'Pladsholder – foto 2' },
    { src: 'assets/images/photos/placeholder-3.svg', alt: 'Pladsholder – foto 3' },
  ],
  wishlists: [
    { name: 'Kasper', initials: 'K', text: 'Hvis du vil forkæle mig', url: 'https://example.com/kasper' },
    { name: 'Mette', initials: 'M', text: 'Hvis du vil forkæle mig', url: 'https://example.com/mette' },
    { name: 'Fælles', initials: 'K&M', text: 'Til os begge', url: 'https://example.com/faelles' },
  ],
} satisfies Invitation;
```

Create the three placeholder photos. `public/assets/images/photos/placeholder-1.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="960" viewBox="0 0 800 960"><rect width="800" height="960" fill="#2a2e3d"/><text x="400" y="510" font-family="Georgia, serif" font-size="96" fill="#c9a86a" text-anchor="middle">Foto 1</text></svg>
```

`placeholder-2.svg` is the same except `fill="#34304a"` on the `rect` and the text `Foto 2`. `placeholder-3.svg` is the same except `fill="#2d3a3a"` and the text `Foto 3`.

- [ ] **Step 5: Run the test and confirm it passes**

Run: `pnpm ng test --watch=false --include src/app/invitation.config.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Locale, app config, and router removal**

Create `src/app/locale.ts`:

```ts
import { registerLocaleData } from '@angular/common';
import localeDa from '@angular/common/locales/da';
import { LOCALE_ID, Provider } from '@angular/core';

registerLocaleData(localeDa);

export function provideDanishLocale(): Provider {
  return { provide: LOCALE_ID, useValue: 'da-DK' };
}
```

Replace `src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideDanishLocale } from './locale';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideDanishLocale()],
};
```

Delete `src/app/app.routes.ts`, because the single page has no routes: `git rm -f src/app/app.routes.ts`.

The header's `RouterLink` would now fail because there is no router. Replace `src/app/components/header/header.ts` with a temporary version that Task 5 will rewrite:

```ts
import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  public isFixed = signal<boolean>(false);

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isFixed.set(window.scrollY > 100);
  }
}
```

In `src/app/components/header/header.html`, replace `<a [routerLink]="['/']">K & M</a>` with `<a href="#home">K &amp; M</a>` and delete the `hamburger-btn` div (it comes back in Task 5).

Replace `src/app/components/app/app.ts`:

```ts
import { Component } from '@angular/core';
import { Header } from '../header/header';

@Component({
  imports: [Header],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
```

Replace `src/app/components/app/app.html`:

```html
<app-header />

<main></main>
```

- [ ] **Step 7: Document shell and design tokens**

Replace `src/index.html`:

```html
<!doctype html>
<html lang="da">
  <head>
    <meta charset="utf-8" />
    <title>Kasper og Mette's 30 års</title>
    <base href="/" />

    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Kasper og Mette fylder 30 – kom og fejr det med os!" />
    <meta name="theme-color" content="#14161f" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,800;1,9..144,500&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

Replace `src/styles.scss`:

```scss
:root {
  --navy: #14161f;
  --navy-alt: #1b1e2a;
  --gold: #c9a86a;
  --gold-line: rgba(201, 168, 106, 0.3);
  --cream: #e9e3d6;
  --polaroid: #f5efe3;
  --error: #e8826f;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  color-scheme: dark;
}

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

body {
  background: var(--navy);
  color: var(--cream);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  display: block;
}

button,
input,
textarea {
  font: inherit;
}

:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}

.container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 16px;
}

.narrow {
  max-width: 640px;
}

.section {
  padding: 72px 0;
  text-align: center;
  scroll-margin-top: 64px;
}

.section--alt {
  background: var(--navy-alt);
}

.section-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(2rem, 7vw, 2.8rem);
  line-height: 1.1;
  color: var(--gold);
  margin-bottom: 28px;
}

.card {
  background: var(--navy);
  border: 1px solid var(--gold-line);
  border-radius: 14px;
  padding: 14px 16px;
}

.btn {
  display: inline-block;
  padding: 10px 22px;
  border-radius: 999px;
  border: 1px solid var(--gold);
  background: var(--gold);
  color: var(--navy);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.88;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.btn--outline {
  background: transparent;
  color: var(--gold);
}

.btn--block {
  display: block;
  width: 100%;
}
```

- [ ] **Step 8: Verify the whole suite and the build**

Run: `pnpm ng test --watch=false && pnpm build`
Expected: the tests PASS and the build succeeds with no budget warnings.

- [ ] **Step 9: Commit**

```bash
git add src/ public/assets/images/photos/
git commit -m "feat: invitation config, Danish locale and design tokens" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Countdown

**Files:**
- Create: `src/app/services/countdown.service.ts`
- Test: `src/app/services/countdown.service.spec.ts`

**Interfaces:**
- Consumes: `invitation.date` from Task 1.
- Produces:
  - `interface Remaining { days: number; hours: number; minutes: number; seconds: number; isToday: boolean }`
  - `function computeRemaining(now: Date, target: Date): Remaining`
  - `class CountdownService` (`providedIn: 'root'`) with `readonly remaining: Signal<Remaining>`, which updates every 1000 ms

- [ ] **Step 1: Write the failing tests**

Create `src/app/services/countdown.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { invitation } from '../invitation.config';
import { computeRemaining, CountdownService } from './countdown.service';

const target = new Date('2026-11-14T18:00:00');
const at = (iso: string) => new Date(iso);

describe('computeRemaining', () => {
  it('splits the time left into days, hours, minutes and seconds', () => {
    expect(computeRemaining(at('2026-11-13T15:56:56'), target)).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4, isToday: false });
  });

  it('is not the party day one second before midnight', () => {
    expect(computeRemaining(at('2026-11-13T23:59:59'), target).isToday).toBe(false);
  });

  it('is the party day from midnight on the party date', () => {
    const r = computeRemaining(at('2026-11-14T00:00:00'), target);
    expect(r.isToday).toBe(true);
    expect(r.hours).toBe(18);
  });

  it('is zero at the start of the party', () => {
    expect(computeRemaining(target, target)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true });
  });

  it('clamps to zero after the party has started', () => {
    expect(computeRemaining(at('2026-11-15T02:00:00'), target)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true });
  });
});

describe('CountdownService', () => {
  afterEach(() => vi.useRealTimers());

  it('ticks every second towards the party date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(invitation.date.getTime() - 10_000));

    const service = TestBed.inject(CountdownService);
    expect(service.remaining().seconds).toBe(10);

    vi.advanceTimersByTime(3000);
    expect(service.remaining().seconds).toBe(7);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm ng test --watch=false --include src/app/services/countdown.service.spec.ts`
Expected: FAIL, because `./countdown.service` cannot be resolved.

- [ ] **Step 3: Implement**

Create `src/app/services/countdown.service.ts`:

```ts
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { invitation } from '../invitation.config';

export interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True from midnight on the party date. */
  isToday: boolean;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function computeRemaining(now: Date, target: Date): Remaining {
  const startOfTargetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const ms = Math.max(0, target.getTime() - now.getTime());

  return {
    days: Math.floor(ms / DAY),
    hours: Math.floor((ms % DAY) / HOUR),
    minutes: Math.floor((ms % HOUR) / MINUTE),
    seconds: Math.floor((ms % MINUTE) / SECOND),
    isToday: now.getTime() >= startOfTargetDay.getTime(),
  };
}

@Injectable({ providedIn: 'root' })
export class CountdownService {
  private readonly target = invitation.date;
  private readonly state = signal<Remaining>(computeRemaining(new Date(), this.target));

  public readonly remaining = this.state.asReadonly();

  constructor() {
    const intervalId = setInterval(() => this.state.set(computeRemaining(new Date(), this.target)), SECOND);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalId));
  }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm ng test --watch=false --include src/app/services/countdown.service.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/services/
git commit -m "feat: countdown service" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Slideshow rotation logic

**Files:**
- Create: `src/app/components/hero/slideshow.ts`
- Test: `src/app/components/hero/slideshow.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `const SLOT_COUNT = 3`
  - `interface SlideshowState { slots: number[]; nextSlot: number; nextPhoto: number; current: number }`
  - `function initialSlideshow(photoCount: number): SlideshowState`
  - `function advanceSlideshow(state: SlideshowState, photoCount: number): SlideshowState`

Behaviour: with 4 or more photos, the next photo goes into the next slot in turn (0, 1, 2, 0, …), so the slots always hold the three most recent consecutive photos and never show a duplicate. With exactly 3 photos, every photo is already on screen, so the photos rotate between the slots instead. `photoCount < 3` is unsupported, and the Task 1 config test forbids it.

- [ ] **Step 1: Write the failing tests**

Create `src/app/components/hero/slideshow.spec.ts`:

```ts
import { advanceSlideshow, initialSlideshow, SlideshowState, SLOT_COUNT } from './slideshow';

function run(photoCount: number, steps: number): SlideshowState[] {
  const states = [initialSlideshow(photoCount)];
  for (let i = 0; i < steps; i++) {
    states.push(advanceSlideshow(states[states.length - 1], photoCount));
  }
  return states;
}

describe('slideshow', () => {
  it('starts with the first three photos in the three slots', () => {
    expect(initialSlideshow(5)).toEqual({ slots: [0, 1, 2], nextSlot: 0, nextPhoto: 3, current: 0 });
  });

  it('puts the next photo into the next slot in turn', () => {
    const [, first, second, third, fourth] = run(5, 4);
    expect(first.slots).toEqual([3, 1, 2]);
    expect(second.slots).toEqual([3, 4, 2]);
    expect(third.slots).toEqual([3, 4, 0]);
    expect(fourth.slots).toEqual([1, 4, 0]);
    expect(fourth.current).toBe(1);
  });

  it('never shows the same photo in two slots at once', () => {
    for (let photoCount = 3; photoCount <= 10; photoCount++) {
      for (const state of run(photoCount, 50)) {
        expect(new Set(state.slots).size).toBe(SLOT_COUNT);
      }
    }
  });

  it('brings every photo on screen within one full cycle', () => {
    const photoCount = 7;
    const seen = new Set(run(photoCount, photoCount).flatMap(s => s.slots));
    expect(seen.size).toBe(photoCount);
  });

  it('rotates the photos between slots when there are exactly three', () => {
    const [start, next] = run(3, 1);
    expect(next.slots).not.toEqual(start.slots);
    expect([...next.slots].sort()).toEqual([0, 1, 2]);
    expect(next.current).toBe(next.slots[0]);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm ng test --watch=false --include src/app/components/hero/slideshow.spec.ts`
Expected: FAIL, because `./slideshow` cannot be resolved.

- [ ] **Step 3: Implement**

Create `src/app/components/hero/slideshow.ts`:

```ts
export const SLOT_COUNT = 3;

export interface SlideshowState {
  /** Photo index shown in each polaroid slot. */
  slots: number[];
  /** Slot that receives the next photo. */
  nextSlot: number;
  /** Photo index that will be shown next. */
  nextPhoto: number;
  /** Photo index most recently brought on screen; drives the dots. */
  current: number;
}

export function initialSlideshow(photoCount: number): SlideshowState {
  return { slots: [0, 1, 2], nextSlot: 0, nextPhoto: SLOT_COUNT % photoCount, current: 0 };
}

export function advanceSlideshow(state: SlideshowState, photoCount: number): SlideshowState {
  if (photoCount <= SLOT_COUNT) {
    // Every photo is already on screen, so move them between slots instead.
    const slots = [state.slots[2], state.slots[0], state.slots[1]];
    return { ...state, slots, current: slots[0] };
  }

  const slots = [...state.slots];
  slots[state.nextSlot] = state.nextPhoto;

  return {
    slots,
    nextSlot: (state.nextSlot + 1) % SLOT_COUNT,
    nextPhoto: (state.nextPhoto + 1) % photoCount,
    current: state.nextPhoto,
  };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm ng test --watch=false --include src/app/components/hero/slideshow.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/components/hero/slideshow.ts src/app/components/hero/slideshow.spec.ts
git commit -m "feat: polaroid slideshow rotation logic" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Hero component

**Files:**
- Create: `src/app/components/hero/hero.ts`, `hero.html`, `hero.scss`
- Modify: `src/app/components/app/app.ts`, `src/app/components/app/app.html`
- Test: `src/app/components/hero/hero.spec.ts`

**Interfaces:**
- Consumes: `invitation` (Task 1); `initialSlideshow` and `advanceSlideshow` (Task 3).
- Produces:
  - `class Hero` with selector `app-hero`. It renders `<section id="home">`.
  - `const SLIDE_INTERVAL_MS = 4000`
  - Public: `state: Signal<SlideshowState>`, `next(): void`, `onPointerDown(e: PointerEvent)`, and `onPointerUp(e: PointerEvent)`

Behaviour:
- Rotates every 4000 ms.
- A **tap** (pointer moves less than 10px) or a **swipe** (moves at least 40px horizontally) advances straight away and restarts the timer. Movement between 10 and 39px is ignored.
- Pauses while `document.hidden` is true and resumes when the page is visible again.
- Never rotates automatically under `prefers-reduced-motion: reduce`, although taps and swipes still work. `matchMedia` is guarded because jsdom has none.
- After each advance, it preloads the next photo.

- [ ] **Step 1: Write the failing tests**

Create `src/app/components/hero/hero.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { Hero, SLIDE_INTERVAL_MS } from './hero';
import { advanceSlideshow, initialSlideshow, SlideshowState } from './slideshow';

const photoCount = invitation.photos.length;
const after = (steps: number): SlideshowState => {
  let state = initialSlideshow(photoCount);
  for (let i = 0; i < steps; i++) state = advanceSlideshow(state, photoCount);
  return state;
};

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;
  let section: HTMLElement;

  function create(): void {
    fixture = TestBed.createComponent(Hero);
    fixture.detectChanges();
    section = fixture.nativeElement.querySelector('section');
  }

  function pointer(type: 'pointerdown' | 'pointerup', clientX: number): void {
    section.dispatchEvent(new PointerEvent(type, { clientX, bubbles: true }));
  }

  function setHidden(hidden: boolean, notify = true): void {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    if (notify) document.dispatchEvent(new Event('visibilitychange'));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom reports document.hidden === true by default; a real open tab is visible.
    setHidden(false, false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (document as { hidden?: boolean }).hidden;
  });

  it('shows three polaroids with the first three photos and the title', () => {
    create();
    const imgs: HTMLImageElement[] = Array.from(section.querySelectorAll('.polaroid img'));
    expect(imgs.map(img => img.getAttribute('src'))).toEqual(invitation.photos.slice(0, 3).map(p => p.src));
    expect(imgs[0].getAttribute('alt')).toBe(invitation.photos[0].alt);
    expect(section.querySelector('h1')?.textContent).toContain('30!');
    expect(section.textContent).toContain(invitation.names);
  });

  it('advances automatically every 4 seconds', () => {
    create();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS - 1);
    expect(fixture.componentInstance.state()).toEqual(after(0));
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.state()).toEqual(after(1));
  });

  it('advances on tap and restarts the timer', () => {
    create();
    vi.advanceTimersByTime(3000);
    pointer('pointerdown', 100);
    pointer('pointerup', 102);
    expect(fixture.componentInstance.state()).toEqual(after(1));

    vi.advanceTimersByTime(3000);
    expect(fixture.componentInstance.state()).toEqual(after(1));
    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.state()).toEqual(after(2));
  });

  it('advances on a swipe of at least 40px but ignores a short drag', () => {
    create();
    pointer('pointerdown', 200);
    pointer('pointerup', 180);
    expect(fixture.componentInstance.state()).toEqual(after(0));

    pointer('pointerdown', 200);
    pointer('pointerup', 150);
    expect(fixture.componentInstance.state()).toEqual(after(1));
  });

  it('pauses while the tab is hidden and resumes when visible', () => {
    create();
    setHidden(true);
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 3);
    expect(fixture.componentInstance.state()).toEqual(after(0));

    setHidden(false);
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS);
    expect(fixture.componentInstance.state()).toEqual(after(1));
  });

  it('does not rotate automatically with reduced motion, but still reacts to taps', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    create();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 3);
    expect(fixture.componentInstance.state()).toEqual(after(0));

    pointer('pointerdown', 100);
    pointer('pointerup', 100);
    expect(fixture.componentInstance.state()).toEqual(after(1));
  });

  it('renders one dot per photo and marks the current one', () => {
    create();
    const dots = section.querySelectorAll('.hero__dots span');
    expect(dots).toHaveLength(photoCount);
    expect(dots[after(0).current].classList).toContain('active');
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm ng test --watch=false --include src/app/components/hero/hero.spec.ts`
Expected: FAIL, because `./hero` cannot be resolved.

- [ ] **Step 3: Implement the component**

Create `src/app/components/hero/hero.ts`:

```ts
import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { invitation } from '../../invitation.config';
import { advanceSlideshow, initialSlideshow } from './slideshow';

export const SLIDE_INTERVAL_MS = 4000;
const TAP_MAX_PX = 10;
const SWIPE_MIN_PX = 40;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

@Component({
  selector: 'app-hero',
  styleUrl: './hero.scss',
  templateUrl: './hero.html',
})
export class Hero {
  protected readonly invitation = invitation;

  private readonly document = inject(DOCUMENT);
  private readonly reducedMotion = prefersReducedMotion();
  private timerId: ReturnType<typeof setInterval> | null = null;
  private pointerStartX: number | null = null;

  public readonly state = signal(initialSlideshow(invitation.photos.length));

  constructor() {
    const onVisibilityChange = () => (this.document.hidden ? this.stopTimer() : this.startTimer());
    this.document.addEventListener('visibilitychange', onVisibilityChange);

    inject(DestroyRef).onDestroy(() => {
      this.stopTimer();
      this.document.removeEventListener('visibilitychange', onVisibilityChange);
    });

    this.startTimer();
  }

  public next(): void {
    this.state.update(state => advanceSlideshow(state, invitation.photos.length));
    this.preload(this.state().nextPhoto);
  }

  public onPointerDown(event: PointerEvent): void {
    this.pointerStartX = event.clientX;
  }

  /** The browser took over the gesture (e.g. a vertical scroll), so it is neither a tap nor a swipe. */
  public onPointerCancel(): void {
    this.pointerStartX = null;
  }

  public onPointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) {
      return;
    }

    const distance = Math.abs(event.clientX - this.pointerStartX);
    this.pointerStartX = null;

    if (distance < TAP_MAX_PX || distance >= SWIPE_MIN_PX) {
      this.next();
      this.stopTimer();
      this.startTimer();
    }
  }

  private startTimer(): void {
    if (this.reducedMotion || this.timerId !== null || this.document.hidden) {
      return;
    }

    this.timerId = setInterval(() => this.next(), SLIDE_INTERVAL_MS);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private preload(photoIndex: number): void {
    const image = new Image();
    image.src = invitation.photos[photoIndex].src;
  }
}
```

Create `src/app/components/hero/hero.html`. The inner `@for` over `[photoIndex]`, tracked by the photo index, recreates the `<img>` whenever a slot's photo changes, which replays the CSS fade-in:

```html
<section
  class="hero"
  id="home"
  aria-label="Billeder af Kasper og Mette"
  (pointerdown)="onPointerDown($event)"
  (pointerup)="onPointerUp($event)"
  (pointercancel)="onPointerCancel()"
>
  @for (photoIndex of state().slots; track $index; let slot = $index) {
    <figure class="polaroid polaroid--{{ slot }}">
      @for (i of [photoIndex]; track i) {
        <img [src]="invitation.photos[i].src" [alt]="invitation.photos[i].alt" draggable="false" />
      }
    </figure>
  }

  <div class="hero__title">
    <h1>Vi fylder<br />30!</h1>
    <p>{{ invitation.names }}</p>
  </div>

  <div class="hero__dots" aria-hidden="true">
    @for (photo of invitation.photos; track photo.src) {
      <span [class.active]="$index === state().current"></span>
    }
  </div>
</section>
```

Create `src/app/components/hero/hero.scss`:

```scss
.hero {
  position: relative;
  height: min(100svh, 760px);
  min-height: 540px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  cursor: pointer;
  background: radial-gradient(circle at 50% 40%, var(--navy-alt), var(--navy) 70%);
}

.polaroid {
  position: absolute;
  width: var(--w);
  aspect-ratio: 5 / 6;
  margin: 0;
  padding: 8px 8px 28px;
  background: var(--polaroid);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  transform: rotate(var(--tilt));

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: fade-in 800ms ease both;
  }
}

.polaroid--0 {
  --w: 44vw;
  --tilt: -9deg;
  left: 4%;
  top: 13%;
}

.polaroid--1 {
  --w: 40vw;
  --tilt: 8deg;
  right: 4%;
  top: 24%;
}

.polaroid--2 {
  --w: 38vw;
  --tilt: -3deg;
  left: 31%;
  bottom: 7%;
}

.hero__title {
  position: relative;
  z-index: 1;
  padding: 14px 26px;
  border-radius: 18px;
  background: rgba(20, 22, 31, 0.8);
  text-align: center;

  h1 {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(3rem, 13vw, 5.5rem);
    line-height: 0.95;
    color: var(--gold);
  }

  p {
    margin-top: 8px;
    font-size: 0.8rem;
    letter-spacing: 3px;
    text-transform: uppercase;
  }
}

.hero__dots {
  position: absolute;
  z-index: 1;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: 1px solid var(--gold);
  }

  .active {
    background: var(--gold);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .polaroid img {
    animation: none;
  }
}

@media (min-width: 860px) {
  .polaroid--0 {
    --w: 270px;
    left: calc(50% - 470px);
    top: 16%;
  }

  .polaroid--1 {
    --w: 250px;
    right: calc(50% - 460px);
    left: auto;
    top: 22%;
  }

  .polaroid--2 {
    --w: 220px;
    left: calc(50% - 110px);
    bottom: 5%;
  }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm ng test --watch=false --include src/app/components/hero/hero.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Add the hero to the page**

In `src/app/components/app/app.ts`, import `Hero` from `'../hero/hero'` and set `imports: [Header, Hero]`. Replace `src/app/components/app/app.html`:

```html
<app-header />

<main>
  <app-hero />
</main>
```

- [ ] **Step 6: Verify the suite and the build, then commit**

Run: `pnpm ng test --watch=false && pnpm build`
Expected: PASS, and the build succeeds with no budget warnings.

```bash
git add src/app/components/hero/ src/app/components/app/
git commit -m "feat: polaroid hero slideshow" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Header with jump navigation

**Files:**
- Modify (full rewrite): `src/app/components/header/header.ts`, `header.html`, `header.scss`
- Test: `src/app/components/header/header.spec.ts`

**Interfaces:**
- Consumes: the section ids `home`, `info`, `kort`, `oensker` and `svar` (rendered by Tasks 4, 6, 7 and 9).
- Produces: `class Header` with selector `app-header`. Public: `links`, `isFixed`, `isNavOpen`, `toggleNav()`, and `scrollTo(id: string, event: Event)`.

- [ ] **Step 1: Write the failing tests**

Create `src/app/components/header/header.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let el: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  it('shows the logo and the four jump links in page order', () => {
    expect(el.querySelector('.logo')?.textContent?.trim()).toBe('K & M');
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.nav a'));
    expect(links.map(a => a.textContent?.trim())).toEqual(['Info', 'Kort', 'Ønsker', 'Svar']);
    expect(links.map(a => a.getAttribute('href'))).toEqual(['#info', '#kort', '#oensker', '#svar']);
  });

  it('becomes solid after scrolling more than 100px', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 150 });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(el.querySelector('header')?.classList).toContain('fixed');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 20 });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(el.querySelector('header')?.classList).not.toContain('fixed');
  });

  it('opens and closes the mobile menu from the hamburger button', () => {
    const button = el.querySelector<HTMLButtonElement>('.hamburger-btn')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('header')?.classList).toContain('open');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('scrolls to the section and closes the menu when a link is tapped', () => {
    const target = document.createElement('section');
    target.id = 'kort';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    el.querySelector<HTMLButtonElement>('.hamburger-btn')!.click();
    fixture.detectChanges();

    const link = Array.from(el.querySelectorAll<HTMLAnchorElement>('.nav a')).find(a => a.textContent?.trim() === 'Kort')!;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    fixture.detectChanges();

    expect(click.defaultPrevented).toBe(true);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(el.querySelector('header')?.classList).not.toContain('open');

    target.remove();
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm ng test --watch=false --include src/app/components/header/header.spec.ts`
Expected: FAIL, because there are no `.nav a` links and no `.hamburger-btn`.

- [ ] **Step 3: Implement**

Replace `src/app/components/header/header.ts`:

```ts
import { DOCUMENT } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';

interface NavLink {
  id: string;
  label: string;
}

@Component({
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  private readonly document = inject(DOCUMENT);

  public readonly links: NavLink[] = [
    { id: 'info', label: 'Info' },
    { id: 'kort', label: 'Kort' },
    { id: 'oensker', label: 'Ønsker' },
    { id: 'svar', label: 'Svar' },
  ];

  public readonly isFixed = signal<boolean>(false);
  public readonly isNavOpen = signal<boolean>(false);

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isFixed.set(window.scrollY > 100);
  }

  public toggleNav(): void {
    this.isNavOpen.update(open => !open);
  }

  public scrollTo(id: string, event: Event): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.isNavOpen.set(false);
  }
}
```

Replace `src/app/components/header/header.html`:

```html
<header class="header" [class.fixed]="isFixed()" [class.open]="isNavOpen()">
  <div class="container header__bar">
    <a class="logo" href="#home" (click)="scrollTo('home', $event)">K &amp; M</a>

    <button
      class="hamburger-btn"
      type="button"
      aria-label="Menu"
      aria-controls="site-nav"
      [attr.aria-expanded]="isNavOpen()"
      (click)="toggleNav()"
    >
      <span></span>
    </button>

    <nav class="nav" id="site-nav">
      <ul>
        @for (link of links; track link.id) {
          <li>
            <a [href]="'#' + link.id" (click)="scrollTo(link.id, $event)">{{ link.label }}</a>
          </li>
        }
      </ul>
    </nav>
  </div>
</header>
```

Replace `src/app/components/header/header.scss`:

```scss
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99;
  transition:
    background-color 0.4s ease,
    box-shadow 0.4s ease;

  &.fixed {
    background: var(--navy);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  }
}

.header__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
}

.logo {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.6rem;
  color: var(--gold);
}

.nav ul {
  display: flex;
  gap: 28px;
  list-style: none;
}

.nav a {
  color: var(--cream);
  font-size: 0.85rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: color 0.3s ease;

  &:hover {
    color: var(--gold);
  }
}

.hamburger-btn {
  display: none;
  width: 42px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--gold-line);
  border-radius: 10px;
  background: none;
  cursor: pointer;

  span,
  span::before,
  span::after {
    display: block;
    width: 18px;
    height: 2px;
    border-radius: 1px;
    background: var(--gold);
  }

  span {
    position: relative;

    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 0;
    }

    &::before {
      top: -6px;
    }

    &::after {
      top: 6px;
    }
  }
}

@media (max-width: 859px) {
  .hamburger-btn {
    display: flex;
  }

  .nav {
    flex: 0 0 100%;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease;

    ul {
      flex-direction: column;
      gap: 0;
      padding-bottom: 8px;
    }

    a {
      display: block;
      padding: 12px 0;
    }
  }

  .header.open {
    background: var(--navy);

    .nav {
      max-height: 260px;
    }
  }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm ng test --watch=false --include src/app/components/header/header.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/components/header/
git commit -m "feat: header with jump navigation" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Invitation section with countdown

**Files:**
- Create: `src/app/components/invitation/invitation.ts`, `invitation.html`, `invitation.scss`
- Modify: `src/app/components/app/app.ts`, `src/app/components/app/app.html`
- Test: `src/app/components/invitation/invitation.spec.ts`

**Interfaces:**
- Consumes: `invitation` (Task 1); `provideDanishLocale` (Task 1); `CountdownService.remaining` (Task 2).
- Produces: `class InvitationDetails` with selector `app-invitation`. It renders `<section id="info">`.

- [ ] **Step 1: Write the failing tests**

Create `src/app/components/invitation/invitation.spec.ts`:

```ts
import { formatDate } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { provideDanishLocale } from '../../locale';
import { InvitationDetails } from './invitation';

const ONE_DAY_2H_3M_4S = ((24 + 2) * 3600 + 3 * 60 + 4) * 1000;

describe('InvitationDetails', () => {
  let fixture: ComponentFixture<InvitationDetails>;
  let el: HTMLElement;

  function create(now: Date): void {
    vi.setSystemTime(now);
    TestBed.configureTestingModule({ providers: [provideDanishLocale()] });
    fixture = TestBed.createComponent(InvitationDetails);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows the weekday, date, time and venue in Danish', () => {
    create(new Date(invitation.date.getTime() - ONE_DAY_2H_3M_4S));
    const text = el.textContent ?? '';
    expect(text).toContain(formatDate(invitation.date, 'EEEE', 'da-DK'));
    expect(text).toContain(formatDate(invitation.date, 'd. MMMM', 'da-DK'));
    expect(text).toContain(`${formatDate(invitation.date, 'HH:mm', 'da-DK')} · ${invitation.endTime}`);
    expect(text).toContain(invitation.venue.name);
  });

  it('shows a live countdown with padded hours, minutes and seconds', () => {
    create(new Date(invitation.date.getTime() - ONE_DAY_2H_3M_4S));
    const values = () => Array.from(el.querySelectorAll('.countdown b')).map(b => b.textContent?.trim());
    expect(values()).toEqual(['1', '02', '03', '04']);

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(values()).toEqual(['1', '02', '03', '03']);
  });

  it('shows the party-day message on the day', () => {
    create(invitation.date);
    expect(el.querySelector('.countdown')).toBeNull();
    expect(el.textContent).toContain('I dag er dagen! 🎉');
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm ng test --watch=false --include src/app/components/invitation/invitation.spec.ts`
Expected: FAIL, because `./invitation` cannot be resolved.

- [ ] **Step 3: Implement**

Create `src/app/components/invitation/invitation.ts`:

```ts
import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { invitation } from '../../invitation.config';
import { CountdownService } from '../../services/countdown.service';

@Component({
  imports: [DatePipe],
  selector: 'app-invitation',
  styleUrl: './invitation.scss',
  templateUrl: './invitation.html',
})
export class InvitationDetails {
  protected readonly invitation = invitation;
  protected readonly remaining = inject(CountdownService).remaining;

  protected pad(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
```

Create `src/app/components/invitation/invitation.html`:

```html
<section class="section section--alt" id="info">
  <div class="container">
    <h2 class="section-title">Kom og fejr os</h2>

    <dl class="facts">
      <div>
        <dt>{{ invitation.date | date: 'EEEE' }}</dt>
        <dd>{{ invitation.date | date: 'd. MMMM' }}</dd>
      </div>
      <div>
        <dt>Tid</dt>
        <dd>{{ invitation.date | date: 'HH:mm' }} · {{ invitation.endTime }}</dd>
      </div>
      <div>
        <dt>Sted</dt>
        <dd>{{ invitation.venue.name }}</dd>
      </div>
    </dl>

    @if (remaining().isToday) {
      <p class="today">I dag er dagen! 🎉</p>
    } @else {
      <div class="countdown" role="timer">
        <div><b>{{ remaining().days }}</b>dage</div>
        <div><b>{{ pad(remaining().hours) }}</b>timer</div>
        <div><b>{{ pad(remaining().minutes) }}</b>min</div>
        <div><b>{{ pad(remaining().seconds) }}</b>sek</div>
      </div>
    }
  </div>
</section>
```

Create `src/app/components/invitation/invitation.scss`:

```scss
.facts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px 32px;
  margin-bottom: 36px;

  dt {
    font-size: 0.75rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold);
  }

  dd {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.3rem;
  }
}

.countdown {
  display: flex;
  justify-content: center;
  gap: 10px;

  div {
    width: 76px;
    padding: 10px 0;
    border: 1px solid var(--gold-line);
    border-radius: 14px;
    background: var(--navy);
    font-size: 0.75rem;
  }

  b {
    display: block;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.8rem;
    line-height: 1.2;
    color: var(--gold);
  }
}

.today {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 2rem;
  color: var(--gold);
}

@media (min-width: 860px) {
  .countdown div {
    width: 100px;
  }

  .countdown b {
    font-size: 2.4rem;
  }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm ng test --watch=false --include src/app/components/invitation/invitation.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the section to the page**

In `src/app/components/app/app.ts`, import `InvitationDetails` from `'../invitation/invitation'` and set `imports: [Header, Hero, InvitationDetails]`. In `app.html`, add `<app-invitation />` right after `<app-hero />` inside `<main>`.

- [ ] **Step 6: Verify the suite, then commit**

Run: `pnpm ng test --watch=false`
Expected: PASS.

```bash
git add src/app/components/invitation/ src/app/components/app/
git commit -m "feat: invitation details with countdown" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Location, wish lists and footer

**Files:**
- Create: `src/app/components/location/location.ts`, `location.html`, `location.scss`
- Create: `src/app/components/wishlists/wishlists.ts`, `wishlists.html`, `wishlists.scss`
- Create: `src/app/components/footer/footer.ts`, `footer.html`, `footer.scss`
- Modify: `src/app/components/app/app.ts`, `src/app/components/app/app.html`
- Test: `src/app/components/location/location.spec.ts`, `src/app/components/wishlists/wishlists.spec.ts`, `src/app/components/footer/footer.spec.ts`

**Interfaces:**
- Consumes: `invitation` (Task 1).
- Produces:
  - `class LocationSection` with selector `app-location`. It renders `<section id="kort">`.
  - `class Wishlists` with selector `app-wishlists`. It renders `<section id="oensker">`.
  - `class Footer` with selector `app-footer`.

- [ ] **Step 1: Write the failing tests**

Create `src/app/components/location/location.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { LocationSection } from './location';

describe('LocationSection', () => {
  it('embeds the map and links to Google Maps in a new tab', () => {
    const fixture = TestBed.createComponent(LocationSection);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const iframe = el.querySelector('iframe')!;
    expect(iframe.getAttribute('src')).toBe(invitation.venue.mapEmbedUrl);
    expect(iframe.getAttribute('loading')).toBe('lazy');
    expect(iframe.getAttribute('title')).toBe(`Kort over ${invitation.venue.name}`);

    expect(el.textContent).toContain(invitation.venue.name);
    expect(el.textContent).toContain(invitation.venue.address);

    const link = el.querySelector<HTMLAnchorElement>('a.btn')!;
    expect(link.textContent?.trim()).toBe('Åbn i Google Maps');
    expect(link.getAttribute('href')).toBe(invitation.venue.mapsUrl);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
  });
});
```

Create `src/app/components/wishlists/wishlists.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { Wishlists } from './wishlists';

describe('Wishlists', () => {
  it('renders one card per wish list that opens in a new tab', () => {
    const fixture = TestBed.createComponent(Wishlists);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const cards = Array.from(el.querySelectorAll<HTMLAnchorElement>('a.wish'));
    expect(cards).toHaveLength(3);

    cards.forEach((card, i) => {
      const list = invitation.wishlists[i];
      expect(card.getAttribute('href')).toBe(list.url);
      expect(card.getAttribute('target')).toBe('_blank');
      expect(card.getAttribute('rel')).toBe('noopener');
      expect(card.querySelector('.wish__avatar')?.textContent?.trim()).toBe(list.initials);
      expect(card.textContent).toContain(list.name);
      expect(card.textContent).toContain(list.text);
    });
  });
});
```

Create `src/app/components/footer/footer.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { Footer } from './footer';

describe('Footer', () => {
  it('signs off with the initials and the party year', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Vi glæder os til at se dig!');
    expect(text).toContain(`K & M · ${invitation.date.getFullYear()}`);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm ng test --watch=false --include "src/app/components/{location,wishlists,footer}/*.spec.ts"`
Expected: FAIL, because the three components cannot be resolved.

- [ ] **Step 3: Implement the location section**

Create `src/app/components/location/location.ts`. The embed URL comes from our own config and the config test pins it to `google.com`, so bypassing the resource URL sanitizer is safe:

```ts
import { Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { invitation } from '../../invitation.config';

@Component({
  selector: 'app-location',
  styleUrl: './location.scss',
  templateUrl: './location.html',
})
export class LocationSection {
  protected readonly venue = invitation.venue;
  protected readonly mapEmbedUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(invitation.venue.mapEmbedUrl);
}
```

Create `src/app/components/location/location.html`:

```html
<section class="section" id="kort">
  <div class="container narrow">
    <h2 class="section-title">Her fester vi</h2>

    <div class="map">
      <iframe
        [src]="mapEmbedUrl"
        title="Kort over {{ venue.name }}"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      ></iframe>
    </div>

    <p class="venue">
      <strong>{{ venue.name }}</strong><br />
      {{ venue.address }}
    </p>

    <a class="btn btn--outline" [href]="venue.mapsUrl" target="_blank" rel="noopener">Åbn i Google Maps</a>
  </div>
</section>
```

Create `src/app/components/location/location.scss`:

```scss
.map {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid var(--gold-line);
  border-radius: 14px;

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }
}

.venue {
  margin: 18px 0;

  strong {
    font-family: var(--font-display);
    font-size: 1.2rem;
  }
}

@media (min-width: 860px) {
  .map {
    aspect-ratio: 16 / 8;
  }
}
```

- [ ] **Step 4: Implement the wish lists**

Create `src/app/components/wishlists/wishlists.ts`:

```ts
import { Component } from '@angular/core';
import { invitation } from '../../invitation.config';

@Component({
  selector: 'app-wishlists',
  styleUrl: './wishlists.scss',
  templateUrl: './wishlists.html',
})
export class Wishlists {
  protected readonly wishlists = invitation.wishlists;
}
```

Create `src/app/components/wishlists/wishlists.html`:

```html
<section class="section section--alt" id="oensker">
  <div class="container">
    <h2 class="section-title">Ønskelister</h2>

    <ul class="wishlists">
      @for (list of wishlists; track list.name) {
        <li>
          <a class="card wish" [href]="list.url" target="_blank" rel="noopener">
            <span class="wish__avatar" aria-hidden="true">{{ list.initials }}</span>
            <span class="wish__body">
              <strong>{{ list.name }}</strong>
              {{ list.text }}
            </span>
            <span class="btn">Se</span>
          </a>
        </li>
      }
    </ul>
  </div>
</section>
```

Create `src/app/components/wishlists/wishlists.scss`:

```scss
.wishlists {
  display: grid;
  gap: 12px;
  list-style: none;
}

.wish {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 100%;
  text-align: left;
  transition: border-color 0.3s ease;

  &:hover {
    border-color: var(--gold);
  }
}

.wish__avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--gold);
  color: var(--navy);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
}

.wish__body {
  flex: 1;

  strong {
    display: block;
    font-family: var(--font-display);
    font-size: 1.15rem;
  }
}

@media (min-width: 860px) {
  .wishlists {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

- [ ] **Step 5: Implement the footer**

Create `src/app/components/footer/footer.ts`:

```ts
import { Component } from '@angular/core';
import { invitation } from '../../invitation.config';

@Component({
  selector: 'app-footer',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly year = invitation.date.getFullYear();
}
```

Create `src/app/components/footer/footer.html`:

```html
<footer class="footer">
  <p class="footer__line">Vi glæder os til at se dig!</p>
  <small>K &amp; M · {{ year }}</small>
</footer>
```

Create `src/app/components/footer/footer.scss`:

```scss
.footer {
  padding: 48px 16px;
  text-align: center;
  background: var(--navy-alt);
}

.footer__line {
  margin-bottom: 6px;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: 1.4rem;
  color: var(--gold);
}
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `pnpm ng test --watch=false --include "src/app/components/{location,wishlists,footer}/*.spec.ts"`
Expected: PASS (3 tests).

- [ ] **Step 7: Add the sections to the page**

In `src/app/components/app/app.ts`, import `LocationSection` (`'../location/location'`), `Wishlists` (`'../wishlists/wishlists'`) and `Footer` (`'../footer/footer'`), and set `imports: [Header, Hero, InvitationDetails, LocationSection, Wishlists, Footer]`. Replace `app.html`:

```html
<app-header />

<main>
  <app-hero />
  <app-invitation />
  <app-location />
  <app-wishlists />
</main>

<app-footer />
```

- [ ] **Step 8: Verify the suite and the build, then commit**

Run: `pnpm ng test --watch=false && pnpm build`
Expected: PASS, and the build succeeds with no budget warnings.

```bash
git add src/app/components/location/ src/app/components/wishlists/ src/app/components/footer/ src/app/components/app/
git commit -m "feat: location map, wish lists and footer" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: RSVP service

**Files:**
- Create: `src/app/services/rsvp.service.ts`
- Test: `src/app/services/rsvp.service.spec.ts`

**Interfaces:**
- Consumes: `invitation.rsvpEndpoint` (Task 1).
- Produces:
  - `interface RsvpResponse { name: string; attending: boolean; count: number; message: string }`
  - `const RSVP_ENDPOINT: InjectionToken<string>`, which defaults to `invitation.rsvpEndpoint`
  - `const RSVP_TIMEOUT_MS = 10_000`
  - `class RsvpService` (`providedIn: 'root'`) with `submit(response: RsvpResponse): Promise<void>`. It resolves only when the server returns `{ ok: true }`, and rejects otherwise.

- [ ] **Step 1: Write the failing tests**

Create `src/app/services/rsvp.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { RSVP_ENDPOINT, RSVP_TIMEOUT_MS, RsvpResponse, RsvpService } from './rsvp.service';

const ENDPOINT = 'https://script.google.com/macros/s/test/exec';
const response: RsvpResponse = { name: 'Anna', attending: true, count: 2, message: 'Glæder mig' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('RsvpService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  function setup(endpoint = ENDPOINT): RsvpService {
    TestBed.configureTestingModule({ providers: [{ provide: RSVP_ENDPOINT, useValue: endpoint }] });
    return TestBed.inject(RsvpService);
  }

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('POSTs the response as text/plain JSON to avoid a CORS preflight', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await setup().submit(response);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'text/plain;charset=utf-8' });
    expect(JSON.parse(init.body)).toEqual(response);
  });

  it('sends count 0 when not attending', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await setup().submit({ ...response, attending: false, count: 4 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).count).toBe(0);
  });

  it('resolves when the server answers ok: true', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await expect(setup().submit(response)).resolves.toBeUndefined();
  });

  it('rejects when the server answers ok: false', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, error: 'invalid name' }));
    await expect(setup().submit(response)).rejects.toThrow();
  });

  it('rejects when the response is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Error</html>', { status: 200 }));
    await expect(setup().submit(response)).rejects.toThrow();
  });

  it('rejects on an HTTP error status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 500));
    await expect(setup().submit(response)).rejects.toThrow();
  });

  it('rejects on a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(setup().submit(response)).rejects.toThrow();
  });

  it('rejects after the timeout when the server never answers', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );

    const assertion = expect(setup().submit(response)).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(RSVP_TIMEOUT_MS);
    await assertion;
  });

  it('rejects without calling fetch when the endpoint is empty', async () => {
    await expect(setup('').submit(response)).rejects.toThrow('RSVP endpoint is not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm ng test --watch=false --include src/app/services/rsvp.service.spec.ts`
Expected: FAIL, because `./rsvp.service` cannot be resolved.

- [ ] **Step 3: Implement**

Create `src/app/services/rsvp.service.ts`:

```ts
import { inject, Injectable, InjectionToken } from '@angular/core';
import { invitation } from '../invitation.config';

export interface RsvpResponse {
  name: string;
  attending: boolean;
  count: number;
  message: string;
}

export const RSVP_ENDPOINT = new InjectionToken<string>('RSVP_ENDPOINT', {
  providedIn: 'root',
  factory: () => invitation.rsvpEndpoint,
});

export const RSVP_TIMEOUT_MS = 10_000;

function isAccepted(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as Record<string, unknown>)['ok'] === true;
}

@Injectable({ providedIn: 'root' })
export class RsvpService {
  private readonly endpoint = inject(RSVP_ENDPOINT);

  public async submit(response: RsvpResponse): Promise<void> {
    if (!this.endpoint) {
      throw new Error('RSVP endpoint is not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RSVP_TIMEOUT_MS);

    try {
      // text/plain keeps this a CORS "simple request"; Apps Script cannot answer a preflight.
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...response, count: response.attending ? response.count : 0 }),
        signal: controller.signal,
      });
      const body: unknown = await res.json().catch(() => null);

      if (!res.ok || !isAccepted(body)) {
        throw new Error('RSVP was not accepted');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm ng test --watch=false --include src/app/services/rsvp.service.spec.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/services/rsvp.service.ts src/app/services/rsvp.service.spec.ts
git commit -m "feat: RSVP service posting to Apps Script" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: RSVP form section

**Files:**
- Create: `src/app/components/rsvp/rsvp.ts`, `rsvp.html`, `rsvp.scss`
- Modify: `src/app/components/app/app.ts`, `src/app/components/app/app.html`
- Test: `src/app/components/rsvp/rsvp.spec.ts`

**Interfaces:**
- Consumes: `RsvpService.submit(response: RsvpResponse): Promise<void>` and `RsvpResponse` (Task 8); `invitation.rsvpDeadline` (Task 1); `provideDanishLocale` (Task 1).
- Produces: `class Rsvp` with selector `app-rsvp`. It renders `<section id="svar">`. Public: `form`, `state: Signal<'idle' | 'sending' | 'success' | 'error'>`, `submit(): Promise<void>`, `reset(): void`, `setAttending(value: boolean): void`, and `showError(field): boolean`.

- [ ] **Step 1: Write the failing tests**

Create `src/app/components/rsvp/rsvp.spec.ts`:

```ts
import { formatDate } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { provideDanishLocale } from '../../locale';
import { RsvpService } from '../../services/rsvp.service';
import { Rsvp } from './rsvp';

describe('Rsvp', () => {
  let fixture: ComponentFixture<Rsvp>;
  let el: HTMLElement;
  let submit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submit = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({ providers: [provideDanishLocale(), { provide: RsvpService, useValue: { submit } }] });
    fixture = TestBed.createComponent(Rsvp);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  const query = <T extends Element>(selector: string) => el.querySelector<T>(selector);
  const text = () => el.textContent ?? '';

  function type(selector: string, value: string): void {
    const input = query<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function clickButton(label: string): void {
    const button = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes(label))!;
    button.click();
    fixture.detectChanges();
  }

  async function submitForm(): Promise<void> {
    query('form')!.dispatchEvent(new Event('submit'));
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
  }

  it('shows the RSVP deadline', () => {
    expect(text()).toContain(`Svar venligst senest ${formatDate(invitation.rsvpDeadline, 'd. MMMM', 'da-DK')}`);
  });

  it('requires a name and an answer before sending', async () => {
    await submitForm();
    expect(text()).toContain('Skriv venligst dit navn');
    expect(text()).toContain('Vælg venligst ja eller nej');
    expect(submit).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only name', async () => {
    type('#rsvp-name', '   ');
    clickButton('Desværre ikke');
    await submitForm();
    expect(text()).toContain('Skriv venligst dit navn');
    expect(submit).not.toHaveBeenCalled();
  });

  it('only asks for the number of people when attending', () => {
    expect(query('#rsvp-count')).toBeNull();
    clickButton('Ja, jeg kommer');
    expect(query('#rsvp-count')).not.toBeNull();
    clickButton('Desværre ikke');
    expect(query('#rsvp-count')).toBeNull();
  });

  it('rejects a people count outside 1–10 when attending', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Ja, jeg kommer');
    type('#rsvp-count', '11');
    await submitForm();
    expect(text()).toContain('Vælg mellem 1 og 10 personer');
    expect(submit).not.toHaveBeenCalled();
  });

  it('ignores an invalid count once the guest declines', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Ja, jeg kommer');
    type('#rsvp-count', '');
    clickButton('Desværre ikke');
    await submitForm();
    expect(submit).toHaveBeenCalledWith({ name: 'Anna', attending: false, count: 0, message: '' });
  });

  it('rejects a message longer than 500 characters', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');
    fixture.componentInstance.form.controls.message.setValue('x'.repeat(501));
    await submitForm();
    expect(text()).toContain('Højst 500 tegn');
    expect(submit).not.toHaveBeenCalled();
  });

  it('sends the trimmed values', async () => {
    type('#rsvp-name', '  Anna  ');
    clickButton('Ja, jeg kommer');
    type('#rsvp-count', '2');
    type('#rsvp-message', '  Glæder mig  ');
    await submitForm();
    expect(submit).toHaveBeenCalledWith({ name: 'Anna', attending: true, count: 2, message: 'Glæder mig' });
  });

  it('disables the button while sending and ignores a second submit', async () => {
    let finish!: () => void;
    submit.mockReturnValue(new Promise<void>(resolve => (finish = resolve)));
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');

    await submitForm();
    const button = query<HTMLButtonElement>('button[type="submit"]')!;
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Sender…');

    await submitForm();
    expect(submit).toHaveBeenCalledTimes(1);

    finish();
    await new Promise(resolve => setTimeout(resolve));
  });

  it('thanks an attending guest by name', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Ja, jeg kommer');
    await submitForm();
    expect(query('form')).toBeNull();
    expect(text()).toContain('Tak, Anna! 🎉');
    expect(text()).toContain('Vi glæder os til at se dig.');
  });

  it('answers a declining guest kindly', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');
    await submitForm();
    expect(text()).toContain('Ærgerligt, Anna');
    expect(text()).toContain('Vi kommer til at savne dig!');
  });

  it('shows the error message when the service rejects and keeps the input', async () => {
    submit.mockRejectedValue(new Error('RSVP endpoint is not configured'));
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');
    await submitForm();

    expect(query('[role="alert"]')?.textContent).toContain('Noget gik galt – prøv igen, eller skriv til os på SMS.');
    expect(query<HTMLInputElement>('#rsvp-name')!.value).toBe('Anna');
    expect(query<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
    expect(text()).not.toContain('Tak, Anna');
  });

  it('pretends success without sending when the honeypot is filled', async () => {
    type('#rsvp-name', 'Bot');
    clickButton('Desværre ikke');
    fixture.componentInstance.form.controls.website.setValue('http://spam.example');
    await submitForm();
    expect(submit).not.toHaveBeenCalled();
    expect(text()).toContain('Ærgerligt, Bot');
  });

  it('lets the guest send a new answer', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');
    await submitForm();

    clickButton('Send et nyt svar');
    expect(query<HTMLInputElement>('#rsvp-name')!.value).toBe('');
    expect(text()).not.toContain('Skriv venligst dit navn');
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm ng test --watch=false --include src/app/components/rsvp/rsvp.spec.ts`
Expected: FAIL, because `./rsvp` cannot be resolved.

- [ ] **Step 3: Implement the component**

Create `src/app/components/rsvp/rsvp.ts`:

```ts
import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { invitation } from '../../invitation.config';
import { RsvpResponse, RsvpService } from '../../services/rsvp.service';

type RsvpState = 'idle' | 'sending' | 'success' | 'error';
type Field = 'name' | 'attending' | 'count' | 'message';

const notBlank: ValidatorFn = control => (typeof control.value === 'string' && control.value.trim() !== '' ? null : { required: true });

@Component({
  imports: [ReactiveFormsModule, DatePipe],
  selector: 'app-rsvp',
  styleUrl: './rsvp.scss',
  templateUrl: './rsvp.html',
})
export class Rsvp {
  private readonly rsvp = inject(RsvpService);
  private readonly submitAttempted = signal(false);

  protected readonly deadline = invitation.rsvpDeadline;

  public readonly state = signal<RsvpState>('idle');
  public readonly submitted = signal<{ name: string; attending: boolean } | null>(null);

  public readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [notBlank, Validators.maxLength(100)] }),
    attending: new FormControl<boolean | null>(null, Validators.required),
    count: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(10), Validators.pattern(/^\d+$/)],
    }),
    message: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    website: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    // The people count only matters for guests who are coming; a disabled control is excluded from validation.
    this.form.controls.attending.valueChanges.pipe(takeUntilDestroyed()).subscribe(attending => {
      if (attending === false) {
        this.form.controls.count.disable();
      } else {
        this.form.controls.count.enable();
      }
    });
  }

  public setAttending(value: boolean): void {
    this.form.controls.attending.setValue(value);
    this.form.controls.attending.markAsTouched();
  }

  public showError(field: Field): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitAttempted());
  }

  public async submit(): Promise<void> {
    if (this.state() === 'sending') {
      return;
    }

    this.submitAttempted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const { name, attending, count, message, website } = this.form.getRawValue();
    const isAttending = attending === true;
    const response: RsvpResponse = { name: name.trim(), attending: isAttending, count: isAttending ? count : 0, message: message.trim() };

    if (website) {
      this.succeed(response);
      return;
    }

    this.state.set('sending');

    try {
      await this.rsvp.submit(response);
      this.succeed(response);
    } catch {
      this.state.set('error');
    }
  }

  public reset(): void {
    this.form.reset();
    this.submitAttempted.set(false);
    this.submitted.set(null);
    this.state.set('idle');
  }

  private succeed(response: RsvpResponse): void {
    this.submitted.set({ name: response.name, attending: response.attending });
    this.state.set('success');
  }
}
```

Create `src/app/components/rsvp/rsvp.html`:

```html
<section class="section" id="svar">
  <div class="container narrow">
    <h2 class="section-title">Kommer du?</h2>

    @if (state() === 'success') {
      <div class="thanks" role="status">
        @if (submitted()?.attending) {
          <p class="thanks__title">Tak, {{ submitted()?.name }}! 🎉</p>
          <p>Vi glæder os til at se dig.</p>
        } @else {
          <p class="thanks__title">Ærgerligt, {{ submitted()?.name }}</p>
          <p>Vi kommer til at savne dig!</p>
        }
        <button class="link-btn" type="button" (click)="reset()">Send et nyt svar</button>
      </div>
    } @else {
      <p>Svar venligst senest {{ deadline | date: 'd. MMMM' }}</p>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label for="rsvp-name">Navn</label>
        <input id="rsvp-name" type="text" formControlName="name" autocomplete="name" maxlength="100" />
        @if (showError('name')) {
          <p class="error">Skriv venligst dit navn</p>
        }

        <fieldset>
          <legend>Deltager du?</legend>
          <div class="toggle">
            <button
              type="button"
              [class.on]="form.controls.attending.value === true"
              [attr.aria-pressed]="form.controls.attending.value === true"
              (click)="setAttending(true)"
            >
              Ja, jeg kommer 🎉
            </button>
            <button
              type="button"
              [class.on]="form.controls.attending.value === false"
              [attr.aria-pressed]="form.controls.attending.value === false"
              (click)="setAttending(false)"
            >
              Desværre ikke
            </button>
          </div>
          @if (showError('attending')) {
            <p class="error">Vælg venligst ja eller nej</p>
          }
        </fieldset>

        @if (form.controls.attending.value === true) {
          <label for="rsvp-count">Antal personer (inkl. dig selv)</label>
          <input id="rsvp-count" type="number" formControlName="count" min="1" max="10" inputmode="numeric" />
          @if (showError('count')) {
            <p class="error">Vælg mellem 1 og 10 personer</p>
          }
        }

        <label for="rsvp-message">Besked (valgfri)</label>
        <textarea id="rsvp-message" formControlName="message" rows="3" maxlength="500"></textarea>
        @if (showError('message')) {
          <p class="error">Højst 500 tegn</p>
        }

        <div class="hp" aria-hidden="true">
          <label for="rsvp-website">Website</label>
          <input id="rsvp-website" type="text" formControlName="website" tabindex="-1" autocomplete="off" />
        </div>

        @if (state() === 'error') {
          <p class="error error--box" role="alert">Noget gik galt – prøv igen, eller skriv til os på SMS.</p>
        }

        <button class="btn btn--block" type="submit" [disabled]="state() === 'sending'">
          {{ state() === 'sending' ? 'Sender…' : 'Send svar' }}
        </button>
      </form>
    }
  </div>
</section>
```

Create `src/app/components/rsvp/rsvp.scss`:

```scss
form {
  margin-top: 8px;
  text-align: left;
}

label,
legend {
  display: block;
  margin: 18px 0 6px;
  font-size: 0.75rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--gold);
}

fieldset {
  border: 0;
}

input,
textarea {
  width: 100%;
  padding: 12px 14px;
  color: var(--cream);
  background: var(--navy-alt);
  border: 1px solid var(--gold-line);
  border-radius: 12px;

  &:focus {
    outline: 2px solid var(--gold);
    outline-offset: 1px;
  }
}

input[type='number'] {
  width: 110px;
}

textarea {
  resize: vertical;
}

.toggle {
  display: flex;
  gap: 8px;

  button {
    flex: 1;
    padding: 12px;
    color: var(--cream);
    background: var(--navy-alt);
    border: 1px solid var(--gold-line);
    border-radius: 12px;
    cursor: pointer;

    &.on {
      color: var(--navy);
      background: var(--gold);
      border-color: var(--gold);
      font-weight: 700;
    }
  }
}

.error {
  margin-top: 6px;
  font-size: 0.85rem;
  color: var(--error);
}

.error--box {
  margin-top: 18px;
  padding: 10px 14px;
  border: 1px solid var(--error);
  border-radius: 12px;
}

.hp {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.btn--block {
  margin-top: 26px;
  padding: 14px;
  font-size: 1rem;
}

.thanks__title {
  margin-bottom: 6px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.8rem;
  color: var(--gold);
}

.link-btn {
  margin-top: 18px;
  color: var(--gold);
  background: none;
  border: 0;
  text-decoration: underline;
  cursor: pointer;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm ng test --watch=false --include src/app/components/rsvp/rsvp.spec.ts`
Expected: PASS (14 tests).

- [ ] **Step 5: Add the section to the page**

In `src/app/components/app/app.ts`, import `Rsvp` from `'../rsvp/rsvp'` and add it to `imports` after `Wishlists`. In `app.html`, add `<app-rsvp />` right after `<app-wishlists />` inside `<main>`.

- [ ] **Step 6: Verify the suite and the build, then commit**

Run: `pnpm ng test --watch=false && pnpm build`
Expected: PASS, and the build succeeds with no budget warnings. If `rsvp.scss` exceeds 4 kB, move the `input, textarea` rules into `src/styles.scss`.

```bash
git add src/app/components/rsvp/ src/app/components/app/
git commit -m "feat: RSVP form" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Google Apps Script backend

**Files:**
- Create: `apps-script/rsvp.gs`, `apps-script/README.md`

**Interfaces:**
- Consumes: the request body produced by `RsvpService` (Task 8): `{ name: string, attending: boolean, count: number, message: string }`, sent as `text/plain`.
- Produces: a web app that replies `{ ok: true }` or `{ ok: false, error: string }`, and a row `Tidspunkt | Navn | Deltager | Antal | Besked` in the sheet "Svar".

Apps Script runs only inside Google, so there is no automated test. The verification is the manual curl check in Step 3, which your human partner runs after deploying.

- [ ] **Step 1: Write the script**

Create `apps-script/rsvp.gs`:

```js
/**
 * RSVP endpoint for Kasper & Mette's 30th birthday site.
 * Deploy as a web app bound to the response spreadsheet – see README.md.
 */
const SHEET_NAME = 'Svar';
const HEADERS = ['Tidspunkt', 'Navn', 'Deltager', 'Antal', 'Besked'];

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const data = JSON.parse(e.postData.contents);
    const error = validate(data);
    if (error) {
      return json({ ok: false, error: error });
    }

    getSheet().appendRow([
      new Date(),
      safe(data.name.trim()),
      data.attending ? 'Ja' : 'Nej',
      data.attending ? data.count : 0,
      safe((data.message || '').trim()),
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'invalid request' });
  } finally {
    lock.releaseLock();
  }
}

function validate(data) {
  if (!data || typeof data !== 'object') return 'invalid body';
  if (typeof data.name !== 'string') return 'invalid name';

  const name = data.name.trim();
  if (name.length < 1 || name.length > 100) return 'invalid name';
  if (typeof data.attending !== 'boolean') return 'invalid attending';
  if (!Number.isInteger(data.count) || data.count < 0 || data.count > 10) return 'invalid count';
  if (data.attending && data.count < 1) return 'invalid count';
  if (data.message != null && (typeof data.message !== 'string' || data.message.length > 500)) return 'invalid message';

  return null;
}

/** Prevent spreadsheet formula injection from guest input. */
function safe(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
```

- [ ] **Step 2: Write the setup guide**

Create `apps-script/README.md`:

````markdown
# RSVP backend (Google Sheets)

Guest answers are saved as rows in a Google Sheet by a small Google Apps Script web app.

## Setup (about 5 minutes)

1. Create a new Google Sheet, e.g. "30 års – svar".
2. Open **Extensions → Apps Script**, delete the default code and paste in the contents of `rsvp.gs`. Save.
3. Click **Deploy → New deployment**, choose type **Web app** and set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, approve the permissions, and copy the **Web app URL** (it ends in `/exec`).
5. Paste the URL into `rsvpEndpoint` in `src/app/invitation.config.ts`, commit and push.

The sheet "Svar" and its header row are created automatically on the first answer.

## Check it works

```bash
curl -L -H 'Content-Type: text/plain' \
  -d '{"name":"Test","attending":true,"count":1,"message":"Test"}' \
  "https://script.google.com/macros/s/XXXX/exec"
```

Expected output: `{"ok":true}`, plus a new row in the sheet. Delete the test row afterwards.

## Updating the script

After editing the code, use **Deploy → Manage deployments → Edit → Version: New version**. This keeps the same URL.
Creating a *new deployment* instead gives a new URL, which you would then have to update in the config.

## Reading the answers

Each submission is one row. If a guest answers twice, go by the newest **Tidspunkt** for that name.
The total head count is `=SUMIF(C:C;"Ja";D:D)`.
````

- [ ] **Step 3: Commit**

```bash
git add apps-script/
git commit -m "feat: Google Apps Script RSVP backend" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: CI, GitHub Pages deploy and README

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- Modify (full rewrite): `README.md`

**Interfaces:**
- Consumes: `pnpm ng test --watch=false`, `pnpm build`, and the build output directory `dist/30-years/browser`.
- Produces: a deployed site at `https://svane20.github.io/30-years/`.

- [ ] **Step 1: Write the CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Test
        run: pnpm ng test --watch=false

      - name: Build
        run: pnpm build
```

- [ ] **Step 2: Write the deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Test
        run: pnpm ng test --watch=false

      - name: Build
        run: pnpm ng build --base-href /30-years/

      - name: SPA fallback
        run: cp dist/30-years/browser/index.html dist/30-years/browser/404.html

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/30-years/browser

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Verify the production build with the Pages base href**

Run: `pnpm ng build --base-href /30-years/ && grep -o '<base href="[^"]*"' dist/30-years/browser/index.html`
Expected: the build succeeds, and the output shows `<base href="/30-years/"`.

Run: `python3 -c "import yaml,sys; [yaml.safe_load(open(f)) for f in sys.argv[1:]]; print('ok')" .github/workflows/ci.yml .github/workflows/deploy.yml`
Expected: `ok`. If PyYAML is missing, skip this check. CI will report YAML errors on the first push.

- [ ] **Step 4: Rewrite the README**

Replace `README.md`:

````markdown
# Kasper & Mette 30 år

The invitation site for our joint 30th birthday: photos, party details with a countdown, a map, wish lists and an RSVP form.

Live: https://svane20.github.io/30-years/

## Filling in the details

All content lives in **`src/app/invitation.config.ts`**:

| Field | What to put there |
|---|---|
| `date` | Party start, e.g. `new Date('2026-11-14T18:00:00')` |
| `endTime` | e.g. `'til sent'` |
| `venue` | Name, address, Google Maps embed URL and share link (Google Maps → Share → *Embed a map* gives the embed URL) |
| `rsvpDeadline` | Last day to answer |
| `rsvpEndpoint` | The Apps Script URL – see [`apps-script/README.md`](apps-script/README.md) |
| `photos` | At least 3 entries; put the files in `public/assets/images/photos/` |
| `wishlists` | Exactly 3 entries: Kasper, Mette, Fælles |

**Photos:** use JPGs about 800px on the long edge and under about 200 kB each, in portrait orientation (5:6 fits the polaroids best).
Delete the `placeholder-*.svg` files once the real photos are in.

Run `pnpm ng test --watch=false` after editing. The config tests catch missing photos, the wrong number of wish lists and invalid dates.

## Development

```bash
pnpm install
pnpm start                  # http://localhost:4200
pnpm ng test --watch=false  # unit tests (Vitest)
pnpm build                  # production build
```

## Deployment

Every push to `master` runs the tests and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
One-time setup: in the GitHub repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
````

- [ ] **Step 5: Commit**

```bash
git add .github/ README.md
git commit -m "ci: test workflow and GitHub Pages deploy" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Page composition test and visual verification

**Files:**
- Test: `src/app/components/app/app.spec.ts`
- Possibly modify: any component stylesheet, to fix issues found in the visual check

**Interfaces:**
- Consumes: every section from Tasks 4–9.
- Produces: a verified page. Screenshots stay in the scratchpad and are not committed.

- [ ] **Step 1: Write the composition test**

Create `src/app/components/app/app.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideDanishLocale } from '../../locale';
import { App } from './app';

describe('App', () => {
  it('renders the sections in the agreed order, with every nav target present', () => {
    TestBed.configureTestingModule({ providers: [provideDanishLocale()] });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const ids = Array.from(el.querySelectorAll('main section[id]')).map(s => s.id);
    expect(ids).toEqual(['home', 'info', 'kort', 'oensker', 'svar']);

    for (const link of Array.from(el.querySelectorAll<HTMLAnchorElement>('.nav a'))) {
      expect(el.querySelector(link.getAttribute('href')!)).not.toBeNull();
    }

    expect(el.querySelector('main + app-footer')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the full suite**

Run: `pnpm ng test --watch=false`
Expected: every test PASSES. The app test passes straight away, because it checks the composition built in Tasks 4–9.

- [ ] **Step 3: Start the dev server**

Run in the background: `pnpm start`
Wait until `http://localhost:4200` responds (`curl -s -o /dev/null -w '%{http_code}' http://localhost:4200` returns `200`).

- [ ] **Step 4: Check the phone layout with the Playwright MCP**

1. `browser_resize` to 390×844, then `browser_navigate` to `http://localhost:4200`.
2. `browser_take_screenshot` with `fullPage: true`. Check that the hero shows three tilted polaroids around "Vi fylder 30!", and that the sections come in order with navy and gold styling, Fraunces headings, and no horizontal scroll.
3. `browser_evaluate` with `() => document.documentElement.scrollWidth <= window.innerWidth`. Expected: `true`.
4. `browser_click` on the hero and confirm a polaroid changes. `browser_wait_for` 5 s and confirm it rotates on its own.
5. Tap the hamburger, tap "Svar", and confirm the page scrolls to the RSVP form and the menu closes.
6. **Review Focus 1, in the real browser:** fill in the name, choose "Desværre ikke" and submit. With `rsvpEndpoint: ''`, the expected result is the red "Noget gik galt…" message and **no** thank-you.
7. `browser_console_messages`. Expected: no errors.

- [ ] **Step 5: Check the RSVP success path against a mocked endpoint**

1. **Temporarily** set `rsvpEndpoint: 'https://script.google.com/macros/s/TEST/exec'` in `invitation.config.ts`. **Do not commit this.**
2. With `browser_run_code_unsafe`, route the endpoint to a fake success before submitting:
   ```js
   async page => {
     await page.route('https://script.google.com/macros/s/TEST/exec', route =>
       route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
     );
   }
   ```
3. Reload, fill in "Test" with "Ja, jeg kommer 🎉" and 2 people, and submit. Expected: "Tak, Test! 🎉". Then click "Send et nyt svar" and expect an empty form.
4. Revert the config: `git checkout src/app/invitation.config.ts`.

- [ ] **Step 6: Check the desktop layout**

`browser_resize` to 1280×800, reload, and take a full-page screenshot. Check that the polaroids spread wider around the title, the nav links show inline (no hamburger), the wish lists sit in a row of three, the map is wide, and the header turns solid navy after scrolling.

- [ ] **Step 7: Fix what the visual check found**

For each visual defect, make the smallest stylesheet change that fixes it. Re-run `pnpm ng test --watch=false && pnpm build`, and take a new screenshot of the affected section.

- [ ] **Step 8: Stop the dev server and commit**

Stop the background `pnpm start`, then:

```bash
git add src/app/components/
git commit -m "test: page composition; visual polish" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
