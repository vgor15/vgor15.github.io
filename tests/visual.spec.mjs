import { test } from "@playwright/test";

/* Screenshots of the main pages on every device, attached to the CI report so a
   pull request can be checked by eye before it goes live. They are not compared
   against stored images, so a design change never fails the build. */
const PAGES = ["/", "/about", "/lab", "/writing", "/bench", "/contact", "/resume", "/lab/can-bus"];

for (const path of PAGES) {
  test(`screenshot ${path}`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => { try { sessionStorage.setItem("vg-booted", "1"); } catch (e) {} });
    await page.goto(path);
    await page.locator("html[data-ready], .hdr").first().waitFor({ state: "attached" });
    await page.waitForTimeout(1200);
    const name = `${info.project.name}${path === "/" ? "-home" : path.replace(/\//g, "-")}.png`;
    await info.attach(name, { body: await page.screenshot({ fullPage: path !== "/" }), contentType: "image/png" });
  });
}
