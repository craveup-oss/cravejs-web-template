import assert from "node:assert/strict";
import { test } from "node:test";
import { verifySandboxDemo, verifySandboxDemoEnvironment } from "./verify-sandbox-demo.mjs";
const env = {
  STOREFRONT_PROFILE: "standalone-cli",
  NEXT_PUBLIC_CRAVEUP_API_URL: "https://sandbox-api.craveup.com",
  NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN: "https://checkout.sandbox.order.page",
  STOREFRONT_CANONICAL_ORIGIN: "https://leclerc-bakery.order.page",
  NEXT_PUBLIC_CRAVEUP_MERCHANT_SLUG: "bakery",
  NEXT_PUBLIC_CRAVEUP_LOCATION_ID: "demo-location",
};
test("accepts a credential-free external sandbox configuration", () => {
  assert.equal(verifySandboxDemoEnvironment(env).baseUrl, env.NEXT_PUBLIC_CRAVEUP_API_URL);
});
for (const api of ["https://api.craveup.com", "https://dev-api.craveup.com", "https://dev-api-43233223.craveup.com"]) {
  test(`rejects demo deployment against ${api}`, () => assert.throws(() => verifySandboxDemoEnvironment({ ...env, NEXT_PUBLIC_CRAVEUP_API_URL: api })));
}
for (const [name, value] of Object.entries({ DESIGN_SYSTEM_PREVIEW: "1", STOREFRONT_RUNTIME_MODE: "fixture", NEXT_PUBLIC_CRAVEUP_API_KEY: "private", NEXT_PUBLIC_OTHER: "sk_" + "test_synthetic", NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN: "https://checkout.order.page" })) {
  test(`rejects unsafe demo override ${name}`, () => assert.throws(() => verifySandboxDemoEnvironment({ ...env, [name]: value })));
}
const client = (locations = [{ id: "demo-location" }], images = ["https://images.example.test/pastry.webp"]) => ({
  merchant: { getBySlug: async () => ({ id: "merchant", locations }) },
  locations: { getById: async () => ({ id: "demo-location" }) },
  menus: { list: async () => ({ menus: [{ isActive: true, categories: [{ products: ["Butter croissant", "Pain au chocolat"].map((name) => ({ name, images })) }] }] }) },
});
test("requires published menu photography through the SDK", async () => {
  assert.equal((await verifySandboxDemo(env, () => client())).productCount, 2);
  await assert.rejects(verifySandboxDemo(env, () => client(undefined, [])), /photograph/);
});
test("rejects a location outside the configured merchant", async () => {
  await assert.rejects(verifySandboxDemo(env, () => client([{ id: "another-tenant" }])), /belong/);
});
