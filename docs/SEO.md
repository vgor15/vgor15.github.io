# SEO

Everything here is generated at deploy time by `scripts/build.mjs` and `scripts/seo.mjs` from the
content files, so an admin-panel save updates the SEO too. Edit titles and descriptions in
**/admin → SEO (search results)**.

## What every page gets

- **Title and description**: one of each, written for search (titles under 60 characters,
  descriptions 120–155). Set in `content/seo.json`; pages not listed there keep the ones in their HTML.
- **Canonical URL** on the clean address (`/about`, never `/about.html`).
- **Robots**: `index, follow, max-image-preview:large`; `/record` and the 404 page are `noindex`.
- **Open Graph and X cards**: title, description, 1200×630 image with alt text. Posts add
  `article:published_time`, section and tag; About adds `profile:*`.
- **Structured data (JSON-LD)**, one connected graph per page:
  - Home: `WebSite`, `Person` and an `ItemList` of projects (GitHub repos as `SoftwareSourceCode`)
  - About and Resume: `ProfilePage` with the `Person`: job title, employer, schools, skills, credentials, awards, profiles
  - Posts: `BlogPosting` with dates, author and reading time
  - Writing: `Blog`; Lab: `ItemList`; experiments: `CreativeWork`
  - Every page except Home: `BreadcrumbList`
- **Crawler-readable text**: the pages draw their content with JavaScript, so the build also writes the
  same text into the HTML. Search engines, link previews and AI crawlers that don't run scripts can read
  it, and so can people browsing without JavaScript. With JavaScript on it's hidden, so nobody sees it twice.
- **Identity links**: `rel="me"` to GitHub, LinkedIn and X.
- **Icons**: SVG favicon, `favicon.ico`, Apple touch icon, a web app manifest with 192 px, 512 px and maskable icons.

## Site-wide files

| File | What it's for |
|---|---|
| `/sitemap.xml` | Every indexable page; `lastmod` comes from content dates, so it only changes when something did |
| `/robots.txt` | Allows everything except `/admin/`; points to the sitemap |
| `/feed.xml` | RSS for the Writing posts (linked from every page) |
| `/llms.txt` | A plain summary for AI assistants and AI search |
| `/humans.txt` | Credits |
| `/<key>.txt` | IndexNow key: every deploy tells Bing, Yandex, Seznam and Naver which pages to recrawl |

Speed counts toward ranking (Core Web Vitals). Pages carry their own content, so nothing waits on extra
requests, and page changes use the browser's native transitions.

## One-time steps only you can do (free, about 10 minutes)

### Google Search Console
1. Open https://search.google.com/search-console and sign in with your Google account.
2. **Add property → URL prefix** → `https://vgor15.github.io/` → **Continue**.
3. Choose **HTML tag**. Copy only the code inside `content="…"`.
4. Paste it into **/admin → SEO → Google Search Console code**, press **Save**, wait a minute, press **Verify**.
5. In Search Console: **Sitemaps** → enter `sitemap.xml` → **Submit**.
6. Optional: **URL inspection** → paste `https://vgor15.github.io/` → **Request indexing**.

### Bing Webmaster Tools (Bing results are also used by DuckDuckGo and Yahoo)
1. Open https://www.bing.com/webmasters and sign in.
2. Choose **Import from Google Search Console** (after the steps above). That's it.

## Checking it

- Rich results: https://search.google.com/test/rich-results (paste any page URL)
- Schema: https://validator.schema.org
- Share previews: paste a link into LinkedIn's Post Inspector or an X post draft
- Lighthouse SEO score runs on every pull request (CI → Lighthouse budgets)

New pages and posts usually appear in Google within days to a few weeks. Rankings for your name come
first; topic searches take longer and grow with each post you publish.
