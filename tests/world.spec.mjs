import { test, expect } from "@playwright/test";

/* The island is the whole website: it must load without errors, every old
   section URL must open it at the right place, the reader must keep visitors
   on the island, and the no-3D storybook must carry all the same content. */
test.beforeEach(async ({}, info) => { test.skip(info.project.name !== "desktop", "WebGL2 checks run on desktop Chrome"); });

const watch = (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return errors;
};
const gl2 = (page) => page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
const fresh = (page) => page.addInitScript(() => { try { localStorage.removeItem("vg-island"); localStorage.removeItem("vg-plain"); } catch (e) {} });

test("the island loads, Enter starts the tour, and the map travels", async ({ page }) => {
  const errors = watch(page);
  await page.emulateMedia({ reducedMotion: "reduce" }); // travel teleports and text appears at once, so the test is deterministic
  await fresh(page);
  await page.goto("/");
  test.skip(!(await gl2(page)), "no WebGL2 in this browser");
  const enter = page.locator(".isl-enter");
  await expect(enter).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("canvas.isl-cv")).toHaveAttribute("aria-hidden", "true");
  await enter.click();
  await expect(page.locator(".isl-dialog")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".isl-dialog__who")).toHaveText("VY-01");
  await expect(page.locator(".isl-toast").first()).toContainText("Hello, world");
  await page.keyboard.press("Escape");
  await page.locator(".js-map").click();
  await expect(page.locator(".isl-sheet")).toBeVisible();
  await page.locator('.js-travel[data-zone="workshop"]').click();
  await expect(page.locator(".isl-dialog__who")).toHaveText("Tink", { timeout: 15_000 });
  await page.locator(".js-dash").click();
  await expect(page.locator(".isl-ach li.is-got").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("old section URLs open the island at their place", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fresh(page);
  await page.goto("/contact");
  test.skip(!(await gl2(page)), "no WebGL2 in this browser");
  await page.locator(".isl-enter").click({ timeout: 20_000 });
  await expect(page.locator(".isl-dialog__who")).toHaveText("Postie", { timeout: 10_000 });
});

test("lab toys open inside the island reader, without the old site chrome", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fresh(page);
  await page.goto("/");
  test.skip(!(await gl2(page)), "no WebGL2 in this browser");
  await page.locator(".isl-enter").click({ timeout: 20_000 });
  await page.locator(".isl-br .js-read").click();
  const frame = page.frameLocator(".isl-reader iframe");
  await expect(page.locator(".isl-reader iframe")).toHaveAttribute("src", /\/resume\?embed=1$/);
  await expect(frame.locator("html.embed")).toBeAttached({ timeout: 10_000 });
  await expect(frame.locator(".hdr")).toBeHidden();
});

test("the storybook (no 3D) carries every place and its content", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/?plain=1");
  await page.locator("html[data-ready]").waitFor({ state: "attached" });
  await expect(page.locator(".isl")).toHaveCount(0);
  for (const id of ["plaza", "workshop", "garden", "house", "library", "notes", "arcade", "busstop", "post"]) await expect(page.locator(`#p-${id}`)).toBeVisible();
  await expect(page.locator("#p-workshop .isl-card").first()).toBeVisible();
  await page.locator("#p-post .js-mail").click();
  await expect(page.locator("#p-post .js-mail-addr")).toContainText("@");
  expect(errors).toEqual([]);
});
