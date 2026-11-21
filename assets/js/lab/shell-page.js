document.addEventListener("vg:ready", () => {
  window.V.useLenis();
  const api = window.VShell.mount(document.getElementById("term"));
  setTimeout(() => api.focus(), 400);
});
