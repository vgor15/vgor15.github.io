# Architecture

A static site: plain HTML, CSS and JavaScript, no framework and no build step to run it.
GitHub Actions only copies an allow-list of files and checks them before publishing.

```
content/*.json ──► assets/js/content.js ──► window.SITE ──► core.js boots ──► "vg:ready" ──► page script
   (admin panel        fetch all 10 files,       one object       HUD, header,        e.g. home.js
    edits these)       sanitise, title switch    for every page   ⌘K, What's new       builds the wheels
```

## Load order on every page

1. `frame-guard.js` and `theme-boot.js` in `<head>`: clickjacking guard; light/dark before first paint.
2. Vendor libraries (`assets/vendor`): GSAP, ScrollTrigger, SplitText, Lenis, all self-hosted.
3. `content.js` starts fetching `content/*.json` at once (in parallel, `cache: no-cache` so an
   admin-panel save shows up on the next visit) and exposes `window.SITE_READY`.
4. `art.js`, `can.js`: drawing helpers (SVG plates, icons, CAN frame maths).
5. `core.js` waits for the DOM **and** `SITE_READY`, builds the shared chrome, then fires `vg:ready`.
6. The page's own script listens for `vg:ready` and renders from `window.V.S` (the same object as `window.SITE`).

If the content can't load, `content.js` shows a short "couldn't load, reload" box instead of a broken page.

## What content.js does to the data

- Resolves the job title: `site.title.current` until `site.title.switchOn` (India time), then `site.title.next`.
  Every `@title` in any content string becomes that title.
- Decodes `site.emailEncoded` (Base64) into character codes, so the address never appears as text.
- Formats dates (`2026-11-21` → `NOV 21 2026`), numbers posts, sorts What's new, drops drafts.
- Sanitises every string (no tag can open, no quote can close an attribute) and every link
  (only `https://`, `/`, `#`, `mailto:`).

## Folders

| Path | What |
|---|---|
| `content/` | All editable content (JSON) |
| `admin/` | Sveltia CMS page and its config |
| `assets/js/` | `core.js` (chrome), one script per page, `lab/` experiments |
| `assets/css/site.css` | All styles. Light/dark tokens at the top, iPhone/touch pass at the end |
| `assets/uploads/` | Images uploaded through the admin panel |
| `scripts/` | `serve.mjs` (local server), `build.mjs` (makes `_site/`), `check.mjs` (deploy guard) |
| `tests/` | Playwright tests |
| `.github/` | Workflows and Dependabot |
