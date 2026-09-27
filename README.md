# Kasper & Mette 30 år

The invitation site for our joint 30th birthday: photos, party details with a countdown, a map, wish lists and an RSVP form.

Live: https://svane20.github.io/30-years/

## Filling in the details

All content lives in **`src/app/invitation.config.ts`**:

| Field | What to put there |
|---|---|
| `date` | Party start, e.g. `new Date('2027-01-23T11:00:00')` |
| `venue` | Name, address, Google Maps embed URL and a google.com Maps link |
| `rsvpDeadline` | Last day to answer |
| `rsvpEndpoint` | The Apps Script URL – see [`apps-script/README.md`](apps-script/README.md) |
| `slides` | Exactly 3 slides, each with a `kasper`, `mette` and `together` photo; put the files in `public/assets/images/photos/` |
| `wishlists` | Exactly 3 entries: Kasper, Mette, Fælles |

**Photos:** use JPGs about 800px on the long edge and under about 200 kB each, in portrait orientation (5:6 fits the polaroids best).
The slideshow shows one slide at a time and changes every 5 seconds. Kasper and Mette swap sides every other slide (slide 1: Kasper left, Mette right); the together photo is always bottom centre.
Tapping a polaroid opens the photo full screen; each photo therefore has a `full` image too (the whole, uncropped photo, long edge ≤ 1600px).
Delete the `placeholder-*.svg` files once all 9 real photos are in.

Run `pnpm ng test --watch=false` after editing. The config tests catch a missing photo, a repeated photo, the wrong number of slides or wish lists, and invalid dates.

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
