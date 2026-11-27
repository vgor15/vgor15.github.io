#!/usr/bin/env node
/* Pre-deploy guard. Fails (exit 1) if the content or the files about to be published
   contain something that must never go live. No dependencies.
   Usage: node scripts/check.mjs [dir]   (default: the repo root; CI runs it on _site)

   Checks
   1. content/*.json parses and has the fields the pages need; links are https:// or /
   2. no phone numbers, email addresses, keys or tokens in published text files
   3. no GPS / Exif metadata in published JPEG or WebP images
   4. optional extra patterns from the PRIVACY_PATTERNS env var (a GitHub Actions secret),
      so private words never have to be written into this public repo */
import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIR = resolve(process.argv[2] || ROOT);
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const SKIP_DIRS = new Set([".git", "node_modules", "_site", "test-results", "playwright-report", ".lighthouseci", "vendor", "fonts"]);
const TEXT = new Set([".html", ".js", ".mjs", ".css", ".json", ".txt", ".xml", ".yml", ".svg", ".md", ".webmanifest"]);
const IMAGES = new Set([".jpg", ".jpeg", ".webp", ".png"]);

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* walk(join(dir, e.name)); }
    else yield join(dir, e.name);
  }
}

/* ---------- 1. content ---------- */
const isUrl = (v) => v === "" || /^(https:\/\/|\/(?!\/)|#|mailto:)/.test(v);
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
function need(obj, fields, where) {
  for (const f of fields) if (obj == null || obj[f] === undefined || obj[f] === null || obj[f] === "") err(`${where}: missing "${f}"`);
}
function urls(v, where, key = "") {
  if (typeof v === "string") { if (/^(href|url|img|photo|file|resume)$/.test(key) && !isUrl(v)) err(`${where}.${key}: link must start with https:// or / (got "${v}")`); return; }
  if (Array.isArray(v)) return v.forEach((x, i) => urls(x, `${where}[${i}]`, key));
  if (v && typeof v === "object") for (const k of Object.keys(v)) urls(v[k], where, k);
}
async function checkContent() {
  const cdir = join(DIR, "content");
  let files;
  try { files = (await readdir(cdir)).filter((f) => f.endsWith(".json")); } catch { return err("content/ folder is missing"); }
  const c = {};
  for (const f of files) {
    try { c[f.replace(/\.json$/, "")] = JSON.parse(await readFile(join(cdir, f), "utf8")); }
    catch (e) { err(`content/${f}: not valid JSON (${e.message})`); }
  }
  for (const req of ["site", "work", "about", "bench", "lab", "writing", "changelog", "now", "notes", "resume"]) if (!(req in c)) err(`content/${req}.json is missing`);
  if (c.site) {
    need(c.site, ["name", "role", "tagline", "status", "emailEncoded", "tz"], "site");
    need(c.site.title, ["current", "next", "switchOn"], "site.title");
    if (c.site.title && !isDate(c.site.title.switchOn)) err(`site.title.switchOn must be YYYY-MM-DD`);
    try { const e = Buffer.from(c.site.emailEncoded || "", "base64").toString("utf8"); if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e)) err("site.emailEncoded does not decode to an email address"); }
    catch { err("site.emailEncoded is not Base64"); }
  }
  for (const [name, fields] of [["work", ["slug", "title", "year", "summary"]], ["lab", ["slug", "title", "desc"]], ["writing", ["slug", "title", "date", "excerpt"]], ["notes", ["title", "body"]], ["changelog", ["type", "date", "title", "href"]]]) {
    if (!Array.isArray(c[name])) { if (name in c) err(`${name}.json must be a list`); continue; }
    const slugs = new Set();
    c[name].forEach((x, i) => {
      need(x, fields, `${name}[${i}]`);
      if (x.slug) { if (slugs.has(x.slug)) err(`${name}: duplicate slug "${x.slug}"`); slugs.add(x.slug); }
      if (x.date && !isDate(x.date)) err(`${name}[${i}].date must be YYYY-MM-DD (got "${x.date}")`);
    });
  }
  for (const w of c.writing || []) if (!w.draft) {
    try { await stat(join(DIR, "writing", `${w.slug}.html`)); } catch { err(`writing "${w.slug}" has no page at writing/${w.slug}.html`); }
  }
  for (const l of c.lab || []) { try { await stat(join(DIR, "lab", `${l.slug}.html`)); } catch { err(`lab "${l.slug}" has no page at lab/${l.slug}.html`); } }
  for (const t of (c.bench && c.bench.testimonials) || []) need(t, ["quote", "name", "role"], "bench.testimonials[]");
  for (const [k, v] of Object.entries(c)) urls(v, k);
}

/* ---------- 2 + 4. text patterns ---------- */
const RULES = [
  ["phone number", /(?<![\w.#-])(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?![\w])/g],
  ["email address", /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g],
  ["GitHub token", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{40,}/g],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ["AWS key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/g],
];
const EMAIL_OK = /(@users\.noreply\.github\.com$|@example\.(com|org)$|@\d+x\.)/i;
let extra = null;
if (process.env.PRIVACY_PATTERNS) {
  try { extra = new RegExp(process.env.PRIVACY_PATTERNS, "gi"); } catch { err("PRIVACY_PATTERNS is not a valid regular expression"); }
}

/* ---------- 3. image metadata ---------- */
function imageMeta(buf, ext) {
  if (ext === ".jpg" || ext === ".jpeg") {
    const i = buf.indexOf(Buffer.from("Exif\0\0"));
    if (i < 0) return null;
    return buf.indexOf(Buffer.from([0x88, 0x25]), i) > 0 || buf.indexOf(Buffer.from([0x25, 0x88]), i) > 0 ? "GPS" : "Exif";
  }
  if (ext === ".webp") return buf.indexOf(Buffer.from("EXIF")) > 0 ? "Exif" : null;
  if (ext === ".png") return buf.indexOf(Buffer.from("eXIf")) > 0 ? "Exif" : null;
  return null;
}

async function checkFiles() {
  for await (const file of walk(DIR)) {
    const rel = relative(DIR, file).split("\\").join("/");
    const ext = extname(file).toLowerCase();
    if (DIR === ROOT && /^(docs|tests|scripts|\.github)\//.test(rel)) continue; // not published
    if (TEXT.has(ext)) {
      const text = await readFile(file, "utf8");
      for (const [label, re] of RULES) {
        for (const m of text.matchAll(re)) {
          if (label === "email address" && EMAIL_OK.test(m[0])) continue;
          err(`${rel}: looks like a ${label}: "${m[0].slice(0, 6)}…"`);
        }
      }
      if (extra) for (const m of text.matchAll(extra)) err(`${rel}: matches a private pattern ("${m[0].slice(0, 3)}…")`);
    } else if (IMAGES.has(ext)) {
      const meta = imageMeta(await readFile(file), ext);
      if (meta === "GPS") err(`${rel}: image contains GPS location data`);
      else if (meta) warn(`${rel}: image contains Exif metadata`);
    }
  }
}

await checkContent();
await checkFiles();
for (const w of warnings) console.warn(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);
console.log(errors.length ? `\n${errors.length} problem(s). Nothing was published.` : `\nAll checks passed (${warnings.length} warning(s)).`);
process.exit(errors.length ? 1 : 0);
