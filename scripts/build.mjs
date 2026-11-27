#!/usr/bin/env node
/* Builds the deployable site into _site/:
   - copies what a visitor needs (and nothing else: no tests, docs, scripts or config)
   - embeds all content in every page, so pages render without extra requests
   - writes the SEO layer from content/*.json: <head> tags, JSON-LD, crawler-readable text,
     sitemap.xml, feed.xml, llms.txt, humans.txt, site.webmanifest and the IndexNow key
   No dependencies. Usage: node scripts/build.mjs */
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL, headTags, humans, llms, pageMeta, prerender, resolve, routeOf, rss, todayIST } from "./seo.mjs";

const ROOT = resolvePath(fileURLToPath(new URL("..", import.meta.url)));
const OUT = join(ROOT, "_site");
export const INDEXNOW_KEY = "4263b288c0d80406a6bed926c7695b75";
const CONTENT = ["site", "work", "about", "bench", "lab", "writing", "changelog", "now", "notes", "resume"];

// Only these top-level entries are published. Anything new must be added here on purpose.
const PUBLISH = [
  ".nojekyll", ".well-known", "404.html", "about.html", "admin", "assets", "bench.html", "changelog.html",
  "contact.html", "content", "index.html", "lab", "lab.html", "notes.html", "now.html", "record.html",
  "resume.html", "robots.txt", "writing", "writing.html", "favicon.ico", "board.html",
];

const readJson = async (p) => JSON.parse(await readFile(join(ROOT, p), "utf8"));
async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) yield* walk(join(dir, e.name));
    else yield join(dir, e.name);
  }
}
// Decode the few entities our own HTML uses; &amp; goes last so "&amp;quot;" can't turn into a quote.
const attr = (html, re) => { const m = re.exec(html); return m ? m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") : ""; };

/* Strip the head tags this build owns, then add the generated set right after the viewport meta. */
function rewriteHead(html, tags) {
  const cleaned = html
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\s*\n?/i, "")
    .replace(/[ \t]*<meta name="(description|robots|author|theme-color|google-site-verification|msvalidate\.01)"[^>]*>\s*\n?/gi, "")
    .replace(/[ \t]*<meta (property|name)="(og|article|profile|twitter):[^"]*"[^>]*>\s*\n?/gi, "")
    .replace(/[ \t]*<link rel="(canonical|me|alternate|apple-touch-icon|manifest)"[^>]*>\s*\n?/gi, "")
    .replace(/[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>\s*\n?/gi, "");
  return cleaned.replace(/(<meta name="viewport"[^>]*>\n?)/i, `$1${tags}\n`);
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const present = new Set(await readdir(ROOT));
  for (const name of PUBLISH) {
    if (!present.has(name)) continue;
    await cp(join(ROOT, name), join(OUT, name), {
      recursive: true,
      filter: (src) => !/(^|[\\/])(\.DS_Store|Thumbs\.db|\.gitkeep|zz-[^\\/]*)$/.test(src),
    });
  }

  /* ---------- content ---------- */
  const raw = {};
  for (const f of CONTENT) raw[f] = await readJson(`content/${f}.json`);
  let seo = { pages: {} };
  try { seo = await readJson("content/seo.json"); } catch { /* optional */ }
  const today = todayIST();
  const S = resolve({ ...raw, seo }, today);
  const embedded = `<script type="application/json" id="vg-content">${JSON.stringify(raw).replace(/</g, "\\u003c")}</script>\n  `;

  /* ---------- pages ---------- */
  let pages = 0;
  for await (const file of walk(OUT)) {
    const rel = relative(OUT, file).split("\\").join("/");
    if (!rel.endsWith(".html") || rel.startsWith("admin/")) continue;
    let html = await readFile(file, "utf8");
    const route = routeOf(rel);
    const m = pageMeta(route, S, {
      title: attr(html, /<title>([^<]*)<\/title>/i),
      description: attr(html, /<meta name="description" content="([^"]*)"/i),
    });
    html = rewriteHead(html, headTags(m, S));
    if (html.includes('<script src="/assets/js/content.js">')) html = html.replace('<script src="/assets/js/content.js">', embedded + '<script src="/assets/js/content.js">');
    html = html.replace(/(<main\b[^>]*>)/i, `$1\n${prerender(route, S)}`);
    await writeFile(file, html);
    pages++;
  }

  /* ---------- sitemap: lastmod from content dates, so it only changes when something did ---------- */
  const siteDate = (S.changelog[0] && S.changelog[0].date) || today;
  const urls = [
    ["/", siteDate], ["/about", siteDate], ["/lab", siteDate], ["/writing", (S.writing[0] && S.writing[0].date) || siteDate],
    ["/bench", siteDate], ["/contact", siteDate], ["/resume", siteDate], ["/now", (S.now && S.now.updated) || siteDate],
    ["/notes", siteDate], ["/changelog", siteDate], ["/board", siteDate],
    ...S.lab.map((l) => [`/lab/${l.slug}`, siteDate]),
    ...S.writing.map((w) => [`/writing/${w.slug}`, w.updated || w.date]),
  ];
  await writeFile(join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(([p, d]) => `  <url><loc>${SITE_URL}${p}</loc><lastmod>${d}</lastmod></url>`).join("\n") + `\n</urlset>\n`);

  /* ---------- feeds, text files, manifest, IndexNow ---------- */
  await writeFile(join(OUT, "feed.xml"), rss(S));
  await writeFile(join(OUT, "llms.txt"), llms(S));
  await writeFile(join(OUT, "humans.txt"), humans(S, today));
  await writeFile(join(OUT, `${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);
  await writeFile(join(OUT, "site.webmanifest"), JSON.stringify({
    name: S.name, short_name: S.first, description: S.seo.pages && S.seo.pages["/"] ? S.seo.pages["/"].description : S.tagline,
    start_url: "/", scope: "/", display: "standalone", lang: "en-IN",
    background_color: "#f3f1eb", theme_color: "#f3f1eb",
    icons: [
      { src: "/assets/img/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/img/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/assets/img/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }, null, 2));

  console.log(`Built _site/: ${pages} pages, ${urls.length} sitemap URLs, ${S.writing.length} feed items. Title today: ${S.title}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
