import { expect, test } from "@playwright/test";

const origin = process.env.BAKERY_TEST_ORIGIN ?? "http://localhost:4821";

for (const variant of ["home", "category-scroll", "full-menu"]) {
  test(`bakery featured items remain visible in ${variant}`, async ({ page }) => {
    await page.goto(`${origin}/design-system-preview?preset=bakery-editorial&variant=${variant}&controls=0`);
    const featured = page.locator("#most-ordered");
    await expect(featured.getByText("Butter croissant", { exact: true })).toBeVisible();
    await expect(featured.getByText("Pain au chocolat", { exact: true })).toBeVisible();
  });
}

for (const width of [390, 1440]) {
  test(`hosted bakery demo renders decoded images at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(origin);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/design-system-preview\?preset=bakery-editorial&controls=0/);
    await expect(page.getByRole("heading", { name: "A little butter. A better morning." })).toBeVisible();
    await expect(page.getByLabel("Demo notice")).toContainText("No live orders");
    const hero = page.locator(".storefront-preset-hero-media img");
    await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    if (width === 1440) {
      await expect(hero).toHaveAttribute("sizes", /692px.*54vw/);
      expect((await hero.boundingBox())!.width).toBeLessThan(700);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
