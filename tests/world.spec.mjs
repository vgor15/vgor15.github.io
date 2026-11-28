import { test, expect } from "@playwright/test";

/* The 3D world must join without errors, and Plain view must leave every page fully usable. */
test.beforeEach(async ({}, info) => { test.skip(info.project.name !== "desktop", "WebGL2 checks run on desktop Chrome"); });

test("the world boots on the home page with no errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.addInitScript(() => { try { sessionStorage.setItem("vg-booted", "1"); } catch (e) {} });
  await page.goto("/");
  await page.locator(".hdr").waitFor({ state: "attached" });
  const hasGL2 = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
  test.skip(!hasGL2, "no WebGL2 in this browser");
  await expect.poll(() => page.evaluate(() => !!window.VWORLD), { timeout: 15_000 }).toBe(true);
  await expect(page.locator("canvas.world")).toHaveAttribute("aria-hidden", "true");
  expect(errors).toEqual([]);
});

test("Plain view switches the world off and keeps all content", async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem("vg-plain", "1"); sessionStorage.setItem("vg-booted", "1"); } catch (e) {} });
  await page.goto("/work");
  await page.locator(".hdr").waitFor({ state: "attached" });
  await page.waitForTimeout(1500);
  await expect(page.locator("canvas.world")).toHaveCount(0);
  await expect(page.locator(".js-work article").first()).toBeVisible();
  await expect(page.locator(".js-plain")).toHaveAttribute("aria-pressed", "false");
});

test("the Plain view button turns the world off and on", async ({ page }) => {
  await page.addInitScript(() => { try { sessionStorage.setItem("vg-booted", "1"); } catch (e) {} });
  await page.goto("/machine");
  const hasGL2 = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
  test.skip(!hasGL2, "no WebGL2 in this browser");
  await expect.poll(() => page.evaluate(() => !!window.VWORLD), { timeout: 15_000 }).toBe(true);
  await page.locator(".js-plain").click();
  await expect(page.locator("canvas.world")).toHaveCount(0);
  await page.locator(".js-plain").click();
  await expect.poll(() => page.evaluate(() => !!window.VWORLD), { timeout: 15_000 }).toBe(true);
});
