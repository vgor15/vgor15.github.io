/* TRANSMISSION (/contact): pressing Send launches the letter as a signal.
   A beam of light leaves the button and climbs off-screen while rings
   ripple out, then the visitor's mail app opens as before (contact.js). */
document.addEventListener("vg:ready", () => {
  "use strict";
  const send = document.querySelector(".l-send");
  if (!send || window.V.REDUCED) return;
  send.addEventListener("click", () => {
    if (send.disabled) return;
    const r = send.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const fx = document.createElement("div");
    fx.className = "tx"; fx.setAttribute("aria-hidden", "true");
    fx.style.left = x + "px"; fx.style.top = y + "px";
    fx.innerHTML = `<i class="tx__beam"></i><i class="tx__ring"></i><i class="tx__ring" style="animation-delay:.12s"></i><i class="tx__ring" style="animation-delay:.24s"></i>`;
    document.body.append(fx);
    setTimeout(() => fx.remove(), 1600);
  });
});
