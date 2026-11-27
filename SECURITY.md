# Security

## Reporting a problem

Please report security issues privately through
**[GitHub's private vulnerability reporting](https://github.com/vgor15/vgor15.github.io/security/advisories/new)**,
not in a public issue. You'll get a reply within a week. There is no bug bounty, but credit is gladly given.

`/.well-known/security.txt` points to the same place.

## What protects this site

Everything here is free: GitHub Pages, GitHub Actions and the security features GitHub gives public repositories.

**In the browser**
- A strict Content Security Policy on every page: scripts only from this site (plus cal.com when someone
  asks to book), no plugins, no inline scripts, no base-tag or form hijacking.
- A frame guard (`assets/js/frame-guard.js`) against clickjacking, because GitHub Pages can't send
  `X-Frame-Options`. The admin panel refuses every frame.
- `no-referrer`, `rel="noopener noreferrer"` on every new-tab link, no cookies, no third-party requests on load.
- `content.js` treats content as untrusted: stray tags can't open, quotes can't break out of attributes,
  and only `https://`, `/`, `#` and `mailto:` links survive. A test injects a malicious project to prove it.
- The email address is never in the HTML; it's assembled in memory when a visitor asks for it.

**The admin panel**
- Sveltia CMS pinned to an exact version with a Subresource Integrity hash, under its own CSP that only
  allows GitHub's API.
- Sign-in uses a fine-grained token limited to this one repository with Contents access only
  (see [docs/EDITING.md](docs/EDITING.md)).
- Uploaded photos are re-encoded in the browser, which strips Exif and GPS data.
- `noindex` and disallowed in `robots.txt`.

**Before anything goes live** (`.github/workflows/deploy.yml`)
- `scripts/check.mjs` blocks phone numbers, plain emails, keys and tokens, unsafe links, broken content
  and images with GPS data. An optional `PRIVACY_PATTERNS` secret adds private words to that list.
- Only an allow-list of files is published; tests, scripts, docs and config never reach the site.

**In the repository**
- gitleaks scans the full git history for secrets on every push and pull request.
- CodeQL (security-extended) scans the JavaScript and the workflows.
- OpenSSF Scorecard rates the repository's security practices weekly.
- Dependabot keeps the GitHub Actions and test tools up to date.
- Every workflow starts with no permissions and each job asks only for what it needs; every action is
  pinned to a full commit SHA; checkouts don't keep credentials.

## Limits

GitHub Pages doesn't allow custom HTTP headers, so `Strict-Transport-Security` (github.io is already
HSTS-preloaded), `X-Content-Type-Options`, `Permissions-Policy` and a header CSP can't be set.
The meta-tag CSP and the frame guard cover what they can.
