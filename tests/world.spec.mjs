import { test, expect } from "@playwright/test";

/* The island (home) and the night-time 3D world must run without errors,
   and Plain view must leave every page fully usable. */
test.beforeEach(async ({}, info) => { test.skip(info.project.name !== "desktop", "WebGL2 checks run on desktop Chrome"); });

const watch = (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return errors;
};
const gl2 = (page) => page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));

test("the island loads, Enter starts the tour, and the map travels", async ({ page }) => {
  const errors = watch(page);
  await page.emulateMedia({ reducedMotion: "reduce" }); // travel teleports and text appears at once, so the test is deterministic
  await page.addInitScript(() => { try { sessionStorage.setItem("vg-booted", "1"); localStorage.removeItem("vg-island"); } catch (e) {} });
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

test("Plain view shows the normal home page with all its links", async ({ page }) => {
  await page.addInitScript(() => { try { sessionStorage.setItem("vg-booted", "1"); } catch (e) {} });
  await page.goto("/?plain=1");
  await page.locator(".hdr").waitFor({ state: "attached" });
  await page.waitForTimeout(800);
  await expect(page.locator(".isl")).toHaveCount(0);
  await expect(page.locator(".signal__role")).toBeVisible();
  await expect(page.locator('.signal__cta a[href="/work"]')).toBeVisible();
});

test("at night the 3D world joins /work with no errors", async ({ page }) => {
  const errors = watch(page);
  await page.addInitScript(() => { try { sessionStorage.setItem("vg-booted", "1"); localStorage.setItem("vg-theme", "dark"); localStorage.removeItem("vg-plain"); } catch (e) {} });
  await page.goto("/work");
  await page.locator(".hdr").waitFor({ state: "attached" });
  test.skip(!(await gl2(page)), "no WebGL2 in this browser");
  await expect.poll(() => page.evaluate(() => !!window.VWORLD), { timeout: 15_000 }).toBe(true);
  await expect(page.locator("canvas.world")).toHaveAttribute("aria-hidden", "true");
  expect(errors).toEqual([]);
});

test("Plain view switches the night world off and keeps all content", async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem("vg-plain", "1"); localStorage.setItem("vg-theme", "dark"); sessionStorage.setItem("vg-booted", "1"); } catch (e) {} });
  await page.goto("/work");
  await page.locator(".hdr").waitFor({ state: "attached" });
  await page.waitForTimeout(1500);
  await expect(page.locator("canvas.world")).toHaveCount(0);
  await expect(page.locator(".js-work article").first()).toBeVisible();
  await expect(page.locator(".js-plain")).toHaveAttribute("aria-pressed", "false");
});

test("the Plain view button turns the night world off and on", async ({ page }) => {
  await page.addInitScript(() => { try { sessionStorage.setItem("vg-booted", "1"); localStorage.setItem("vg-theme", "dark"); localStorage.removeItem("vg-plain"); } catch (e) {} });
  await page.goto("/machine");
  test.skip(!(await gl2(page)), "no WebGL2 in this browser");
  await expect.poll(() => page.evaluate(() => !!window.VWORLD), { timeout: 15_000 }).toBe(true);
  await page.locator(".js-plain").click();
  await expect(page.locator("canvas.world")).toHaveCount(0);
  await page.locator(".js-plain").click();
  await expect.poll(() => page.evaluate(() => !!window.VWORLD), { timeout: 15_000 }).toBe(true);
});
