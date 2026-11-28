# VYOM.EXE · The Living Machine: upgraded spec and build plan

## Context
Vyom turned down every redesign so far (minimal white+gold, three effect rounds, four colour directions) as "funky, not god-level". He pasted a brief for **VYOM.EXE**: an immersive computational universe of alien biology, futuristic machine architecture, impossible geometry and a cosmic setting, with five environments and a companion called VY-01. It must stay recruiter-friendly, free, and on GitHub Pages. He chose:
- **VVDN work: NDA-safe skills only.** Show general skills and what he learned. No company internals, code, client hardware, screenshots or numbers.
- **Upgrade the prompt first.** This document is that upgraded spec. Building starts only after he approves it.

The live site (vgor15.github.io) already has what the rebuild needs:
- `content/*.json` edited through `/admin` (Sveltia), with `content.js` building `window.SITE`
- an SEO build (`scripts/build.mjs`, `scripts/seo.mjs`)
- a privacy guard (`scripts/check.mjs`)
- Playwright, axe and Lighthouse CI; deploys through GitHub Actions; branch protection
- fun features: CAN capture, breadboard menu, `/board`, shell, 404 Breakout, party mode
- self-hosted three.js r160 (`assets/vendor/three.min.js`) and GSAP

The rebuild replaces the look and the navigation model and keeps all of that.

---

## 1. Creative direction (upgraded)

**Feel:** a living machine discovered in deep space. Part organism, part computer. It breathes, thinks and reacts. It's calm and confident: no neon dashboards, no glassmorphism everywhere.

| Token | Value | Use |
|---|---|---|
| void | `#030306` → `#07070d` | backgrounds, fog |
| bio-cyan | `#3ef2ff` | living tissue, signals, focus |
| synapse-violet | `#8b5cff` | depth, filaments, secondary light |
| ember-amber | `#ffb547` | rare highlights only: CTAs, "you are here", warnings |
| bone | `#e9ecf2` | text |
| mist | `#e9ecf280` | secondary text |

- **Type:**
  - Display: a sharp wide grotesk, e.g. *Unbounded* or *Syne*, self-hosted under OFL.
  - Body and UI: *Geist* (kept).
  - Data: *Geist Mono* (kept).
  - Big headings are set by hand, with optical letter-spacing and occasional glyph scramble on reveal.
- **Surfaces:** translucent membranes (fresnel rim and subsurface glow) instead of cards. UI chrome is thin 1 px hairlines with corner ticks, like instrument bezels.
- **Motion language:** slow organic breathing at rest (0.2–0.4 Hz). Fast and precise when the visitor acts. The camera moves like a steady drone and never shakes.
- **Sound (optional, off by default):** a low drone, plus synapse clicks on hover. Made with Web Audio; no audio files.

## 2. Information architecture: five environments

The renderer is a layer *over* real HTML. Every environment is a real URL with semantic content, so recruiters, search engines, screen readers and old phones always get the full text.

| Environment | URL | 3D experience | Real content (from `/admin`) |
|---|---|---|---|
| **SIGNAL** | `/` | The **Core**: a procedural organic heart (SDF raymarch or displaced icosphere with a custom shader) wrapped in GPU neural filaments. It wakes up, and your cursor is a probe it leans toward. The name resolves out of particle noise. | name, title (auto-switch on 27 Feb 2027), tagline, status, three CTAs |
| **MEMORY VAULT** | `/work` (new) + `/work/<slug>` | An impossible archive: stacked rings of "memory cells" in non-Euclidean corridors (portal stencil rooms). Each cell is a project. Opening one rebuilds it as an interactive exploded diagram: blocks, data flow, timeline. | `work.json` + new case-study fields (problem, architecture, what I did, evidence links). **VVDN entry = NDA-safe skills card, no internals.** |
| **MACHINE** | `/machine` (replaces `/lab` + `/board`) | An explorable "computer anatomy": orbiting modules for C, Linux, Embedded, systemd, Networking, Git and Debugging. Click a module to see a live mini-sim. Existing toys move in here: CAN Bus Lab, Glyph Studio, Logic Analyzer, Register Flipper, the `/board` switches, the CAN capture, and the imperfect_cell terminal. | `bench.json` skills + `lab.json` |
| **ORGANISM** | persistent on every page | **VY-01**, the companion (below). It also has a home page, `/vy-01`, with its own about page and a "feed it" mini-interaction. | n/a |
| **TRANSMISSION** | `/contact` (+ `/resume`) | The machine opens a channel: the letter form re-skinned as a transmission console, with résumé, GitHub, LinkedIn and booking. Sending plays a signal launch. | `site.json` socials, email (still Base64, built on click), cal.com |

**Kept as pages, re-skinned:** About becomes "origin log" inside SIGNAL's scroll, plus Writing, Now, Notes, Changelog and the playable 404. Every old URL keeps working; `/lab` and `/board` redirect-render to `/machine`.

### VY-01 behaviour engine
- A small deterministic state machine: `sleeping → idle → curious → exploring → excited`. The inputs are idle time, cursor speed and distance, page section, clicks, and visits. VY-01 never acts randomly: the same inputs always give the same behaviour.
- Its body is a soft procedural creature (metaball or shader blob) with tentacle filaments and one glowing eye, in an original design.
- It reacts to the environment: it explores project cells in the Vault, perches on modules in the Machine, and carries the message in Transmission.
- Progress is saved in localStorage only: environments visited and easter eggs found. VY-01 "grows" as you explore (more filaments, a brighter core).
- Accessibility: it can be hidden with one toggle, it's paused under reduced motion, and it's decorative to screen readers except for one announced greeting.

### Signature systems
- **Shaders:** organic core (fbm-displaced SDF, subsurface fake, fresnel rim), neural filaments (instanced line strips with GPU-animated pulses), particle field (GPGPU ping-pong in WebGL2), portal and impossible-room transitions (stencil and render-to-texture), screen-space scramble text.
- **Camera choreography:** one GSAP timeline per environment, plus scroll-scrubbed camera paths. Transitions between environments are "dives" through the core (shader dissolve + camera fly-through), with cross-document View Transitions as the fallback.
- **Terminal:** the imperfect_cell shell grows up. Commands: `ls /projects`, `open vault`, `cat about`, `vy wake`, `sudo` easter egg, `theme`, `sound on`, `goto machine`.
- **Easter eggs:** Konami (existing), hidden memory cell, VY-01 "evolution", terminal secrets, 404 Breakout (kept).
- **Optional audio-reactive:** when sound is on, the core and filaments pulse with the synthesized drone. No microphone.

## 3. NDA policy (hard rule)
- The VVDN section reads, for example: "Production-test software for embedded Linux devices: GPU encode stress testing with Vulkan, VA-API and FFmpeg hardware acceleration, storage provisioning automation, PCI device discovery, and systemd boot analysis."
- It never includes: client or product names, internal tool names, code, logs, screenshots, metrics, team details or customer hardware.
- `scripts/check.mjs` gets extra (secret) patterns through the `PRIVACY_PATTERNS` Actions secret. Before every push, the local guardrail grep runs with the private term list kept in memory.
- Nothing about the work is fabricated: no achievements, metrics or responsibilities that Vyom hasn't confirmed.

## 4. Architecture (on the existing static stack)
- **No framework switch:** vanilla JS + ES modules + self-hosted three.js r160. React Three Fiber is not compatible with the no-bundler static site, so it's not used. WebGPU (three/webgpu + TSL) is an optional enhancement later; WebGL2 is the baseline.
- **Optional build step:** esbuild in CI only, to bundle and minify the `assets/js/world/` modules. Locally the site still runs unbundled.
- **Folder layout:**
  - `assets/js/world/`:
    - `engine.js`: renderer, adaptive quality, render loop, visibility pause
    - `scenes/signal.js`, `scenes/vault.js`, `scenes/machine.js`, `scenes/transmission.js`
    - `director.js`: scene graph switch, camera timelines, transitions
    - `vy01/brain.js`: state machine
    - `vy01/body.js`: shader creature
    - `shaders/*.glsl.js`: shader sources as JS strings
    - `quality.js`: GPU tier detection, FPS governor, mobile caps
    - `audio.js`
    - `progress.js`
  - Content and text stay in `content/*.json` → `content.js` → semantic HTML. The 3D reads `window.SITE` and never owns content.
  - New content fields: `work.json` case studies (`problem`, `approach`, `diagram` nodes and edges, `evidence` links) and a `skills` map for the Machine modules. Both are editable in `/admin` (extend `admin/config.yml`).
- **Loading:**
  1. HTML and text paint first, under 2.5 s LCP.
  2. `engine.js` loads after first paint, only when WebGL2 is available and the visitor hasn't chosen the plain view.
  3. Each scene module loads lazily when its environment is visited.
- **Adaptive quality:**
  - Tiers: high (desktop GPU), mid, and low (mobile / integrated).
  - The governor drops pixel ratio, particle count, raymarch steps and post effects to hold 60 fps on desktop and 30–60 on mobile.
  - Low tier gets a static poster frame plus light motion.
- **Fallbacks:**
  - No WebGL2, reduced motion, or "Plain view" toggle (persisted) → the full 2D site.
  - The renderer is `aria-hidden`; all information stays in DOM.

## 5. Phases (each on its own branch → PR → CI green → merge)
| Phase | Deliverable | Done when |
|---|---|---|
| **0 · Audit** | Read-only audit of the repo, content, animations, deploy, responsiveness and performance baseline (Lighthouse and FPS on 3 pages), written to `docs/AUDIT.md` with the final architecture. | Audit reviewed by Vyom |
| **1 · Foundation** | New visual system (tokens, fonts, hairline UI), global nav and HUD restyle, `world/engine.js` + `director.js` + `quality.js` with an empty scene, Plain-view toggle, routing for `/work`, `/machine`, `/vy-01` | All existing pages work in the new skin; CI green; old URLs resolve |
| **2 · Living Core** | SIGNAL scene: organic core shader, neural filaments, particle name reveal, cursor probe | 60 fps on desktop, ≥30 on a mid phone; reduced motion shows the poster |
| **3 · Environments** | Vault corridors and memory cells, Machine modules (with existing toys moved in), Transmission console, dive transitions | Every environment reachable by keyboard, with an a11y path and no console errors |
| **4 · VY-01** | Companion body + deterministic brain + progress persistence + hide toggle | State transitions unit-tested; never blocks clicks or content |
| **5 · Real showcases** | Case studies with interactive architecture diagrams: CAN dashboard, imperfect_cell, Lab tools; VVDN as an NDA-safe skills card | Content reviewed by Vyom; privacy guard passes |
| **6 · Terminal, audio, eggs** | Terminal command set, optional drone + audio-reactive pulse, easter eggs | Sound never autoplays; eggs are documented privately |
| **7 · Hardening** | Performance pass, axe and keyboard audit, Safari, iPhone and Android checks, Lighthouse budgets updated, deploy | Lighthouse a11y ≥95, SEO ≥95, Performance ≥80 on mobile for the HTML layer; CI green; live verified |

After every phase:
1. Run `scripts/build.mjs`.
2. Run the Playwright suite on desktop, iPhone and iPad (extended with scene-boot tests and a "plain view has all content" test).
3. Check console errors and responsiveness at 390, 768 and 1440.
4. Report actual results, with screenshots sent to Vyom.

## 6. What Vyom needs to provide
- Wording approval for the NDA-safe VVDN skills card (I draft it, he confirms).
- For each public project he wants as a deep dive: confirm the facts and any links (repos, photos he's OK publishing).
- Optional: one reference image of a "creature" vibe he likes, for VY-01 (I design an original one either way).

## 7. Risks and honest limits
- **Scope:** this is a multi-session build. Each phase ships separately, so the site is never broken in between.
- **Mobile GPUs** limit raymarching; low tier uses a baked poster and mesh-based approximations.
- **SEO and recruiters** rely on the HTML layer, which stays complete.
- **No copying:** the art direction is original. Awwwards sites are used only as quality benchmarks.

## Verification
- **CI on every PR:** guard (privacy + NDA patterns), html-validate, Playwright (desktop/iPhone/iPad: boot, overflow, axe, touch, security, SEO, plus new scene and plain-view tests), Lighthouse, links, gitleaks, CodeQL.
- **Manual per phase:** browser-pane checks at 390, 768 and 1440 in light/dark/reduced motion; FPS read from the HUD; WebGL-off check (plain view complete).
- **Live:** after merge, the deploy run succeeds and the health check passes.
