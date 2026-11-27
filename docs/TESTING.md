# Testing

Every pull request and every push to `main` runs `.github/workflows/ci.yml`:

| Job | What it checks |
|---|---|
| Content and privacy guard | `scripts/check.mjs` on the built site: valid content, no personal data, keys or GPS in images |
| HTML validation | `html-validate` (recommended rules) on every page |
| Browser tests | Playwright on desktop Chrome, iPhone 13 (WebKit) and iPad (WebKit) |
| Lighthouse budgets | Accessibility ≥ 95 and SEO ≥ 90 are required; performance and size budgets warn |
| Internal links | lychee, offline, on the built site |

`security.yml` adds gitleaks, CodeQL and OpenSSF Scorecard.

## The browser tests (`tests/site.spec.mjs`)

For each of the 21 pages, on each device:

- boots from the content files with no script errors and **no third-party requests**
- fits the screen with no sideways scrolling
- no serious or critical axe-core accessibility issues (WCAG 2.2 AA tags)
- has the CSP, `no-referrer`, the frame guard, no email address in the HTML, and safe new-tab links
- on iPhone: every field is at least 16px (so iOS doesn't zoom) and every button at least 24×24px

Plus: unknown URLs return the 404 page with status 404; injected HTML and `javascript:` links in content
are neutralised; the job title switches exactly at midnight IST on 27 Feb 2027; another site can't frame
the pages; the admin panel is `noindex`, frame-proof and SRI-pinned; content files hold no plain email.

`tests/visual.spec.mjs` attaches screenshots of the main pages on every device to the report.

## Running them yourself

Needs Node 22+.

```
npm install
npx playwright install --with-deps chromium webkit
npm test
node scripts/build.mjs && node scripts/check.mjs _site
```
