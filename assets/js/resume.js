/* ============================================================
   RESUME — web CV rendered from data.js, prints to A4 PDF.
   No phone number by design; email is revealed on click.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, S, email, copyEmail, useLenis, REDUCED } = window.V;
  useLenis();
  const R = S.resumeDoc, B = S.bench;
  const xp = B.experience.map((x) => `
    <div class="cv__item">
      <div class="cv__row"><b>${x.role} · ${x.org}</b><span>${x.when} · ${x.where}</span></div>
      <div class="cv__sub">${x.text}</div>
      <ul>${x.points.map((p) => `<li>${p}</li>`).join("")}</ul>
    </div>`).join("");
  const pr = R.projects.map((p) => `
    <div class="cv__item">
      <div class="cv__row"><b>${p.title}</b><span>${p.when}</span></div>
      <div class="cv__sub"><a href="https://${p.link}" target="_blank" rel="noopener noreferrer">${p.link}</a></div>
      <ul>${p.points.map((x) => `<li>${x}</li>`).join("")}</ul>
    </div>`).join("");
  const ed = B.education.map((e) => `
    <div class="cv__item"><div class="cv__row"><b>${e.title}</b><span>${e.when}</span></div><div class="cv__sub">${e.where} · ${e.note}</div></div>`).join("");
  const sk = B.skills.map((g) => `<b>${g.group}</b><span>${g.items.join(" · ")}</span>`).join("");
  const ce = S.certificates.filter((c) => !/B\.Tech/.test(c.title)).map((c) => `<li><b>${c.title}</b>, ${c.org} (${c.when}). ${c.note}.</li>`).join("");

  qs(".cv").innerHTML = `
    <h1>${S.name}</h1>
    <div class="cv__role">${R.headline}</div>
    <div class="cv__contact">
      <span>${S.city}, ${S.country}</span>
      <button type="button" class="js-cv-mail">Show email</button>
      <a href="https://vgor15.github.io" >vgor15.github.io</a>
      ${S.socials.filter((s) => s.icon !== "x").map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>`).join("")}
    </div>
    <h2>Summary</h2><p>${R.summary}</p>
    <h2>Experience</h2>${xp}
    <h2>Projects</h2>${pr}
    <h2>Skills</h2><div class="cv__skills">${sk}</div>
    <h2>Education</h2>${ed}
    <h2>Certifications & awards</h2><ul>${ce}</ul>`;

  const mailBtn = qs(".js-cv-mail");
  mailBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = "mailto:" + email(); a.textContent = email();
    mailBtn.replaceWith(a);
  });
  qs(".js-print").addEventListener("click", () => {
    const b = qs(".js-cv-mail");
    if (b) b.click();          // the printed copy should carry the email
    setTimeout(() => window.print(), 50);
  });
  qs(".js-copy").addEventListener("click", copyEmail);
  if (!REDUCED) gsap.from(".cv", { y: 40, opacity: 0, duration: 1, ease: "power3.out", delay: 0.15 });
});
