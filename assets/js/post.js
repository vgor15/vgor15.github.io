document.addEventListener("vg:ready", () => {
  const { qs, qsa, useLenis, splitIn, reveals, toast } = window.V;
  useLenis();
  splitIn(qs(".post h1"), 0.15);
  reveals();
  qsa(".post .code").forEach((pre) => {
    const b = document.createElement("button");
    b.className = "copy"; b.type = "button"; b.textContent = "Copy";
    b.addEventListener("click", () => navigator.clipboard && navigator.clipboard.writeText(pre.innerText.replace(/^Copy\s*/, "")).then(() => toast("Copied", "code block")));
    pre.prepend(b);
  });
});
