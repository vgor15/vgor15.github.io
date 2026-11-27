/* SEO for the static build: <head> tags, JSON-LD, crawler-readable content, RSS, llms.txt, humans.txt.
   Everything is generated from content/*.json so the admin panel stays the single source of truth.
   Used by scripts/build.mjs. No dependencies. */

export const SITE_URL = "https://vgor15.github.io";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SECTIONS = { about: "About", lab: "Lab", writing: "Writing", bench: "Bench", contact: "Contact", resume: "Resume", now: "Now", notes: "Notes", changelog: "Changelog", record: "Record" };
const NOINDEX = new Set(["/404", "/record"]);
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const abs = (p) => (/^https?:\/\//.test(p) ? p : SITE_URL + (p.startsWith("/") ? p : "/" + p));
const safeHref = (h) => (/^(https:\/\/|\/(?!\/))/.test(h || "") ? h : "");
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");
const fmtDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : ""; };

export const todayIST = (now = new Date()) => now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/** "about.html" -> "/about", "lab/can-bus.html" -> "/lab/can-bus", "index.html" -> "/" */
export const routeOf = (rel) => {
  const r = "/" + rel.replace(/\\/g, "/").replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
  return r.length > 1 ? r.replace(/\/$/, "") : "/";
};

/** Content in the shape the templates need: hidden/draft entries dropped, @title resolved for today. */
export function resolve(c, today = todayIST()) {
  const site = c.site || {};
  const t = site.title || {};
  const title = t.switchOn && today >= t.switchOn ? t.next || t.current : t.current || site.role;
  const swap = (v) => (typeof v === "string" ? v.replace(/@title\b/g, title)
    : Array.isArray(v) ? v.map(swap)
    : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)])) : v);
  return swap({
    ...site,
    title,
    work: (c.work || []).filter((w) => !w.hidden),
    about: c.about || {},
    bench: c.bench || {},
    lab: c.lab || [],
    writing: (c.writing || []).filter((w) => !w.draft),
    changelog: [...(c.changelog || [])].sort((a, b) => (a.date < b.date ? 1 : -1)),
    now: c.now || {},
    notes: c.notes || [],
    resume: c.resume || {},
    seo: c.seo || { pages: {} },
  });
}

/* ---------------------------------------------------------------- head */
export function pageMeta(route, S, fallback) {
  const seo = S.seo || { pages: {} };
  const own = (seo.pages || {})[route] || {};
  const post = route.startsWith("/writing/") ? S.writing.find((w) => `/writing/${w.slug}` === route) : null;
  const lab = route.startsWith("/lab/") ? S.lab.find((l) => `/lab/${l.slug}` === route) : null;
  const title = own.title || fallback.title || (post ? `${post.title} :: ${S.name}` : lab ? `${lab.title} :: ${S.name}` : S.name);
  const description = own.description || fallback.description || (post && post.excerpt) || (lab && lab.desc) || S.tagline;
  const canonical = SITE_URL + (route === "/" ? "/" : route);
  return { route, title, description, canonical, post, lab, noindex: NOINDEX.has(route) };
}

export function headTags(m, S) {
  const seo = S.seo || {};
  const image = abs(seo.image || "/assets/img/og.png");
  const imageAlt = seo.imageAlt || `${S.name}, ${S.role}`;
  const x = (S.socials || []).find((s) => /x\.com|twitter\.com/.test(s.url));
  const handle = x ? "@" + x.url.replace(/\/$/, "").split("/").pop() : "";
  const ogType = m.post ? "article" : m.route === "/about" ? "profile" : "website";
  const t = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    m.noindex ? `<meta name="robots" content="noindex, follow">` : `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`,
    m.noindex ? "" : `<link rel="canonical" href="${esc(m.canonical)}">`,
    `<meta name="author" content="${esc(S.name)}">`,
    `<meta name="theme-color" content="#f3f1eb" media="(prefers-color-scheme: light)">`,
    `<meta name="theme-color" content="#151412" media="(prefers-color-scheme: dark)">`,
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:site_name" content="${esc(seo.siteName || S.name)}">`,
    `<meta property="og:locale" content="${esc(seo.locale || "en_IN")}">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:url" content="${esc(m.canonical)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(imageAlt)}">`,
    ogType === "profile" ? `<meta property="profile:first_name" content="${esc(S.first)}"><meta property="profile:last_name" content="${esc((S.name || "").split(" ").slice(1).join(" "))}"><meta property="profile:username" content="${esc((S.github || {}).user || "")}">` : "",
    m.post ? `<meta property="article:published_time" content="${esc(m.post.date)}T09:00:00+05:30"><meta property="article:modified_time" content="${esc(m.post.updated || m.post.date)}T09:00:00+05:30"><meta property="article:author" content="${SITE_URL}/about"><meta property="article:section" content="${esc(m.post.tag)}"><meta property="article:tag" content="${esc(m.post.tag)}">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
    handle ? `<meta name="twitter:creator" content="${esc(handle)}">` : "",
    `<meta name="twitter:title" content="${esc(m.title)}">`,
    `<meta name="twitter:description" content="${esc(m.description)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
    `<meta name="twitter:image:alt" content="${esc(imageAlt)}">`,
    seo.googleVerification ? `<meta name="google-site-verification" content="${esc(seo.googleVerification)}">` : "",
    seo.bingVerification ? `<meta name="msvalidate.01" content="${esc(seo.bingVerification)}">` : "",
    `<link rel="alternate" type="application/rss+xml" title="${esc(S.name)} :: Writing" href="/feed.xml">`,
    ...(S.socials || []).map((s) => `<link rel="me" href="${esc(s.url)}">`),
    `<link rel="icon" href="/favicon.ico" sizes="48x48">`,
    `<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">`,
    `<link rel="manifest" href="/site.webmanifest">`,
    `<script type="application/ld+json">${jsonLd(graph(m, S, image))}</script>`,
  ];
  return t.filter(Boolean).map((l) => "  " + l).join("\n");
}

/* ---------------------------------------------------------------- JSON-LD */
function person(S) {
  const B = S.bench || {};
  const skills = [...new Set((B.skills || []).flatMap((g) => g.items || []))];
  const schools = (B.education || []).map((e) => ({ "@type": /university|college/i.test(e.where) ? "CollegeOrUniversity" : "EducationalOrganization", name: String(e.where || "").split(",")[0].trim() }));
  const creds = (B.certificates || []).filter((c) => !/scholarship/i.test(c.title)).map((c) => ({
    "@type": "EducationalOccupationalCredential", name: c.title,
    credentialCategory: /b\.?tech|diploma|degree/i.test(c.title) ? "degree" : "certificate",
    recognizedBy: { "@type": "Organization", name: c.org },
  }));
  const awards = (B.certificates || []).filter((c) => /scholarship/i.test(c.title)).map((c) => c.title);
  return {
    "@type": "Person", "@id": PERSON_ID, name: S.name, givenName: S.first,
    familyName: (S.name || "").split(" ").slice(1).join(" "),
    alternateName: (S.github || {}).user, url: `${SITE_URL}/`,
    image: { "@type": "ImageObject", url: abs(S.photo || "/assets/img/og.png") },
    jobTitle: S.title, description: `${S.title} in ${S.city}, ${S.country}. ${S.tagline}`,
    worksFor: { "@type": "Organization", name: S.company },
    address: { "@type": "PostalAddress", addressLocality: S.city, addressCountry: "IN" },
    nationality: { "@type": "Country", name: "India" },
    alumniOf: schools, knowsAbout: skills, award: awards.length ? awards : undefined,
    hasCredential: creds.length ? creds : undefined,
    sameAs: (S.socials || []).map((s) => s.url),
  };
}

function graph(m, S, image) {
  const url = m.canonical;
  const parts = m.route.split("/").filter(Boolean);
  const crumbs = [{ name: "Home", item: `${SITE_URL}/` }];
  if (parts[0]) crumbs.push({ name: SECTIONS[parts[0]] || parts[0], item: `${SITE_URL}/${parts[0]}` });
  if (parts[1]) crumbs.push({ name: (m.post && m.post.title) || (m.lab && m.lab.title) || parts[1], item: url });
  const pageType = ["/about", "/resume"].includes(m.route) ? "ProfilePage"
    : m.route === "/contact" ? "ContactPage"
    : ["/lab", "/writing", "/notes", "/changelog"].includes(m.route) ? "CollectionPage" : "WebPage";
  const page = {
    "@type": pageType, "@id": `${url}#webpage`, url, name: m.title, description: m.description,
    isPartOf: { "@id": WEBSITE_ID }, inLanguage: "en-IN",
    primaryImageOfPage: { "@type": "ImageObject", url: image },
    ...(crumbs.length > 1 ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    ...(pageType === "ProfilePage" ? { mainEntity: { "@id": PERSON_ID } } : { about: { "@id": PERSON_ID } }),
  };
  const g = [page];
  if (m.route === "/" || pageType === "ProfilePage") g.push(person(S));
  if (m.route === "/") {
    g.push({ "@type": "WebSite", "@id": WEBSITE_ID, url: `${SITE_URL}/`, name: S.name, description: m.description, inLanguage: "en-IN", publisher: { "@id": PERSON_ID }, author: { "@id": PERSON_ID } });
    g.push({
      "@type": "ItemList", name: "Selected work", itemListElement: S.work.map((w, i) => ({
        "@type": "ListItem", position: i + 1,
        item: /^https:\/\/github\.com\//.test(w.href)
          ? { "@type": "SoftwareSourceCode", name: w.title, description: w.summary, codeRepository: w.href, author: { "@id": PERSON_ID } }
          : { "@type": "CreativeWork", name: w.title, description: w.summary, ...(safeHref(w.href) ? { url: abs(w.href) } : {}), author: { "@id": PERSON_ID } },
      })),
    });
  }
  if (crumbs.length > 1) g.push({ "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.item })) });
  if (m.post) {
    g.push({
      "@type": "BlogPosting", "@id": `${url}#article`, headline: m.post.title, description: m.post.excerpt,
      datePublished: `${m.post.date}T09:00:00+05:30`, dateModified: `${m.post.updated || m.post.date}T09:00:00+05:30`,
      author: { "@id": PERSON_ID }, publisher: { "@id": PERSON_ID }, image, mainEntityOfPage: { "@id": `${url}#webpage` },
      articleSection: m.post.tag, keywords: [m.post.tag, "embedded", "C"], inLanguage: "en-IN", timeRequired: `PT${m.post.minutes || 5}M`,
    });
  }
  if (m.route === "/writing") {
    g.push({ "@type": "Blog", "@id": `${url}#blog`, name: `${S.name} :: Writing`, url, author: { "@id": PERSON_ID },
      blogPost: S.writing.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}/writing/${p.slug}`, datePublished: `${p.date}T09:00:00+05:30`, author: { "@id": PERSON_ID } })) });
  }
  if (m.route === "/lab") {
    g.push({ "@type": "ItemList", name: "Lab experiments", itemListElement: S.lab.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/lab/${l.slug}`, name: l.title })) });
  }
  if (m.lab) {
    g.push({ "@type": "CreativeWork", "@id": `${url}#work`, name: m.lab.title, description: m.lab.desc, url, author: { "@id": PERSON_ID }, isAccessibleForFree: true, genre: "Interactive simulation", inLanguage: "en-IN" });
  }
  return { "@context": "https://schema.org", "@graph": g };
}

/* ---------------------------------------------------------------- crawler-readable content */
/* The pages draw their content with JavaScript. This copy of the same text sits in the HTML for
   search engines, link previews and AI crawlers that don't run scripts, and for anyone browsing
   without JavaScript. site.css hides it as soon as JavaScript is on, so nobody sees it twice. */
const list = (items) => `<ul>${items.join("")}</ul>`;
const link = (href, text) => (safeHref(href) ? `<a href="${esc(href)}">${esc(text)}</a>` : esc(text));

export function prerender(route, S) {
  const out = [];
  const B = S.bench || {};
  const xp = () => (B.experience || []).map((x) => `<article><h3>${esc(x.role)} · ${esc(x.org)}</h3><p>${esc(x.when)} · ${esc(x.where)}</p><p>${esc(x.text)}</p>${list((x.points || []).map((p) => `<li>${esc(p)}</li>`))}</article>`).join("");
  const edu = () => list((B.education || []).map((e) => `<li><b>${esc(e.title)}</b>, ${esc(e.where)} (${esc(e.when)}). ${esc(e.note)}</li>`));
  const skills = () => list((B.skills || []).map((g) => `<li><b>${esc(g.group)}:</b> ${esc((g.items || []).join(", "))}</li>`));
  switch (route) {
    case "/":
      out.push(`<h2>${esc(S.name)}, ${esc(S.title)}</h2><p>${esc(S.tagline)} ${esc(S.role)} at ${esc(S.company)} in ${esc(S.city)}, ${esc(S.country)}.</p>`);
      out.push(`<h2>Selected work</h2>` + list(S.work.map((w) => `<li>${link(w.href, w.title)} (${esc(w.year)}): ${esc(w.summary)}</li>`)));
      break;
    case "/about":
      out.push(`<h2>About ${esc(S.first)}</h2>` + (S.about.letter || []).map((p) => `<p>${esc(p)}</p>`).join(""));
      out.push(`<h3>Journey</h3>` + list((S.about.journey || []).map((j) => `<li>${esc(j.place)}, ${esc(j.years)}: ${esc(j.note)}</li>`)));
      out.push(`<h3>Awards</h3>` + list((S.about.awards || []).map((a) => `<li>${esc(a.title)}: ${esc(a.note)}</li>`)));
      break;
    case "/bench":
      out.push(`<h2>Experience</h2>${xp()}<h2>Education</h2>${edu()}<h2>Skills</h2>${skills()}`);
      out.push(`<h2>Certificates</h2>` + list((S.certificates || B.certificates || []).map((c) => `<li><b>${esc(c.title)}</b>, ${esc(c.org)} (${esc(c.when)}). ${esc(c.note)}</li>`)));
      break;
    case "/resume": {
      const R = S.resume || {};
      out.push(`<h2>${esc(S.name)}: ${esc(R.headline || S.role)}</h2><p>${esc(R.summary)}</p><h3>Experience</h3>${xp()}`);
      out.push(`<h3>Projects</h3>` + (R.projects || []).map((p) => `<article><h4>${esc(p.title)}</h4><p>${esc(p.when)}${p.link ? " · " + esc(p.link) : ""}</p>${list((p.points || []).map((x) => `<li>${esc(x)}</li>`))}</article>`).join(""));
      out.push(`<h3>Education</h3>${edu()}<h3>Skills</h3>${skills()}`);
      break;
    }
    case "/lab":
      out.push(`<h2>Experiments</h2>` + list(S.lab.map((l) => `<li>${link(`/lab/${l.slug}`, l.title)}: ${esc(l.desc)}</li>`)));
      break;
    case "/writing":
      out.push(`<h2>Posts</h2>` + list(S.writing.map((p) => `<li>${link(`/writing/${p.slug}`, p.title)} (${esc(fmtDate(p.date))}): ${esc(p.excerpt)}</li>`)));
      break;
    case "/now": {
      const N = S.now || {};
      out.push(`<h2>Now</h2><p>Updated ${esc(fmtDate(N.updated))}.</p>`);
      for (const [k, label] of [["building", "Building"], ["learning", "Learning"], ["next", "Next"]]) out.push(`<h3>${label}</h3>` + list((N[k] || []).map((x) => `<li>${esc(x)}</li>`)));
      break;
    }
    case "/notes":
      out.push(`<h2>Notes</h2>` + S.notes.map((n) => `<article><h3>${esc(n.title)}</h3><p>${esc(n.tag)}: ${esc(n.body)}</p></article>`).join(""));
      break;
    case "/changelog":
      out.push(`<h2>Changelog</h2>` + list(S.changelog.map((c) => `<li>${esc(fmtDate(c.date))} · ${esc(c.type)} · ${link(c.href, c.title)}: ${esc(c.desc)}</li>`)));
      break;
    case "/contact":
      out.push(`<h2>Contact</h2><p>Write to ${esc(S.first)} with the letter form on this page (it opens your email app), or find him here:</p>` + list((S.socials || []).map((s) => `<li>${link(s.url, s.label)}</li>`)));
      break;
    default:
      if (route.startsWith("/writing/")) out.push(`<h2>More writing</h2>` + list(S.writing.filter((p) => `/writing/${p.slug}` !== route).map((p) => `<li>${link(`/writing/${p.slug}`, p.title)}</li>`)));
      if (route.startsWith("/lab/")) out.push(`<h2>More experiments</h2>` + list(S.lab.filter((l) => `/lab/${l.slug}` !== route).map((l) => `<li>${link(`/lab/${l.slug}`, l.title)}</li>`)));
  }
  const nav = [["/", "Home"], ["/about", "About"], ["/lab", "Lab"], ["/writing", "Writing"], ["/bench", "Bench"], ["/resume", "Resume"], ["/now", "Now"], ["/notes", "Notes"], ["/contact", "Contact"], ["/changelog", "Changelog"]];
  out.push(`<nav aria-label="Site pages">${list(nav.map(([h, t]) => `<li>${link(h, t)}</li>`))}</nav>`);
  return `<section class="prerender" data-prerender>\n${out.join("\n")}\n</section>`;
}

/* ---------------------------------------------------------------- feeds and text files */
export function rss(S, now = new Date()) {
  const items = S.writing.map((p) => {
    const url = `${SITE_URL}/writing/${p.slug}`;
    return `    <item>\n      <title>${esc(p.title)}</title>\n      <link>${url}</link>\n      <guid isPermaLink="true">${url}</guid>\n      <pubDate>${new Date(`${p.date}T09:00:00+05:30`).toUTCString()}</pubDate>\n      <category>${esc(p.tag)}</category>\n      <description>${esc(p.excerpt)}</description>\n    </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${esc(S.name)} :: Writing</title>\n    <link>${SITE_URL}/writing</link>\n    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>\n    <description>${esc(`Posts by ${S.name} on embedded C, CAN, ARM7 and Linux.`)}</description>\n    <language>en-in</language>\n    <lastBuildDate>${now.toUTCString()}</lastBuildDate>\n${items}\n  </channel>\n</rss>\n`;
}

export function llms(S) {
  const md = (s) => String(s ?? "").replace(/[\[\]]/g, "");
  return [
    `# ${S.name}`, "",
    `> ${S.title} at ${S.company} in ${S.city}, ${S.country}. Writes C and C++ close to the hardware: ARM7 (LPC2129), CAN 2.0B, I2C, SPI, UART, and Linux system programming. ${S.tagline}`, "",
    "This is a personal portfolio. Contact is through the letter form on /contact; the email address is deliberately not published as text, and there is no phone number.", "",
    "## Pages", "",
    `- [About](${SITE_URL}/about): background, from Kutch to Bengaluru`,
    `- [Bench](${SITE_URL}/bench): experience, education, skills and certificates`,
    `- [Resume](${SITE_URL}/resume): printable web resume`,
    `- [Now](${SITE_URL}/now): what he is working on and learning`,
    `- [Notes](${SITE_URL}/notes): short today-I-learned notes`,
    `- [Contact](${SITE_URL}/contact): write a letter or book a call`, "",
    "## Projects", "",
    ...S.work.map((w) => `- ${safeHref(w.href) ? `[${md(w.title)}](${abs(w.href)})` : md(w.title)} (${w.year}): ${md(w.summary)}`), "",
    "## Writing", "",
    ...S.writing.map((p) => `- [${md(p.title)}](${SITE_URL}/writing/${p.slug}) (${p.date}): ${md(p.excerpt)}`), "",
    "## Lab (interactive, in the browser)", "",
    ...S.lab.map((l) => `- [${md(l.title)}](${SITE_URL}/lab/${l.slug}): ${md(l.desc)}`), "",
    "## Elsewhere", "",
    ...(S.socials || []).map((s) => `- [${md(s.label)}](${s.url})`), "",
  ].join("\n");
}

export function humans(S, today) {
  return [
    "/* TEAM */", `Developer: ${S.name}`, `Role: ${S.title}`, `Location: ${S.city}, ${S.country}`,
    ...(S.socials || []).map((s) => `${s.label}: ${s.url}`), "",
    "/* THANKS */", `${(S.credit || {}).text || ""} (${(S.credit || {}).url || ""})`, "",
    "/* SITE */", `Last update: ${today.replace(/-/g, "/")}`, "Language: English", "Standards: HTML, CSS, JavaScript",
    "Components: GSAP, Lenis, Sveltia CMS", "Fonts: Geist, Geist Mono", "Hosting: GitHub Pages", "",
  ].join("\n");
}
