/* Runs in <head> before paint: theme + transition state, no flash. */
(function () {
  var d = document.documentElement, pref = "dark";
  try { pref = localStorage.getItem("vg-theme") || "dark"; } catch (e) {}
  var dark = pref === "dark" || (pref === "system" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  d.setAttribute("data-theme", dark ? "dark" : "light");
  d.setAttribute("data-pref", pref);
  d.classList.remove("no-js");
  try { if (sessionStorage.getItem("vg-veil")) d.classList.add("is-entering"); } catch (e) {}
})();
