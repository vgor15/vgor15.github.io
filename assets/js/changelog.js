document.addEventListener("vg:ready", () => {
  const { qs, S, I, useLenis, reveals, splitIn, store } = window.V;
  useLenis();
  const months = {};
  S.changelog.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).forEach((c) => {
    const d = new Date(c.date + "T00:00:00");
    const key = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    (months[key] = months[key] || []).push(c);
  });
  qs(".log").innerHTML = Object.entries(months).map(([m, list]) => `
    <div class="log__month" data-rv>${m}</div>
    ${list.map((c) => {
      const ext = /^https?:/.test(c.href);
      return `<a class="log__item" data-rv href="${c.href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>
        <span class="tag">${c.type}</span>
        <span><span class="log__t">${c.title}</span><br><span class="log__d">${c.desc}</span></span>
        <span class="wn__go">${I.arrow}</span>
      </a>`;
    }).join("")}`).join("");
  store.set("vg-seen", S.changelog.reduce((m, c) => (c.date > m ? c.date : m), ""));
  const dot = qs(".bell-dot"); if (dot) dot.hidden = true;
  splitIn(qs(".h-page"));
  reveals();
});
