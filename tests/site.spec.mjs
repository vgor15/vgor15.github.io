import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  "/", "/about", "/lab", "/writing", "/bench", "/contact", "/record", "/changelog", "/resume", "/now", "/notes",
  "/lab/can-bus", "/lab/glyph-studio", "/lab/logic-analyzer", "/lab/register-flipper", "/lab/led-matrix", "/lab/shell",
  "/writing/two-ecus-one-bus", "/writing/a-shell-is-a-loop", "/writing/the-flag-that-never-changed", "/writing/pointers-at-the-lab-bench",
];
const ORIGIN = "http://localhost:4173";
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;

/* Open a page the way a visitor would, collecting anything that went wrong. */
async function open(page, path) {
  const problems = [];
  page.on("pageerror", (e) => problems.push(`script error: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") problems.push(`console error: ${m.text()}`); });
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(ORIGIN) && !/^(data|blob|about):/.test(u)) problems.push(`third-party request on load: ${u}`);
  });
  await page.addInitScript(() => { try { sessionStorage.setItem("vg-booted", "1"); } catch (e) {} });
  const res = await page.goto(path);
  await page.locator(".hdr").waitFor({ state: "attached" });
  return { res, problems };
}

for (const path of PAGES) {
  test.describe(`page ${path}`, () => {
    test("boots from the content files without errors", async ({ page }) => {
      const { res, problems } = await open(page, path);
      expect(res.status()).toBe(200);
      await expect(page.locator(".content-error")).toHaveCount(0);
      await page.waitForTimeout(600);
      expect(problems).toEqual([]);
    });

    test("fits the screen (no sideways scrolling)", async ({ page }) => {
      await open(page, path);
      await page.waitForTimeout(500);
      const { sw, w } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }));
      expect(sw, `page is ${sw}px wide on a ${w}px screen`).toBeLessThanOrEqual(w + 1);
    });

    test("has no serious accessibility problems", async ({ page }, info) => {
      test.skip(info.project.name === "ipad", "covered by desktop and iPhone");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page, path);
      await page.waitForTimeout(800);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const bad = r.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
      expect(bad).toEqual([]);
    });

    test("security basics are in place", async ({ page, request }) => {
      const html = await (await request.get(path)).text();
      expect(html).toContain('http-equiv="Content-Security-Policy"');
      expect(html).toContain("object-src 'none'");
      expect(html).toContain('<meta name="referrer" content="no-referrer">');
      expect(html).toContain("/assets/js/frame-guard.js");
      const emails = (html.match(new RegExp(EMAIL.source, "g")) || []).filter((m) => !/@example\.(com|org)$/.test(m));
      expect(emails, "an email address is written into the HTML").toEqual([]);
      await open(page, path);
      const unsafe = await page.$$eval('a[target="_blank"]', (as) => as.filter((a) => !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel)).map((a) => a.href));
      expect(unsafe, "new-tab links without rel=noopener noreferrer").toEqual([]);
    });

    test("touch screens: 16px fields and finger-sized buttons", async ({ page }, info) => {
      test.skip(info.project.name !== "iphone", "iPhone only");
      await open(page, path);
      await page.waitForTimeout(500);
      const res = await page.evaluate(() => {
        const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
        const zoomy = [...document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, textarea')]
          .filter((e) => vis(e) && parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => e.className || e.tagName);
        const tiny = [...document.querySelectorAll("button, [role=button], select, .btn")]
          .filter((e) => vis(e) && !e.closest(".sr-only"))
          .filter((e) => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; })
          .map((e) => `${e.className || e.tagName} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
        return { zoomy, tiny };
      });
      expect(res.zoomy, "fields under 16px make iOS zoom in").toEqual([]);
      expect(res.tiny, "buttons smaller than 24x24 (WCAG 2.2 AA)").toEqual([]);
    });
  });
}

test("unknown pages get the 404 page with a 404 status", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res.status()).toBe(404);
  await expect(page.locator(".hdr")).toBeAttached();
});

test("content can't inject markup or javascript: links", async ({ page }) => {
  await page.route("**/content/work.json", async (route) => {
    const res = await route.fetch();
    const work = await res.json();
    work[0].title = 'Evil<img src=x id=pwned onerror="window.__pwned=1">';
    work[0].href = "javascript:window.__pwned=1";
    work[0].summary = '"><svg id=pwned2 onload="window.__pwned=1">';
    await route.fulfill({ response: res, json: work });
  });
  await open(page, "/");
  await page.waitForTimeout(800);
  expect(await page.locator("#pwned, #pwned2").count()).toBe(0);
  expect(await page.locator('a[href^="javascript:"]').count()).toBe(0);
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
});

test.describe("job title switches by itself on 27 Feb 2027 (India time)", () => {
  for (const [when, expected] of [["2027-02-26T23:30:00+05:30", "Embedded Software Engineer (Trainee)"], ["2027-02-27T00:30:00+05:30", "Embedded Software Engineer"]]) {
    test(`on ${when}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(when));
      await open(page, "/bench");
      await expect(page.locator(".badge__role")).toHaveText(expected);
    });
  }
});

test("the site refuses to be framed by another site", async ({ page }) => {
  await page.setContent(`<iframe src="${ORIGIN}/about" width="800" height="600"></iframe>`);
  const frame = page.frameLocator("iframe");
  await expect.poll(async () => {
    const f = page.frames().find((x) => x.url().startsWith(ORIGIN));
    return f ? f.evaluate(() => getComputedStyle(document.documentElement).display) : "loading";
  }).toBe("none");
  void frame;
});

test("admin panel is not indexed and refuses frames", async ({ request }) => {
  const html = await (await request.get("/admin/")).text();
  expect(html).toContain('<meta name="robots" content="noindex, nofollow, noarchive">');
  expect(html).toMatch(/frame-guard\.js" data-strict/);
  expect(html).toMatch(/integrity="sha256-[A-Za-z0-9+/=]+"/);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin/");
});

test("content files never contain a plain email address", async ({ request }) => {
  for (const f of ["site", "work", "about", "bench", "lab", "writing", "changelog", "now", "notes", "resume"]) {
    const text = await (await request.get(`/content/${f}.json`)).text();
    expect(text, `content/${f}.json`).not.toMatch(EMAIL);
  }
});
