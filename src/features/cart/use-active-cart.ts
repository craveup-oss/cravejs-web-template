"use client";

import useSWR from "swr";
import { createBrowserStorefrontClient } from "@/lib/storefront/browser-client";
import { createMerchantCartSessionStore } from "@/lib/storefront/session-store";
import { getCustomerToken } from "@/lib/storefront/customer-session";
import { useStorefrontApiOrigin } from "@/lib/storefront/public-api-origin";

/** Observe the existing scoped cart. This never starts a session or writes contact. */
export function useActiveCart({ merchantSlug, locationId, mode = "live" }: {
  merchantSlug: string; locationId: string; mode?: "fixture" | "live";
}) {
  const apiOrigin = useStorefrontApiOrigin();
  const resource = useSWR(["active-cart", mode, apiOrigin, merchantSlug, locationId], async () => {
    const sessionStore = createMerchantCartSessionStore(merchantSlug);
    const session = await sessionStore.get(locationId);
    if (!session) return null;
    if (mode === "fixture") {
      const { readFixtureCartSnapshot } = await import("@/fixtures/cart-snapshot");
      return readFixtureCartSnapshot(merchantSlug, locationId);
    }
    const client = createBrowserStorefrontClient({
      sessionStore,
      getAuthToken: () => getCustomerToken(merchantSlug),
    });
    const cart = await client.cart.get(locationId, session.cartId);
    if (cart.locationId !== locationId || cart.id !== session.cartId) {
      throw new Error("Cart scope mismatch");
    }
    return cart;
  }, { revalidateOnMount: true, revalidateOnFocus: false, shouldRetryOnError: false });
  return resource;
}
