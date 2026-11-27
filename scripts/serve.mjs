#!/usr/bin/env node
/* Local static server that behaves like GitHub Pages:
   /about -> about.html, /lab/ -> lab/index.html, unknown paths -> 404.html (status 404).
   No dependencies. Usage: node scripts/serve.mjs [port] [root]  (defaults: 4173, repo root) */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const ROOT = resolve(process.argv[3] || join(fileURLToPath(new URL(".", import.meta.url)), ".."));
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".yml": "text/yaml; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".pdf": "application/pdf", ".webmanifest": "application/manifest+json",
};
const BLOCKED = /(^|\/)(\.git|\.github|node_modules|tests|scripts)(\/|$)/;

async function isFile(p) { try { return (await stat(p)).isFile(); } catch { return false; } }

async function find(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, "");
  const base = resolve(ROOT, clean);
  if (base !== ROOT && !base.startsWith(ROOT + sep)) return null; // path traversal
  if (BLOCKED.test(clean.split(sep).join("/"))) return null;
  for (const c of [base, base + ".html", join(base, "index.html")]) if (await isFile(c)) return c;
  return null;
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, "http://localhost");
    let file = await find(pathname);
    let status = 200;
    if (!file) { file = join(ROOT, "404.html"); status = 404; }
    const body = await readFile(file);
    res.writeHead(status, { "content-type": TYPES[extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-cache" });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("server error");
  }
}).listen(PORT, () => console.log(`Serving ${ROOT} on http://localhost:${PORT}`));
