import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { createStorefrontClient } from "@craveup/storefront-sdk";

// Release guard for the public Leclerc demo, not a constraint on template consumers.
export function verifySandboxDemoEnvironment(env) {
  assert.equal(env.STOREFRONT_PROFILE, "standalone-cli", "Demo must use the standalone profile");
  assert.equal(env.NEXT_PUBLIC_CRAVEUP_API_URL, "https://sandbox-api.craveup.com", "Demo must use Crave External Sandbox");
  assert.equal(env.NEXT_PUBLIC_CRAVEUP_CHECKOUT_ORIGIN, "https://checkout.sandbox.order.page", "Demo checkout must stay in External Sandbox");
  assert.equal(env.STOREFRONT_CANONICAL_ORIGIN, "https://leclerc-bakery.order.page", "Verify the intended demo hostname");
  for (const name of ["DESIGN_SYSTEM_PREVIEW", "STOREFRONT_RUNTIME_MODE", "STOREFRONT_STANDALONE_CONFIG_JSON"]) {
    assert.equal(env[name], undefined, `${name} must be unset for the runnable demo`);
  }
  for (const name of ["NEXT_PUBLIC_CRAVEUP_MERCHANT_SLUG", "NEXT_PUBLIC_CRAVEUP_LOCATION_ID"]) {
    assert.ok(env[name]?.trim() && env[name] === env[name].trim() && env[name] !== "replace-me", `${name} must identify the provisioned demo`);
  }
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith("NEXT_PUBLIC_") || !value) continue;
    assert.ok(!/SECRET|PASSWORD|ACCESS_TOKEN|DATABASE_URL|CRAVEUP_API_KEY/.test(name), `${name} cannot be exposed to the browser`);
    assert.ok(!/(?:sk_(?:test|live)_|rk_(?:test|live)_|crv_(?:test|live)_|postgres(?:ql)?:\/\/)/.test(value), `${name} contains a private credential`);
  }
  return { baseUrl: env.NEXT_PUBLIC_CRAVEUP_API_URL, merchantSlug: env.NEXT_PUBLIC_CRAVEUP_MERCHANT_SLUG, locationId: env.NEXT_PUBLIC_CRAVEUP_LOCATION_ID };
}

export async function verifySandboxDemo(env, clientFactory = createStorefrontClient) {
  const config = verifySandboxDemoEnvironment(env);
  const client = clientFactory({ baseUrl: config.baseUrl });
  const merchant = await client.merchant.getBySlug(config.merchantSlug);
  assert.ok(merchant.locations.some(({ id }) => id === config.locationId), "Demo location must belong to its configured merchant");
  const location = await client.locations.getById(config.locationId);
  assert.equal(location.id, config.locationId);
  const bundle = await client.menus.list(config.locationId, { menuOnly: true });
  const products = bundle.menus.filter((menu) => menu.isActive).flatMap((menu) => menu.categories.flatMap((category) => category.products));
  assert.ok(products.length >= 2, "Published demo menu must include both pastries");
  for (const name of ["Butter croissant", "Pain au chocolat"]) {
    const product = products.find((item) => item.name.toLowerCase() === name.toLowerCase());
    assert.ok(product?.images?.some((image) => image.startsWith("https://")), `${name} needs its published photograph`);
  }
  return { apiOrigin: config.baseUrl, merchantId: merchant.id, locationId: location.id, productCount: products.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifySandboxDemo(process.env).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
    // Provider errors may carry request details. Never serialize credentials or response headers.
    console.error("Sandbox demo acceptance failed:", error instanceof assert.AssertionError ? error.message : "public API request failed; check publication readiness and environment access");
    process.exitCode = 1;
  });
}
