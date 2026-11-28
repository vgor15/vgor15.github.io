/* Runs in <head> before paint: theme + transition state, no flash. */
(function () {
  var d = document.documentElement, pref = "light";
  try { pref = localStorage.getItem("vg-theme") || "light"; } catch (e) {}
  var dark = pref === "dark" || (pref === "system" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  d.setAttribute("data-theme", dark ? "dark" : "light");
  d.setAttribute("data-pref", pref);
  d.classList.remove("no-js");
  // opened inside the island reader: show only the page itself, none of the site chrome
  var framed = false; try { framed = window.top !== window.self && window.top.location.origin === location.origin; } catch (e) {}
  if (framed || /[?&]embed=1/.test(location.search)) d.classList.add("embed");
  // inside the reader, section links take you to that place on the island; toys and posts stay in the reader
  if (framed) document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a || a.target === "_blank") return;
    var u = new URL(a.href, location.href); if (u.origin !== location.origin) return;
    var p = u.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
    if (/^\/(lab|writing)\/[\w-]+$|^\/(resume|board|404|record)$/.test(p)) {
      if (!/[?&]embed=1/.test(u.search)) { e.preventDefault(); u.searchParams.set("embed", "1"); location.href = u.href; }
      return;
    }
    e.preventDefault();
    try { window.top.postMessage({ islGo: p }, location.origin); } catch (err) {}
  }, true);
  try { if (sessionStorage.getItem("vg-veil")) d.classList.add("is-entering"); } catch (e) {}
})();
