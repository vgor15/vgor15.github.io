/* The director decides which world each page gets and loads it lazily.
   Phase 1: every page gets the VOID backdrop. Later phases register
   SIGNAL (home), VAULT (/work), MACHINE (/machine) and TRANSMISSION (/contact). */
const SCENES = {
  default: () => import("./scenes/void.js").then((m) => m.voidScene),
};
// pages that already run their own full-screen canvas keep the stage to themselves
const SKIP = new Set(["board", "contact"]);

export async function direct(engine, page) {
  if (SKIP.has(page)) return null;
  const make = await (SCENES[page] || SCENES.default)();
  const scene = make(engine);
  engine.setScene(scene);
  return scene;
}
