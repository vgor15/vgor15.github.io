/* VYOM.EXE world boot.
   The page renders and becomes usable first; the 3D world joins afterwards,
   only with WebGL2, dark theme, normal motion, and Plain view off.
   A header toggle switches to Plain view (remembered). */
const html = document.documentElement;
const pref = { get() { try { return localStorage.getItem("vg-plain") === "1"; } catch (e) { return false; } }, set(v) { try { localStorage.setItem("vg-plain", v ? "1" : "0"); } catch (e) {} } };
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGL2 = (() => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch (e) { return false; } })();

let engine = null, loading = null;
html.classList.toggle("plain", pref.get());

const wanted = () => !pref.get() && !REDUCED && hasGL2 && html.getAttribute("data-theme") === "dark";

async function on() {
  if (engine || loading || !wanted()) return;
  loading = (async () => {
    const [{ createEngine }, { direct }] = await Promise.all([import("./engine.js"), import("./director.js")]);
    if (!wanted()) return;
    engine = createEngine();
    window.VWORLD = engine; // for tests and later phases
    await direct(engine, document.body.dataset.page || "home");
  })().catch((e) => console.warn("[world] off:", e && e.message)).finally(() => (loading = null));
}
function off() { if (engine) { engine.destroy(); engine = null; window.VWORLD = null; } }

function toggleButton() {
  const right = document.querySelector(".hdr__right");
  if (!right || right.querySelector(".js-plain")) return;
  const b = document.createElement("button");
  b.type = "button"; b.className = "iconbtn js-plain";
  b.title = "Plain view: switch the 3D world off";
  b.innerHTML = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.8 13.4 5v6L8 14.2 2.6 11V5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M2.6 5 8 8.2 13.4 5M8 8.2v6" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
  const sync = () => { const plain = pref.get(); b.setAttribute("aria-pressed", String(!plain)); b.setAttribute("aria-label", plain ? "Turn the 3D world on" : "Plain view: turn the 3D world off"); };
  b.addEventListener("click", () => { const plain = !pref.get(); pref.set(plain); html.classList.toggle("plain", plain); sync(); plain ? off() : on(); });
  sync(); right.prepend(b);
}

const start = () => { toggleButton(); const go = () => on(); ("requestIdleCallback" in window) ? requestIdleCallback(go, { timeout: 1200 }) : setTimeout(go, 400); };
if (window.SITE && document.querySelector(".hdr")) start(); else document.addEventListener("vg:ready", start, { once: true });
document.addEventListener("vg:theme", (e) => (e.detail && e.detail.dark ? on() : off()));
