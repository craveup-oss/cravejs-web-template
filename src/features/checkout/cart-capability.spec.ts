import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fixturePickupCart } from "@/fixtures/cart";
import { createMerchantCartSessionStore, setActiveStorefrontMerchant } from "@/lib/storefront/session-store";
import { createBrowserStorefrontCheckoutActions } from "@/lib/storefront/browser-client";
import { updateOrderTime } from "@/features/fulfillment/time/order-time-runtime";
import { mutateCheckoutAdjustment } from "./checkout-adjustment-runtime";

const merchantSlug = "capability-test";
const runtime = { mode: "live", merchantSlug } as const;
const store = createMerchantCartSessionStore(merchantSlug);
const token = "unit-test-cart-capability";
const cart = { ...fixturePickupCart, revision: 7 };

beforeEach(async () => {
  sessionStorage.clear();
  document.documentElement.dataset.craveApiOrigin = "https://bakery.example";
  setActiveStorefrontMerchant(merchantSlug);
  await store.set({ merchantSlug, locationId: cart.locationId, cartId: cart.id, revision: 7, accessToken: token });
});
afterEach(() => { vi.unstubAllGlobals(); setActiveStorefrontMerchant(null); });

it.each(["pickup-time", "discount"])("keeps the SDK-owned capability after %s and reaches checkout preparation", async (kind) => {
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    calls.push(new URL(url).pathname);
    expect(new Headers(init.headers).get("X-Cart-Token")).toBe(token);
    const data = url.endsWith("/checkout-handoffs")
      ? { checkoutUrl: "https://bakery.example/pay/unit-test", expiresAt: new Date(Date.now() + 60000).toISOString() }
      : { ...cart, revision: 8 };
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json", ETag: '"cart-8"' } });
  }));
  if (kind === "pickup-time") {
    expect((await updateOrderTime(runtime, cart.locationId, { pickupType: "ASAP" })).state).toBe("ready");
  } else {
    expect((await mutateCheckoutAdjustment({ runtime, cart, adjustment: { kind: "remove-discount" }, idempotencyKey: crypto.randomUUID() })).state).toBe("succeeded");
  }
  expect(await store.get(cart.locationId)).toMatchObject({ accessToken: token, revision: 8 });
  await createBrowserStorefrontCheckoutActions(merchantSlug).prepare({ merchantSlug, locationId: cart.locationId, cartId: cart.id, revision: 8, idempotencyKey: crypto.randomUUID() });
  expect(calls.at(-1)).toMatch(/checkout-handoffs$/);
});

it("does not restore an old capability over a replacement cart while a pickup update is in flight", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => {
    await store.set({ merchantSlug, locationId: cart.locationId, cartId: "replacement-cart", revision: 1, accessToken: "replacement-capability" });
    return new Response(JSON.stringify({ ...cart, revision: 8 }), { status: 200, headers: { ETag: '"cart-8"' } });
  }));
  await updateOrderTime(runtime, cart.locationId, { pickupType: "ASAP" });
  expect(await store.get(cart.locationId)).toMatchObject({ cartId: "replacement-cart", revision: 1, accessToken: "replacement-capability" });
  await expect(createBrowserStorefrontCheckoutActions(merchantSlug).prepare({ merchantSlug, locationId: cart.locationId, cartId: cart.id, revision: 8, idempotencyKey: crypto.randomUUID() })).rejects.toMatchObject({ code: "CART_SESSION_MISMATCH" });
});
