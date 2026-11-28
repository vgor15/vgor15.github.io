# Phase 0 audit · VYOM.EXE rebuild

This is a read-only audit of vgor15.github.io as of 28 Nov 2026 (`main` @ merge of PR #4), done before the VYOM.EXE rebuild (spec: `docs/VYOM-EXE.md`, in Phase 1).

## 1. What exists

| Area | State |
|---|---|
| Hosting | GitHub Pages via Actions (`deploy.yml`). `scripts/build.mjs` builds an allow-listed `_site/`, `scripts/check.mjs` guards it, and IndexNow pings after each push |
| Framework | No framework, no bundler. 23 static HTML pages, vanilla JS, one stylesheet (`assets/css/site.css`, 1,077 lines, 80 KB) |
| Content | 11 files in `content/*.json` (22 KB), edited in `/admin` (Sveltia CMS 5.0.2). `content.js` builds `window.SITE` (embedded inline at build time) |
| Global layer | `core.js` (36 KB): HUD, header, ⌘K palette, What's new, themes, veil/View Transitions, shell overlay, sound. Exposes `window.V` |
| Fun layer | `fun.js` (27 KB): glass menu, CAN capture, breadboard menu, party mode, facts. Plus `schematic.js`, `ink.js`, `breakout.js` and `board.js` |
| Libraries (self-hosted) | three.js r160 UMD (654 KB, `/board` only), GSAP 3.13 + ScrollTrigger + SplitText, Lenis 1.3 |
| Reusable modules | `window.CAN` (frame builder, CRC-15, LCD renderer), `window.ART` (SVG plates and icons), `window.VShell` (terminal), `window.V` (UI helpers) |
| SEO | Per-page meta, JSON-LD graph, crawler copy, sitemap, RSS, `llms.txt`, icons, manifest |
| Security | CSP meta and frame guard on every page; SRI-pinned admin; privacy guard; gitleaks, CodeQL and Scorecard; branch protection |
| Tests | Playwright: 23 tests across `site`, `seo` and `visual` specs, × 3 devices (desktop Chrome, iPhone 13 WebKit, iPad WebKit). Also axe, html-validate, Lighthouse budgets and lychee |

## 2. Baseline to protect (live home, desktop, warm CDN)
- 15 requests, about 65 KB transferred (374 KB decoded); DOMContentLoaded about 0.27 s; load about 0.67 s; no third-party requests.
- From CI: Lighthouse accessibility ≥ 95, SEO ≥ 90, no third-party requests. Performance is warn-only.
- No horizontal overflow on any page at 390 / 810 / 1440. iOS fields are 16 px; tap targets are at least 24 px (44 px for main controls).

## 3. Findings
1. **Lighthouse reports aren't uploaded.** `actions/upload-artifact` skips hidden folders, so `.lighthouseci/` is never saved. Fix: add `include-hidden-files: true` (Phase 1).
2. **There is one global stylesheet.** The new visual system needs tokens split from components (`tokens.css`, `base.css`, `world.css`) so the old and new skins can sit side by side during the migration.
3. **three.js is UMD r160**, the last UMD build. The rebuild should use the ES-module build (`three.module.min.js`) with import maps, so scenes can be lazy `import()`ed and tree-shaken later. CSP `script-src 'self'` already allows self-hosted modules.
4. **The home page loads `art.js` and `can.js` up front**, though only the wheel and the capture need them. The world loader should lazy-load all decorative code after first paint.
5. **The HTML content layer is solid.** Every page already renders its full text without the 3D, and the build adds crawler copy. The 3D layer can sit on top without touching recruiter access.
6. **VVDN content** in `content/bench.json` is already generic. The NDA-safe skills card for the Vault will be drafted in Phase 5 for Vyom to approve; no internal names may be added.

## 4. Decisions for the rebuild
- **Keep:**
  - the content pipeline, admin, SEO build, guard, CI, security and URLs
  - the CAN, ART, VShell, breadboard, capture, Breakout, board and party code (they move into the Machine)
- **Replace:**
  - the visual system (white and gold → the void / bio-cyan / synapse-violet / ember-amber tokens)
  - the home wheels (→ the SIGNAL core)
  - the Lab index (→ the MACHINE)
- **Add:**
  - `assets/js/world/` (engine, director, quality, scenes, vy01, shaders) as ES modules
  - `/work`, `/machine` and `/vy-01` pages
  - a Plain-view toggle
- **Performance:**
  - The text layer paints first.
  - The world engine loads after first paint, only with WebGL2 and when Plain view is off.
  - Each scene is imported lazily.
  - Quality tiers are capped on mobile.
- **Testing additions:**
  - scene boot with no console errors
  - Plain view and WebGL-off show all content
  - the render loop pauses when the tab is hidden
  - VY-01 state machine unit tests

## 5. Phase 1 scope (next)
1. Tokens and fonts for the new identity, the hairline UI kit, and a restyle of the header, HUD, menu, palette and footer.
2. `world/engine.js` (renderer, resize, visibility pause, adaptive DPR), `world/quality.js` (GPU tier and FPS governor), `world/director.js` (scene registry and lazy import), with an empty void scene and starfield.
3. The Plain-view toggle (persisted), `/work`, `/machine` and `/vy-01` routes as pages, and redirect-render for `/lab` and `/board` kept working.
4. CI: upload the Lighthouse reports, and add scene-boot and plain-view tests.
