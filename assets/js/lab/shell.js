/* ============================================================
   imperfect_cell — browser edition of Vyom's C shell.
   Same prompt, same CELL_Jr error, same DBZ exit spinner.
   Used by /lab/shell (embedded) and the global ` overlay.
   ============================================================ */
(() => {
  if (window.VShell) return;
  let S = window.SITE; // content loads async; read it again when a shell is created
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const email = () => String.fromCharCode(...S.mail.u) + "@" + String.fromCharCode(...S.mail.d);

  /* ---------- virtual filesystem (built from SITE on first use) ---------- */
  const proj = (w) => `${w.title} (${w.year}) ${w.by}\n${w.summary}\n${/^https?:/.test(w.href) ? "repo: " + w.href : "page: " + w.href}`;
  let FS = null;
  const buildFS = () => {
  S = window.SITE;
  FS = {
    "/": { type: "dir", kids: ["home"] },
    "/home": { type: "dir", kids: ["vyom"] },
    "/home/vyom": { type: "dir", kids: ["about.txt", "skills.txt", "contact.txt", "projects", "lab", "writing", ".cellrc"] },
    "/home/vyom/about.txt": { type: "file", body: () => S.about.letter.join("\n\n") },
    "/home/vyom/skills.txt": { type: "file", body: () => S.bench.skills.map((g) => `[${g.group}]\n  ${g.items.join(" · ")}`).join("\n") },
    "/home/vyom/contact.txt": { type: "file", body: () => `email: run \`contact\`\ncall:  run \`book\`\n${S.socials.map((s) => s.label.toLowerCase() + ": " + s.url).join("\n")}` },
    "/home/vyom/.cellrc": { type: "file", body: () => `# Load config files, if any, not in our Imperfect Cell\nPS1="🦠[\\w]🦠 > "\nexport STATUS="${S.status}"` },
    "/home/vyom/projects": { type: "dir", kids: S.work.filter((w) => !w.hidden).map((w) => w.title.toLowerCase().replace(/[^a-z0-9]+/g, "_") + ".md") },
    "/home/vyom/lab": { type: "dir", kids: S.lab.map((l) => l.slug) },
    "/home/vyom/writing": { type: "dir", kids: S.writing.map((w) => w.slug + ".md") },
  };
  S.work.filter((w) => !w.hidden).forEach((w) => { FS["/home/vyom/projects/" + w.title.toLowerCase().replace(/[^a-z0-9]+/g, "_") + ".md"] = { type: "file", body: () => proj(w) }; });
  S.lab.forEach((l) => { FS["/home/vyom/lab/" + l.slug] = { type: "link", href: "/lab/" + l.slug, body: () => `${l.title}: ${l.desc}\n→ open lab/${l.slug}` }; });
  S.writing.forEach((w) => { FS["/home/vyom/writing/" + w.slug + ".md"] = { type: "link", href: "/writing/" + w.slug, body: () => `# ${w.title}\n${w.excerpt}\n→ open writing/${w.slug}.md` }; });
  };

  const resolve = (cwd, p) => {
    if (!p || p === "~") return "/home/vyom";
    let parts = (p.startsWith("/") ? p : (p.startsWith("~") ? "/home/vyom" + p.slice(1) : cwd + "/" + p)).split("/");
    const out = [];
    for (const x of parts) { if (!x || x === ".") continue; if (x === "..") out.pop(); else out.push(x); }
    return "/" + out.join("/");
  };
  const short = (p) => p.replace(/^\/home\/vyom/, "~") || "/";

  const PAGES = { home: "/", about: "/about", lab: "/lab", writing: "/writing", bench: "/bench", contact: "/contact", changelog: "/changelog", record: "/record" };

  function create(host, opts = {}) {
    if (!FS) buildFS();
    host.innerHTML = `
      <div class="term__bar"><i></i><i></i><i></i><span>cell — imperfect_cell v1 — 80×24</span></div>
      <div class="term__body" tabindex="-1"></div>`;
    const body = host.querySelector(".term__body");
    const state = { cwd: "/home/vyom", status: 0, hist: [], hi: -1, busy: false };
    let input;

    const print = (html, cls = "") => {
      const d = document.createElement("div");
      if (cls) d.className = cls;
      d.innerHTML = html;
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
      return d;
    };
    const promptHTML = () =>
      `<span>🦠</span><span class="t-c">[${esc(short(state.cwd))}]</span>${state.status ? `<span class="t-r">[${state.status}]</span>` : ""}<span>🦠 &gt;&nbsp;</span>`;
    const newPrompt = () => {
      const line = document.createElement("div");
      line.className = "term__line";
      line.innerHTML = promptHTML() + `<input class="term__input" type="text" aria-label="Shell input" autocomplete="off" autocapitalize="off" spellcheck="false">`;
      body.appendChild(line);
      input = line.querySelector("input");
      input.addEventListener("keydown", onKey);
      input.focus({ preventScroll: true });
      body.scrollTop = body.scrollHeight;
    };
    const freeze = (cmd) => {
      const line = input.parentElement;
      input.replaceWith(Object.assign(document.createElement("span"), { textContent: cmd }));
      return line;
    };

    const go = (href) => {
      print(`<span class="t-m">→ ${esc(href)}</span>`);
      setTimeout(() => (window.V ? window.V.navigate(href) : (location.href = href)), 250);
    };

    const CMDS = {
      help: () => print(
        `<span class="t-gold">imperfect_cell</span> — read → eval → execute → loop\n\n` +
        `builtins   cd  echo [-n]  env  exit  pwd  ls  cat  clear  history\n` +
        `extras     whoami  uname  date  open &lt;page|lab/…&gt;  contact  book  theme &lt;light|dark&gt;  man &lt;cmd&gt;\n` +
        `try        ls projects · cat about.txt · open lab/can-bus · echo -n hello`),
      whoami: () => print("vyom"),
      pwd: () => print(esc(state.cwd)),
      uname: (a) => print(a[1] === "-a" ? "imperfect_cell 1.0 vyom-bench armv4t (LPC2129 spirit) GNU/Browser" : "imperfect_cell"),
      date: () => print(new Date().toLocaleString("en-GB", { timeZone: S.tz }) + " IST"),
      echo: (a) => { let i = 1, nl = true; if (a[1] === "-n") { nl = false; i = 2; } print(esc(a.slice(i).join(" ")) + (nl ? "" : "<span class='t-m'>%</span>")); },
      env: () => print(esc([`USER=vyom`, `HOME=/home/vyom`, `SHELL=/bin/cell`, `PWD=${state.cwd}`, `CITY=${S.city}`, `ROLE=${S.role}`, `STATUS=${S.status}`, `EDITOR=vim`, `TERM=xterm-256color`].join("\n"))),
      clear: () => { body.innerHTML = ""; },
      history: () => print(state.hist.map((h, i) => `${String(i + 1).padStart(4)}  ${esc(h)}`).join("\n") || ""),
      ls: (a) => {
        const arg = a.slice(1).find((x) => !x.startsWith("-"));
        const target = arg ? resolve(state.cwd, arg) : state.cwd;
        const n = FS[target];
        if (!n) return fail(`ls: cannot access '${arg}': No such file or directory`, 2);
        if (n.type !== "dir") return print(esc(target.split("/").pop()));
        const all = a.includes("-la") || a.includes("-a") || a.includes("-al");
        const kids = n.kids.filter((k) => all || !k.startsWith("."));
        print(kids.map((k) => { const t = FS[target + "/" + k]; return t && t.type === "dir" ? `<span class="t-c">${esc(k)}/</span>` : t && t.type === "link" ? `<span class="t-g">${esc(k)}</span>` : esc(k); }).join("  "));
      },
      cd: (a) => {
        const t = resolve(state.cwd, a[1]);
        const n = FS[t];
        if (!a[1]) { state.cwd = "/home/vyom"; return; }
        if (!n) return fail(`cd failed: No such file or directory`, 1);
        if (n.type !== "dir") return fail(`cd failed: Not a directory`, 1);
        state.cwd = t;
      },
      cat: (a) => {
        if (!a[1]) return fail("cat: missing operand", 1);
        const t = resolve(state.cwd, a[1]);
        const n = FS[t];
        if (!n) return fail(`cat: ${a[1]}: No such file or directory`, 1);
        if (n.type === "dir") return fail(`cat: ${a[1]}: Is a directory`, 1);
        print(esc(n.body()));
      },
      open: (a) => {
        const arg = (a[1] || "").replace(/\.md$/, "");
        if (PAGES[arg]) return go(PAGES[arg]);
        const t = FS[resolve(state.cwd, a[1] || "")] || FS[resolve("/home/vyom", a[1] || "")] || FS[resolve("/home/vyom", (a[1] || "") + ".md")];
        if (t && t.href) return go(t.href);
        fail(`open: ${a[1] || ""}: try one of ${Object.keys(PAGES).join(", ")} or lab/<name>`, 1);
      },
      contact: () => {
        const m = email();
        print(`email: <a href="mailto:${m}" class="t-gold">${m}</a>`);
        if (navigator.clipboard && isSecureContext) navigator.clipboard.writeText(m).then(() => print(`<span class="t-m">(copied to clipboard)</span>`), () => {});
      },
      book: () => { if (window.V) { print(`<span class="t-m">opening cal.com…</span>`); setTimeout(() => window.V.openCal(), 200); } },
      theme: (a) => { if (!["light", "dark", "system"].includes(a[1])) return fail("theme: use light | dark | system", 1); window.V && window.V.setTheme(a[1]); print(`theme → ${a[1]}`); },
      man: (a) => print(a[1] ? `${esc(a[1])}(1) — see \`help\`. The real manual is the source: github.com/vgor15/imperfect_cell` : "What manual page do you want?"),
      sudo: () => fail("vyom is not in the sudoers file. This incident will be reported. (to nobody)", 1),
      make: () => print(`gcc -o cell cell.c builtin.c utils.c\n<span class="t-g">✓ built ./cell</span>`),
      exit: async () => {
        state.busy = true;
        print(`<span class="t-r">Shutting down...</span>`);
        const bar = print("", "t-y");
        const frames = ["[            ]", "[=           ]", "[===         ]", "[=====       ]", "[=======     ]", "[=========   ]", "[=========== ]", "[===========💥]"];
        for (const f of frames) { bar.textContent = f; await new Promise((r) => setTimeout(r, 110)); }
        print(`<span class="t-c">✅ EXIT ✅</span>`);
        state.busy = false;
        if (opts.onExit) setTimeout(opts.onExit, 450);
      },
    };
    const fail = (msg, code) => { print(`<span class="t-r">${esc(msg)}</span>`); state.status = code; return true; };

    const run = async (line) => {
      state.status = 0;
      const args = line.trim().split(/\s+/).filter(Boolean);
      if (!args.length) return;
      const fn = CMDS[args[0]];
      if (fn) await fn(args);
      else fail(`💥CELL_Jr failed💥: ${args[0]}: No such file or directory`, 69);
    };

    const complete = () => {
      const v = input.value;
      const parts = v.split(/\s+/);
      const last = parts[parts.length - 1];
      let pool;
      if (parts.length === 1) pool = Object.keys(CMDS);
      else {
        const dirPath = last.includes("/") ? resolve(state.cwd, last.slice(0, last.lastIndexOf("/")) || "/") : state.cwd;
        const prefix = last.includes("/") ? last.slice(0, last.lastIndexOf("/") + 1) : "";
        const n = FS[dirPath];
        pool = n && n.type === "dir" ? n.kids.map((k) => prefix + k + (FS[dirPath + "/" + k] && FS[dirPath + "/" + k].type === "dir" ? "/" : "")) : [];
        if (parts[0] === "open") pool = pool.concat(Object.keys(PAGES));
      }
      const hits = pool.filter((p) => p.startsWith(last));
      if (hits.length === 1) { parts[parts.length - 1] = hits[0]; input.value = parts.join(" ") + (hits[0].endsWith("/") ? "" : " "); }
      else if (hits.length > 1) print(hits.map(esc).join("  "), "t-m");
    };

    async function onKey(e) {
      if (state.busy) { e.preventDefault(); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        window.V && window.V.sfx && window.V.sfx("key");
        const cmd = input.value;
        freeze(cmd);
        if (cmd.trim()) { state.hist.push(cmd); state.hi = state.hist.length; }
        await run(cmd);
        newPrompt();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (state.hi > 0) { state.hi--; input.value = state.hist[state.hi]; }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (state.hi < state.hist.length - 1) { state.hi++; input.value = state.hist[state.hi]; } else { state.hi = state.hist.length; input.value = ""; }
      } else if (e.key === "Tab") {
        e.preventDefault();
        complete();
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault(); CMDS.clear(); newPrompt();
      } else if (e.key === "Escape" && opts.onExit) {
        opts.onExit();
      }
      e.stopPropagation();
    }

    const intro = document.createElement("div");
    intro.innerHTML = `<span class="t-g">Imperfect Cell v1</span> <span class="t-m">· the basic idea of a shell · type \`help\`</span>`;
    body.appendChild(intro);
    newPrompt();
    host.addEventListener("click", (e) => { if (!e.target.closest("a") && !getSelection().toString()) input && input.focus({ preventScroll: true }); });
    return { focus: () => input && input.focus({ preventScroll: true }), run: async (c) => { input.value = c; await onKey({ key: "Enter", preventDefault() {}, stopPropagation() {} }); } };
  }

  let overlayEl = null, overlayApi = null;
  window.VShell = {
    mount: (host) => create(host),
    overlay: ({ open, close } = {}) => {
      if (!overlayEl) {
        overlayEl = document.createElement("div");
        overlayEl.className = "term term--overlay";
        overlayEl.setAttribute("role", "dialog");
        overlayEl.setAttribute("aria-label", "imperfect_cell shell");
        document.body.appendChild(overlayEl);
        overlayApi = create(overlayEl, { onExit: () => close && close() });
      }
      open ? open(overlayEl) : overlayEl.classList.add("is-on");
      setTimeout(() => overlayApi.focus(), 60);
    },
  };
})();
