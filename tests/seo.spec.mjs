import { test, expect } from "@playwright/test";

/* SEO checks on the built site (the HTML exactly as GitHub Pages serves it). Desktop only: SEO is device-independent. */
test.beforeEach(async ({}, info) => { test.skip(info.project.name !== "desktop", "SEO is the same on every device; checked once on desktop"); });

const SITE = "https://vgor15.github.io";
const INDEXED = [
  "/", "/about", "/lab", "/writing", "/bench", "/contact", "/resume", "/now", "/notes", "/changelog",
  "/lab/can-bus", "/lab/glyph-studio", "/lab/logic-analyzer", "/lab/register-flipper", "/lab/led-matrix", "/lab/shell",
  "/writing/two-ecus-one-bus", "/writing/a-shell-is-a-loop", "/writing/the-flag-that-never-changed", "/writing/pointers-at-the-lab-bench",
];
const meta = (html, re) => { const m = re.exec(html); return m ? m[1] : null; };

for (const path of INDEXED) {
  test(`SEO head and structured data: ${path}`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    const title = meta(html, /<title>([^<]*)<\/title>/);
    const desc = meta(html, /<meta name="description" content="([^"]*)"/);
    expect(title, "title").toBeTruthy();
    expect(title.length, `title is ${title.length} chars`).toBeLessThanOrEqual(65);
    expect(desc, "description").toBeTruthy();
    expect(desc.length, `description is ${desc.length} chars`).toBeGreaterThanOrEqual(50);
    expect(desc.length, `description is ${desc.length} chars`).toBeLessThanOrEqual(170);
    expect(meta(html, /<link rel="canonical" href="([^"]*)"/)).toBe(SITE + path);
    expect(html).toContain('<meta name="robots" content="index, follow');
    for (const p of ["og:title", "og:description", "og:url", "og:image", "og:image:alt", "og:type"]) expect(html, p).toContain(`property="${p}"`);
    for (const n of ["twitter:card", "twitter:title", "twitter:image"]) expect(html, n).toContain(`name="${n}"`);
    expect(html).toContain('type="application/rss+xml"');
    expect((html.match(/<title>/g) || []).length, "exactly one <title>").toBe(1);
    expect((html.match(/name="description"/g) || []).length, "exactly one description").toBe(1);

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    expect(blocks.length, "one JSON-LD block").toBe(1);
    const types = blocks[0]["@graph"].map((n) => n["@type"]);
    if (path === "/") expect(types).toEqual(expect.arrayContaining(["WebSite", "Person", "ItemList"]));
    else expect(types).toContain("BreadcrumbList");
    if (path.startsWith("/writing/")) expect(types).toContain("BlogPosting");
    if (path === "/about" || path === "/resume") expect(types).toContain("ProfilePage");
    expect(JSON.stringify(blocks[0]), "no email in structured data").not.toMatch(/@[a-z0-9-]+\.[a-z]{2,}/i);

    expect(html, "crawler-readable copy of the content").toContain('class="prerender"');
  });
}

test("titles and descriptions are unique across pages", async ({ request }) => {
  const seen = new Map();
  for (const path of INDEXED) {
    const html = await (await request.get(path)).text();
    for (const key of [meta(html, /<title>([^<]*)<\/title>/), meta(html, /<meta name="description" content="([^"]*)"/)]) {
      expect(seen.get(key), `"${key}" is used by ${seen.get(key)} and ${path}`).toBeUndefined();
      seen.set(key, path);
    }
  }
});

test("pages that must stay out of search say noindex", async ({ request }) => {
  for (const path of ["/record", "/this-page-does-not-exist"]) {
    expect(await (await request.get(path)).text(), path).toContain('<meta name="robots" content="noindex');
  }
});

test("crawlers without JavaScript can read the content and follow links", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/bench");
  await expect(page.locator(".prerender")).toBeVisible();
  await expect(page.locator(".prerender")).toContainText("VVDN Technologies");
  await page.goto("/");
  await expect(page.locator('.prerender a[href="/about"]')).toHaveCount(1);
  await ctx.close();
});

test("with JavaScript on, the crawler copy stays hidden", async ({ page }) => {
  await page.goto("/about");
  await page.locator(".hdr").waitFor({ state: "attached" });
  await expect(page.locator(".prerender")).toBeHidden();
});

test("sitemap lists every indexed page and each one answers 200", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ""));
  for (const path of INDEXED) expect(locs, path).toContain(path);
  for (const loc of locs) expect((await request.get(loc)).status(), loc).toBe(200);
  expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
});

test("robots.txt, feed, llms.txt, humans.txt, manifest, icons and IndexNow key are served", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  expect(robots).not.toMatch(/Disallow: \/\s*$/m);
  const feed = await (await request.get("/feed.xml")).text();
  expect(feed).toContain("<rss");
  expect((feed.match(/<item>/g) || []).length).toBeGreaterThan(0);
  expect(await (await request.get("/llms.txt")).text()).toContain("# Vyom Gor");
  expect((await request.get("/humans.txt")).status()).toBe(200);
  const manifest = await (await request.get("/site.webmanifest")).json();
  expect(manifest.icons.length).toBeGreaterThan(0);
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status(), icon.src).toBe(200);
  for (const p of ["/favicon.ico", "/assets/img/apple-touch-icon.png"]) expect((await request.get(p)).status(), p).toBe(200);
  expect((await request.get("/4263b288c0d80406a6bed926c7695b75.txt")).status()).toBe(200);
});

test("pages embed their content, so they render without fetching content files", async ({ page }) => {
  const contentRequests = [];
  page.on("request", (r) => { if (r.url().includes("/content/")) contentRequests.push(r.url()); });
  await page.goto("/bench");
  await page.locator(".hdr").waitFor({ state: "attached" });
  expect(contentRequests).toEqual([]);
});
