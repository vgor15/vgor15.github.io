# Deployment

The site is published by **GitHub Actions** (`.github/workflows/deploy.yml`) to GitHub Pages.

1. Something lands on `main`: an admin-panel save, a merged pull request, or the daily 05:47 IST run.
2. `scripts/build.mjs` copies the allow-listed files into `_site/` and writes `sitemap.xml`.
3. `scripts/check.mjs _site` runs the deploy guard (see [EDITING.md](EDITING.md#what-the-deploy-check-blocks)).
4. If it passes, `_site/` is uploaded and deployed. If it fails, nothing changes on the live site.

Repository **Settings → Pages → Source** must be set to **GitHub Actions**.

## Code changes: preview before live

Bigger changes go through a pull request. CI runs on it (tests on desktop, iPhone and iPad, accessibility,
HTML validation, Lighthouse, links, secret scan, CodeQL), and the **playwright-report** artifact has
screenshots of every main page on every device. Merge only when it's green and looks right.

## Rolling back

Any of these, from quickest to most thorough:

- **Undo one admin-panel save:** on GitHub, open the commit (they start with `content:`), press
  *Revert*… or simply edit the same thing back in the panel.
- **Re-publish an older version:** *Actions → Deploy*, open an earlier successful run, *Re-run all jobs*.
  (This republishes that run's commit until the next push to `main`.)
- **Revert a merged pull request:** open the pull request on GitHub and press *Revert*, then merge the revert.
- **Back to before the dynamic rebuild:** the tag `backup-before-dynamic` marks the last fully static version.

## Health checks

`.github/workflows/health.yml` checks the live site every 6 hours (pages answer, content parses,
no plain email in the HTML, `security.txt` not about to expire) and the outside links every Sunday.
A failed run makes GitHub email you.

GitHub pauses scheduled workflows in a public repository after 60 days without any commits. If that
happens, the Actions tab shows a banner with a button to turn them back on.
