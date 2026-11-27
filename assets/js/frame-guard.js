/* Clickjacking guard. GitHub Pages can't send X-Frame-Options or a
   frame-ancestors header, so pages check for themselves. The site may be
   framed by its own pages (the /record tool does that); any other site
   gets a blank page and a jump to the real one. The admin panel adds
   data-strict and refuses every frame, its own origin included. */
(() => {
  const strict = document.currentScript && document.currentScript.hasAttribute("data-strict");
  if (window.top === window.self) return;
  let sameOrigin = false;
  try { sameOrigin = window.top.location.origin === location.origin; } catch (e) { sameOrigin = false; }
  if (sameOrigin && !strict) return;
  document.documentElement.style.display = "none";
  try { window.top.location.replace(location.href); } catch (e) { /* sandboxed: stay blank */ }
})();
