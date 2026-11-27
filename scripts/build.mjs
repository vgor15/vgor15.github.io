#!/usr/bin/env node
/* Builds the deployable site into _site/:
   - copies everything a visitor needs (and nothing else: no tests, docs, scripts or config)
   - writes sitemap.xml from the content files
   No dependencies. Usage: node scripts/build.mjs */
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT = join(ROOT, "_site");
const SITE_URL = "https://vgor15.github.io";

// Only these top-level entries are published. Anything new must be added here on purpose.
const PUBLISH = [
  ".nojekyll", ".well-known", "404.html", "about.html", "admin", "assets", "bench.html", "changelog.html",
  "contact.html", "content", "index.html", "lab", "lab.html", "notes.html", "now.html", "record.html",
  "resume.html", "robots.txt", "writing", "writing.html",
];

const json = async (p) => JSON.parse(await readFile(join(ROOT, p), "utf8"));

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

  // sitemap.xml from the content files
  const [lab, writing] = await Promise.all([json("content/lab.json"), json("content/writing.json")]);
  const today = new Date().toISOString().slice(0, 10);
  const pages = ["/", "/about", "/lab", "/writing", "/bench", "/contact", "/resume", "/now", "/notes", "/changelog"]
    .map((p) => ({ loc: p, lastmod: today }))
    .concat(lab.map((l) => ({ loc: `/lab/${l.slug}`, lastmod: today })))
    .concat(writing.filter((w) => !w.draft).map((w) => ({ loc: `/writing/${w.slug}`, lastmod: w.date || today })));
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages.map((p) => `  <url><loc>${SITE_URL}${p.loc}</loc><lastmod>${p.lastmod}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`;
  await writeFile(join(OUT, "sitemap.xml"), xml);
  console.log(`Built _site/ with ${PUBLISH.filter((n) => present.has(n)).length} entries and ${pages.length} sitemap URLs.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
