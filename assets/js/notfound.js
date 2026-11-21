document.addEventListener("vg:ready", () => {
  const el = document.querySelector(".js-404");
  el.textContent = `💥CELL_Jr failed💥: ${location.pathname}: No such file or directory`;
});
